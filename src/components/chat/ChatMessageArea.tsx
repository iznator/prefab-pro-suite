import { useRef, useEffect, useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reply, Copy, Pin, Trash2, CheckCheck, FileText, ExternalLink, Hash, Forward, CheckSquare, Smile } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatMessage } from "@/hooks/useChat";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const EMOJI_QUICK = ["👍", "❤️", "🤣", "🔥", "💯", "🤯"];

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
            ? "bg-white/20 hover:bg-white/30 text-white"
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

interface ContextMenuState {
  msgId: string;
  x: number;
  y: number;
}

export function ChatMessageArea({ messages, loading, onReply, onReaction, onDelete }: ChatMessageAreaProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);

  // Auto-scroll — instant for new messages, smooth for navigating
  const isNearBottom = useRef(true);

  const checkNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkNearBottom, { passive: true });
    return () => el.removeEventListener("scroll", checkNearBottom);
  }, [checkNearBottom]);

  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
    }
  }, [messages.length]);

  // Close context menu on scroll or outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    containerRef.current?.addEventListener("scroll", close);
    return () => {
      window.removeEventListener("click", close);
      containerRef.current?.removeEventListener("scroll", close);
    };
  }, [ctxMenu]);

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(messageId);
    setTimeout(() => setHighlightedId(null), 1800);
  }, []);

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

  const handleContextMenu = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Clamp menu position within viewport
    const x = Math.min(e.clientX - rect.left, rect.width - 220);
    const y = Math.min(e.clientY - rect.top, rect.height - 320);
    setCtxMenu({ msgId, x, y });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Texte copié");
    setCtxMenu(null);
  };

  const ctxMsg = ctxMenu ? messages.find(m => m.id === ctxMenu.msgId) : null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-3 relative"
      style={{ background: "linear-gradient(180deg, hsl(var(--muted) / 0.15) 0%, hsl(var(--muted) / 0.05) 100%)" }}
    >
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Aucun message. Commencez la conversation !</p>
        </div>
      )}

      {groups.map(group => (
        <div key={group.date}>
          {/* Date separator */}
          <div className="flex items-center justify-center my-4">
            <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-foreground/8 text-foreground/50 backdrop-blur-sm shadow-sm">
              {group.date}
            </span>
          </div>

          {group.messages.map((msg, i) => {
            const isMe = msg.user_id === user?.id;
            const prevMsg = i > 0 ? group.messages[i - 1] : null;
            const sameSender = prevMsg?.user_id === msg.user_id;
            const displayName = msg.profile?.display_name || "Utilisateur";
            const reactions = groupReactions(msg.reactions || []);
            const isHighlighted = highlightedId === msg.id;
            const isOptimistic = msg.id.startsWith("opt-");

            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`flex ${isMe ? "justify-end" : "justify-start"} ${sameSender ? "mt-[3px]" : "mt-3"} group/msg relative`}
                onContextMenu={(e) => handleContextMenu(e, msg.id)}
              >
                {/* Avatar for others */}
                {!isMe && !sameSender && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary mr-2 mt-1 flex-shrink-0 shadow-sm">
                    {getInitials(displayName)}
                  </div>
                )}
                {!isMe && sameSender && <div className="w-8 mr-2 flex-shrink-0" />}

                {/* Discrete hover reply icon — Telegram style */}
                <button
                  onClick={() => onReply(msg)}
                  className={`self-center opacity-0 group-hover/msg:opacity-60 hover:!opacity-100 transition-opacity duration-100 p-1 rounded-full ${
                    isMe ? "order-first mr-1" : "order-last ml-1"
                  }`}
                  title="Répondre"
                >
                  <Reply className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Message bubble */}
                <div
                  className={`relative max-w-[70%] px-3 py-[7px] text-[13.5px] leading-[1.45] transition-all duration-300 ${
                    isMe
                      ? `bg-[#EFFDDE] dark:bg-[#2B5D3E] text-[#1a3a2a] dark:text-[#E8F5E0] shadow-sm ${
                          sameSender ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-br-md"
                        }`
                      : `bg-white dark:bg-[#212121] text-foreground shadow-sm ${
                          sameSender ? "rounded-2xl rounded-bl-md" : "rounded-2xl rounded-bl-md"
                        }`
                  } ${isHighlighted ? "ring-2 ring-primary/50 scale-[1.01]" : ""} ${isOptimistic ? "opacity-70" : ""}`}
                >
                  {/* Tail */}
                  {!sameSender && (
                    <div className={`absolute top-0 w-3 h-3 ${
                      isMe
                        ? "-right-1.5 bg-[#EFFDDE] dark:bg-[#2B5D3E]"
                        : "-left-1.5 bg-white dark:bg-[#212121]"
                    }`} style={{
                      clipPath: isMe
                        ? "polygon(0 0, 100% 0, 0 100%)"
                        : "polygon(100% 0, 0 0, 100% 100%)"
                    }} />
                  )}

                  {/* Reply preview */}
                  {msg.reply_to && (
                    <button
                      onClick={() => scrollToMessage((msg.reply_to as any).id || msg.reply_to_id!)}
                      className={`mb-1.5 w-full text-left pl-2 border-l-2 rounded-sm ${
                        isMe
                          ? "border-[#4CAF50] dark:border-[#81C784] bg-[#d4f5d4]/40 dark:bg-[#1e4d2e]/40"
                          : "border-primary/50 bg-primary/5"
                      } py-1 transition-colors hover:brightness-95`}
                    >
                      <p className="text-[11px] font-semibold text-primary/80 truncate">
                        {(msg.reply_to as any)?.profile?.display_name || "Utilisateur"}
                      </p>
                      <p className="text-[11px] opacity-70 truncate">{(msg.reply_to as any).content}</p>
                    </button>
                  )}

                  {/* Sender name */}
                  {!isMe && !sameSender && (
                    <p className="text-[11px] font-bold text-primary mb-0.5">{displayName}</p>
                  )}

                  {/* Content */}
                  {msg.type === "image" && msg.file_url && (
                    <img
                      src={msg.file_url}
                      alt={msg.file_name || "image"}
                      loading="lazy"
                      className="rounded-lg max-h-52 object-cover mb-1 cursor-pointer hover:brightness-95 transition-all"
                    />
                  )}
                  {msg.type === "file" && (
                    <a
                      href={msg.file_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 p-2 rounded-lg mb-1 transition-colors ${
                        isMe ? "bg-[#d4f5d4]/60 dark:bg-[#1e4d2e]/60 hover:bg-[#c4e8c4]/80" : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <FileText className="w-5 h-5 flex-shrink-0 text-primary" />
                      <span className="text-xs truncate font-medium">{msg.file_name}</span>
                      <ExternalLink className="w-3 h-3 ml-auto flex-shrink-0 opacity-50" />
                    </a>
                  )}
                  {msg.type === "link" && (
                    <a href={msg.content} target="_blank" rel="noopener noreferrer" className="underline text-xs break-all text-primary">
                      {msg.content}
                    </a>
                  )}
                  {msg.type === "text" && msg.content && (
                    <p className="whitespace-pre-wrap break-words">{renderContentWithLeads(msg.content, isMe, navigate)}</p>
                  )}

                  {/* Time + check */}
                  <div className={`flex items-center gap-1 justify-end mt-0.5 ${
                    isMe ? "text-[#6aae6a] dark:text-[#81C784]/70" : "text-muted-foreground/60"
                  }`}>
                    <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                    {isMe && <CheckCheck className={`w-3.5 h-3.5 ${isOptimistic ? "opacity-40" : ""}`} />}
                  </div>

                  {/* Reactions */}
                  {reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                      {reactions.map(r => (
                        <button
                          key={r.emoji}
                          onClick={() => onReaction(msg.id, r.emoji)}
                          className={`px-2 py-0.5 rounded-full text-[12px] border transition-all duration-150 hover:scale-110 active:scale-95 ${
                            r.reacted
                              ? "bg-primary/10 border-primary/30 shadow-sm"
                              : "bg-background/80 border-transparent hover:border-border"
                          }`}
                        >
                          {r.emoji} {r.count > 1 && <span className="text-[10px] ml-0.5">{r.count}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Telegram-style right-click context menu */}
      <AnimatePresence>
        {ctxMenu && ctxMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute z-50 bg-card border rounded-2xl shadow-xl overflow-hidden"
            style={{ left: ctxMenu.x, top: ctxMenu.y, minWidth: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick emoji row */}
            <div className="flex items-center gap-0.5 px-3 py-2.5 border-b">
              {EMOJI_QUICK.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onReaction(ctxMenu.msgId, emoji); setCtxMenu(null); }}
                  className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center text-xl transition-all duration-100 hover:scale-125 active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Action list */}
            <div className="py-1">
              <CtxMenuItem icon={<Reply className="w-4 h-4" />} label="Répondre" onClick={() => { onReply(ctxMsg); setCtxMenu(null); }} />
              <CtxMenuItem icon={<Copy className="w-4 h-4" />} label="Copier le texte" onClick={() => handleCopy(ctxMsg.content || "")} />
              <CtxMenuItem icon={<Pin className="w-4 h-4" />} label="Épingler" onClick={() => { toast.info("Bientôt disponible"); setCtxMenu(null); }} />
              <CtxMenuItem icon={<Forward className="w-4 h-4" />} label="Transférer" onClick={() => { toast.info("Bientôt disponible"); setCtxMenu(null); }} />
              {ctxMsg.user_id === user?.id && (
                <CtxMenuItem icon={<Trash2 className="w-4 h-4 text-destructive" />} label="Supprimer" className="text-destructive" onClick={() => { onDelete(ctxMenu.msgId); setCtxMenu(null); }} />
              )}
              <CtxMenuItem icon={<CheckSquare className="w-4 h-4" />} label="Sélectionner" onClick={() => { toast.info("Bientôt disponible"); setCtxMenu(null); }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
}

function CtxMenuItem({ icon, label, onClick, className = "" }: { icon: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}
