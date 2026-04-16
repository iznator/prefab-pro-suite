import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reply, Smile, Trash2, CheckCheck, Check, FileText, Image as ImageIcon, ExternalLink, Hash } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatMessage } from "@/hooks/useChat";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const EMOJI_QUICK = ["👍", "❤️", "😂", "😮", "🔥", "👏", "🎉", "✅"];

const LEAD_TAG_REGEX = /\[lead:([a-f0-9-]+):([^\]]+)\]/g;

function renderContentWithLeads(content: string, isMe: boolean, navigate: (path: string) => void) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(LEAD_TAG_REGEX.source, "g");

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const leadId = match[1];
    const leadName = match[2];
    parts.push(
      <button
        key={`${leadId}-${match.index}`}
        onClick={(e) => { e.stopPropagation(); navigate(`/leads?lead=${leadId}`); }}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
          isMe
            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
            : "bg-primary/10 hover:bg-primary/20 text-primary"
        }`}
      >
        <Hash className="w-3 h-3" />
        {leadName}
      </button>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}


interface ChatMessageAreaProps {
  messages: ChatMessage[];
  loading: boolean;
  onReply: (msg: ChatMessage) => void;
  onReaction: (msgId: string, emoji: string) => void;
  onDelete: (msgId: string) => void;
}

export function ChatMessageArea({ messages, loading, onReply, onReaction, onDelete }: ChatMessageAreaProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  // Group by date
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  messages.forEach(msg => {
    const date = formatDate(msg.created_at);
    const last = groups[groups.length - 1];
    if (last?.date === date) last.messages.push(msg);
    else groups.push({ date, messages: [msg] });
  });

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Group reactions by emoji
  const groupReactions = (reactions: { emoji: string; user_id: string }[]) => {
    const map = new Map<string, { emoji: string; count: number; reacted: boolean }>();
    reactions.forEach(r => {
      const existing = map.get(r.emoji);
      if (existing) {
        existing.count++;
        if (r.user_id === user?.id) existing.reacted = true;
      } else {
        map.set(r.emoji, { emoji: r.emoji, count: 1, reacted: r.user_id === user?.id });
      }
    });
    return Array.from(map.values());
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3" style={{ background: "hsl(var(--muted) / 0.2)" }}>
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Aucun message. Commencez la conversation !</p>
        </div>
      )}

      {groups.map(group => (
        <div key={group.date}>
          <div className="flex items-center justify-center my-4">
            <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-foreground/10 text-foreground/60">
              {group.date}
            </span>
          </div>

          {group.messages.map((msg, i) => {
            const isMe = msg.user_id === user?.id;
            const prevMsg = i > 0 ? group.messages[i - 1] : null;
            const sameSender = prevMsg?.user_id === msg.user_id;
            const displayName = msg.profile?.display_name || "Utilisateur";
            const reactions = groupReactions(msg.reactions || []);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"} ${sameSender ? "mt-0.5" : "mt-3"} group/msg relative`}
              >
                {/* Avatar for others */}
                {!isMe && !sameSender && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary mr-2 mt-1 flex-shrink-0">
                    {getInitials(displayName)}
                  </div>
                )}
                {!isMe && sameSender && <div className="w-8 mr-2 flex-shrink-0" />}

                <div
                  className={`relative max-w-[70%] px-3 py-1.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border rounded-bl-md"
                  }`}
                >
                  {/* Reply preview */}
                  {msg.reply_to && (
                    <div className={`mb-1.5 pl-2 border-l-2 ${isMe ? "border-primary-foreground/40" : "border-primary/40"} text-[11px] opacity-70`}>
                      <p className="truncate">{(msg.reply_to as any).content}</p>
                    </div>
                  )}

                  {/* Sender name */}
                  {!isMe && !sameSender && (
                    <p className="text-[11px] font-semibold text-primary mb-0.5">{displayName}</p>
                  )}

                  {/* Content by type */}
                  {msg.type === "image" && msg.file_url && (
                    <img src={msg.file_url} alt={msg.file_name || "image"} className="rounded-lg max-h-52 object-cover mb-1 cursor-pointer" />
                  )}
                  {msg.type === "file" && (
                    <a href={msg.file_url || "#"} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${isMe ? "bg-primary-foreground/10" : "bg-muted"}`}>
                      <FileText className="w-5 h-5 flex-shrink-0" />
                      <span className="text-xs truncate">{msg.file_name}</span>
                      <ExternalLink className="w-3 h-3 ml-auto flex-shrink-0 opacity-60" />
                    </a>
                  )}
                  {msg.type === "link" && (
                    <a href={msg.content} target="_blank" rel="noopener noreferrer" className="underline text-xs break-all">
                      {msg.content}
                    </a>
                  )}
                  {msg.type === "text" && msg.content && (
                    <p className="whitespace-pre-wrap break-words">{renderContentWithLeads(msg.content, isMe, navigate)}</p>
                  )}

                  {/* Time */}
                  <div className={`flex items-center gap-1 justify-end mt-0.5 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                    {isMe && <CheckCheck className="w-3 h-3" />}
                  </div>

                  {/* Reactions */}
                  {reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                      {reactions.map(r => (
                        <button
                          key={r.emoji}
                          onClick={() => onReaction(msg.id, r.emoji)}
                          className={`px-1.5 py-0.5 rounded-full text-[11px] border transition-colors ${
                            r.reacted ? "bg-primary/10 border-primary/30" : "bg-muted border-transparent hover:border-border"
                          }`}
                        >
                          {r.emoji} {r.count > 1 && r.count}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Hover actions */}
                  <div className={`absolute top-0 ${isMe ? "-left-24" : "-right-24"} hidden group-hover/msg:flex items-center gap-0.5 bg-card border rounded-lg shadow-sm p-0.5 z-10`}>
                    <button onClick={() => onReply(msg)} className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center" title="Répondre">
                      <Reply className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)} className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center" title="Réaction">
                      <Smile className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {isMe && (
                      <button onClick={() => onDelete(msg.id)} className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    )}
                  </div>

                  {/* Reaction picker */}
                  <AnimatePresence>
                    {showReactions === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`absolute ${isMe ? "right-0" : "left-0"} -top-10 bg-card border rounded-xl shadow-lg p-1.5 flex gap-0.5 z-20`}
                      >
                        {EMOJI_QUICK.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => { onReaction(msg.id, emoji); setShowReactions(null); }}
                            className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center text-sm transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
