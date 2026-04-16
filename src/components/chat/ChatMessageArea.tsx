import { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reply, Copy, Pin, Trash2, CheckCheck, FileText, ExternalLink, Hash, Forward, CheckSquare, ChevronDown, ArrowDown, Pencil, Play, Pause, Mic } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatMessage } from "@/hooks/useChat";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const EMOJI_QUICK = ["👍", "❤️", "🤣", "🔥", "💯", "🤯"];
const EMOJI_FULL = [
  "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋",
  "😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬",
  "😮‍💨","🤥","🫨","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳",
  "🥸","😎","🤓","🧐","😕","🫤","😟","🙁","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢",
  "😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹",
  "👺","👻","👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾","🙈","🙉","🙊","💋","💌","💘",
  "💝","💖","💗","💓","💞","💕","💟","❣️","💔","❤️‍🔥","❤️‍🩹","❤️","🧡","💛","💚","💙","💜","🤎","🖤","🤍",
  "👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉",
  "👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅",
  "🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄","🫦",
  "🎉","🎊","🎈","🎁","🎄","🎃","🎗️","🎟️","🎫","🏆","🏅","🥇","🥈","🥉","⚽","🏀","🏈","⚾","🥎","🎾",
];

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
  onEdit?: (msgId: string, newContent: string) => void;
  onTogglePin?: (msgId: string) => void;
}

export interface ChatMessageAreaHandle {
  scrollToBottom: () => void;
  getScrollPosition: () => number;
  setScrollPosition: (pos: number) => void;
}

interface ContextMenuState {
  msgId: string;
  x: number;
  y: number;
}

// Swipe-to-reply using trackpad horizontal scroll (no click needed)
function useSwipeToReply(onReply: () => void) {
  const elRef = useRef<HTMLDivElement>(null);
  const accumulatedX = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();
  const triggered = useRef(false);
  const threshold = 80;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Only respond to horizontal scroll (trackpad swipe)
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      if (e.deltaX > 0) return; // Only swipe left (deltaX negative = swipe right gesture = content moves left)

      // Prevent page navigation
      e.preventDefault();

      accumulatedX.current += Math.abs(e.deltaX);

      // Visual feedback
      const clamped = Math.min(accumulatedX.current, 100);
      el.style.transform = `translateX(-${clamped}px)`;
      el.style.transition = "none";

      // Trigger reply
      if (accumulatedX.current > threshold && !triggered.current) {
        triggered.current = true;
        onReply();
        // Haptic-like visual flash
        el.style.transform = "translateX(0)";
        el.style.transition = "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      }

      // Reset after scroll stops
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        accumulatedX.current = 0;
        triggered.current = false;
        if (el) {
          el.style.transition = "transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          el.style.transform = "translateX(0)";
        }
      }, 200);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [onReply]);

  return { elRef };
}

export const ChatMessageArea = forwardRef<ChatMessageAreaHandle, ChatMessageAreaProps>(
  function ChatMessageArea({ messages, loading, onReply, onReaction, onDelete, onEdit, onTogglePin }, ref) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
  const [emojiExpanded, setEmojiExpanded] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "instant") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => scrollToBottom("instant"),
    getScrollPosition: () => containerRef.current?.scrollTop ?? 0,
    setScrollPosition: (pos: number) => { if (containerRef.current) containerRef.current.scrollTop = pos; },
  }), [scrollToBottom]);

  // Track if user is near bottom
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollBtn(!nearBottom);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Auto-scroll on new messages if near bottom
  const prevCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevCount.current && !showScrollBtn) {
      scrollToBottom("instant");
    }
    prevCount.current = messages.length;
  }, [messages.length, showScrollBtn, scrollToBottom]);

  // Initial scroll
  useEffect(() => {
    scrollToBottom("instant");
  }, []);

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => { setCtxMenu(null); setEmojiExpanded(false); };
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
    const x = Math.min(e.clientX - rect.left, rect.width - 240);
    const y = Math.min(e.clientY - rect.top, rect.height - 380);
    setCtxMenu({ msgId, x: Math.max(0, x), y: Math.max(0, y) });
    setEmojiExpanded(false);
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
      className="flex-1 overflow-y-auto px-4 py-3 relative scroll-smooth"
      style={{ background: "linear-gradient(180deg, hsl(var(--muted) / 0.15) 0%, hsl(var(--muted) / 0.05) 100%)" }}
    >
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Aucun message. Commencez la conversation !</p>
        </div>
      )}

      {groups.map(group => (
        <div key={group.date}>
          <div className="flex items-center justify-center my-4">
            <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-foreground/8 text-foreground/50 backdrop-blur-sm shadow-sm">
              {group.date}
            </span>
          </div>

          {group.messages.map((msg, i) => (
            <SwipeableMessage
              key={msg.id}
              msg={msg}
              prevMsg={i > 0 ? group.messages[i - 1] : null}
              user={user}
              navigate={navigate}
              highlightedId={highlightedId}
              onReply={onReply}
              onReaction={onReaction}
              onContextMenu={handleContextMenu}
              scrollToMessage={scrollToMessage}
              groupReactions={groupReactions}
              getInitials={getInitials}
              formatTime={formatTime}
            />
          ))}
        </div>
      ))}

      {/* Context menu */}
      <AnimatePresence>
        {ctxMenu && ctxMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute z-50 bg-card border rounded-2xl shadow-xl overflow-hidden"
            style={{ left: ctxMenu.x, top: ctxMenu.y, minWidth: 220 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b">
              <div className="flex items-center gap-0.5 px-3 py-2">
                {EMOJI_QUICK.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { onReaction(ctxMenu.msgId, emoji); setCtxMenu(null); }}
                    className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-lg transition-all duration-100 hover:scale-125 active:scale-90"
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  onClick={(e) => { e.stopPropagation(); setEmojiExpanded(!emojiExpanded); }}
                  className={`w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-all duration-200 ${emojiExpanded ? "bg-muted rotate-180" : ""}`}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <AnimatePresence>
                {emojiExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 200, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="h-[200px] overflow-y-auto px-2 pb-2">
                      <div className="grid grid-cols-8 gap-0.5">
                        {EMOJI_FULL.map((emoji, idx) => (
                          <button
                            key={idx}
                            onClick={() => { onReaction(ctxMenu.msgId, emoji); setCtxMenu(null); }}
                            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-lg transition-all duration-100 hover:scale-110 active:scale-90"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="py-1">
              <CtxMenuItem icon={<Reply className="w-4 h-4" />} label="Répondre" onClick={() => { onReply(ctxMsg); setCtxMenu(null); }} />
              <CtxMenuItem icon={<Copy className="w-4 h-4" />} label="Copier le texte" onClick={() => handleCopy(ctxMsg.content || "")} />
              <CtxMenuItem icon={<Pin className="w-4 h-4" />} label={ctxMsg.is_pinned ? "Désépingler" : "Épingler"} onClick={() => { onTogglePin?.(ctxMenu.msgId); setCtxMenu(null); }} />
              <CtxMenuItem icon={<Forward className="w-4 h-4" />} label="Transférer" onClick={() => { toast.info("Bientôt disponible"); setCtxMenu(null); }} />
              {ctxMsg.user_id === user?.id && (
                <CtxMenuItem icon={<Pencil className="w-4 h-4" />} label="Éditer" onClick={() => {
                  const newContent = prompt("Modifier le message :", ctxMsg.content || "");
                  if (newContent && newContent !== ctxMsg.content) { onEdit?.(ctxMenu.msgId, newContent); }
                  setCtxMenu(null);
                }} />
              )}
              {ctxMsg.user_id === user?.id && (
                <CtxMenuItem icon={<Trash2 className="w-4 h-4 text-destructive" />} label="Supprimer" className="text-destructive" onClick={() => { onDelete(ctxMenu.msgId); setCtxMenu(null); }} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to bottom FAB */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => scrollToBottom("smooth")}
            className="sticky bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-card border shadow-lg flex items-center justify-center hover:bg-muted transition-colors z-30 ml-auto mr-auto"
          >
            <ArrowDown className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
});

// Swipeable message row
function SwipeableMessage({
  msg, prevMsg, user, navigate, highlightedId,
  onReply, onReaction, onContextMenu, scrollToMessage, groupReactions, getInitials, formatTime,
}: {
  msg: ChatMessage;
  prevMsg: ChatMessage | null;
  user: any;
  navigate: (path: string) => void;
  highlightedId: string | null;
  onReply: (msg: ChatMessage) => void;
  onReaction: (msgId: string, emoji: string) => void;
  onContextMenu: (e: React.MouseEvent, msgId: string) => void;
  scrollToMessage: (id: string) => void;
  groupReactions: (reactions: { emoji: string; user_id: string }[]) => { emoji: string; count: number; reacted: boolean }[];
  getInitials: (name: string | null | undefined) => string;
  formatTime: (date: string) => string;
}) {
  const isMe = msg.user_id === user?.id;
  const sameSender = prevMsg?.user_id === msg.user_id;
  const displayName = msg.profile?.display_name || "Utilisateur";
  const reactions = groupReactions(msg.reactions || []);
  const isHighlighted = highlightedId === msg.id;
  const isOptimistic = msg.id.startsWith("opt-");

  const swipe = useSwipeToReply(() => onReply(msg));

  return (
    <div
      id={`msg-${msg.id}`}
      className={`${sameSender ? "mt-[3px]" : "mt-3"} relative overflow-hidden`}
      onContextMenu={(e) => onContextMenu(e, msg.id)}
    >
      {/* Swipe reply indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
        <Reply className="w-5 h-5 text-primary" />
      </div>

      <div
        ref={swipe.elRef}
        className={`flex ${isMe ? "justify-end" : "justify-start"} group/msg touch-pan-y`}
        style={{ willChange: "transform" }}
      >
        {/* Avatar */}
        {!isMe && !sameSender && (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary mr-2 mt-1 flex-shrink-0 shadow-sm">
            {getInitials(displayName)}
          </div>
        )}
        {!isMe && sameSender && <div className="w-8 mr-2 flex-shrink-0" />}

        {/* Hover reply */}
        <button
          onClick={() => onReply(msg)}
          className={`self-center opacity-0 group-hover/msg:opacity-50 hover:!opacity-100 transition-opacity duration-100 p-1 rounded-full ${
            isMe ? "order-first mr-1" : "order-last ml-1"
          }`}
          title="Répondre"
        >
          <Reply className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Bubble */}
        <div
          className={`relative max-w-[70%] px-3 py-[7px] text-[13.5px] leading-[1.45] transition-all duration-300 ${
            isMe
              ? `bg-[#EFFDDE] dark:bg-[#2B5D3E] text-[#1a3a2a] dark:text-[#E8F5E0] shadow-sm ${sameSender ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-br-md"}`
              : `bg-white dark:bg-[#212121] text-foreground shadow-sm ${sameSender ? "rounded-2xl rounded-bl-md" : "rounded-2xl rounded-bl-md"}`
          } ${isHighlighted ? "ring-2 ring-primary/50 scale-[1.01]" : ""}`}
        >
          {!sameSender && (
            <div className={`absolute top-0 w-3 h-3 ${
              isMe ? "-right-1.5 bg-[#EFFDDE] dark:bg-[#2B5D3E]" : "-left-1.5 bg-white dark:bg-[#212121]"
            }`} style={{
              clipPath: isMe ? "polygon(0 0, 100% 0, 0 100%)" : "polygon(100% 0, 0 0, 100% 100%)"
            }} />
          )}

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

          {!isMe && !sameSender && (
            <p className="text-[11px] font-bold text-primary mb-0.5">{displayName}</p>
          )}

          {msg.type === "image" && msg.file_url && (
            <img src={msg.file_url} alt={msg.file_name || "image"} loading="lazy"
              className="rounded-lg max-h-52 object-cover mb-1 cursor-pointer hover:brightness-95 transition-all" />
          )}
          {msg.type === "file" && msg.file_type?.startsWith("audio/") && msg.file_url && (
            <VoiceMessagePlayer src={msg.file_url} isMe={isMe} />
          )}
          {msg.type === "file" && !msg.file_type?.startsWith("audio/") && (
            <a href={msg.file_url || "#"} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-2 p-2 rounded-lg mb-1 transition-colors ${
                isMe ? "bg-[#d4f5d4]/60 dark:bg-[#1e4d2e]/60 hover:bg-[#c4e8c4]/80" : "bg-muted hover:bg-muted/80"
              }`}>
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

          <div className={`flex items-center gap-1 justify-end mt-0.5 ${
            isMe ? "text-[#6aae6a] dark:text-[#81C784]/70" : "text-muted-foreground/60"
          }`}>
            {msg.edited_at && <span className="text-[9px] italic opacity-60">modifié</span>}
            {msg.is_pinned && <Pin className="w-2.5 h-2.5 opacity-60" />}
            <span className="text-[10px]">{formatTime(msg.created_at)}</span>
            {isMe && <CheckCheck className="w-3.5 h-3.5" />}
          </div>

          {reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
              {reactions.map(r => (
                <button key={r.emoji} onClick={() => onReaction(msg.id, r.emoji)}
                  className={`px-2 py-0.5 rounded-full text-[12px] border transition-all duration-150 hover:scale-110 active:scale-95 ${
                    r.reacted ? "bg-primary/10 border-primary/30 shadow-sm" : "bg-background/80 border-transparent hover:border-border"
                  }`}>
                  {r.emoji} {r.count > 1 && <span className="text-[10px] ml-0.5">{r.count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Global ref to stop any currently playing voice message
let currentlyPlayingAudio: HTMLAudioElement | null = null;
let currentlyPlayingSetPlaying: ((v: boolean) => void) | null = null;

// Telegram-style voice message player with waveform + speed control
function VoiceMessagePlayer({ src, isMe }: { src: string; isMe: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate pseudo-waveform bars (deterministic from src hash)
  const [bars] = useState<number[]>(() => {
    let hash = 0;
    for (let i = 0; i < src.length; i++) hash = ((hash << 5) - hash + src.charCodeAt(i)) | 0;
    const result: number[] = [];
    for (let i = 0; i < 40; i++) {
      hash = ((hash * 1103515245 + 12345) & 0x7fffffff);
      result.push(0.15 + (hash % 100) / 100 * 0.85);
    }
    return result;
  });

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      currentlyPlayingAudio = null;
      currentlyPlayingSetPlaying = null;
    } else {
      // Stop any other playing voice message first
      if (currentlyPlayingAudio && currentlyPlayingAudio !== a) {
        currentlyPlayingAudio.pause();
        currentlyPlayingSetPlaying?.(false);
      }
      currentlyPlayingAudio = a;
      currentlyPlayingSetPlaying = setPlaying;
      a.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2, 3];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const handleTimeUpdate = () => {
    const a = audioRef.current;
    if (!a || !isFinite(a.duration) || a.duration === 0) return;
    setProgress(a.currentTime / a.duration);
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
    currentlyPlayingAudio = null;
    currentlyPlayingSetPlaying = null;
  };

  const handleLoaded = () => {
    const a = audioRef.current;
    if (a && isFinite(a.duration) && a.duration > 0) {
      setDuration(a.duration);
    }
  };

  const seekFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !isFinite(a.duration) || a.duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * a.duration;
    setProgress(ratio);
  };

  const handleBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    seekFromEvent(e);
    const bar = e.currentTarget;
    const onMove = (ev: MouseEvent) => {
      const a = audioRef.current;
      if (!a || !isFinite(a.duration) || a.duration === 0) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      a.currentTime = ratio * a.duration;
      setProgress(ratio);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const fmt = (s: number) => {
    if (!isFinite(s) || isNaN(s) || s <= 0) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const displayTime = playing && isFinite(duration) && duration > 0
    ? fmt(progress * duration)
    : fmt(duration);

  return (
    <div className="flex items-center gap-2.5 py-1.5 min-w-[220px] max-w-[320px]">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoaded}
        onDurationChange={handleLoaded}
      />

      {/* Play button - big green circle like Telegram */}
      <button
        onClick={toggle}
        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-95 ${
          isMe
            ? "bg-[#4CAF50] hover:bg-[#43A047] text-white"
            : "bg-primary hover:bg-primary/90 text-primary-foreground"
        }`}
      >
        {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        {/* Waveform */}
        <div className="flex items-end gap-[1.5px] h-[26px] cursor-pointer" onMouseDown={handleBarMouseDown}>
          {bars.map((h, i) => {
            const barProgress = i / bars.length;
            const isPlayed = barProgress <= progress;
            return (
              <div
                key={i}
                className={`w-[3px] rounded-full transition-colors duration-75 ${
                  isPlayed
                    ? isMe ? "bg-[#4CAF50]" : "bg-primary"
                    : isMe ? "bg-[#4CAF50]/30" : "bg-primary/25"
                }`}
                style={{ height: `${h * 26}px` }}
              />
            );
          })}
        </div>

        {/* Duration + speed */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] opacity-60 font-mono">{displayTime}</span>
          {playing && (
            <button
              onClick={cycleSpeed}
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                isMe ? "bg-[#4CAF50]/20 hover:bg-[#4CAF50]/30" : "bg-primary/10 hover:bg-primary/20"
              }`}
            >
              {speed}x
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CtxMenuItem({ icon, label, onClick, className = "" }: { icon: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${className}`}>
      {icon}
      {label}
    </button>
  );
}
