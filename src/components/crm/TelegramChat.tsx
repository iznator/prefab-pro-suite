import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Paperclip, Smile, Reply, X, Image, FileText, Check, CheckCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { ChatMessage } from "@/data/mockData";

interface Message {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isMe: boolean;
  type: "text" | "image" | "file";
  fileName?: string;
  fileUrl?: string;
  replyTo?: { author: string; content: string };
  reactions?: { emoji: string; count: number; reacted: boolean }[];
  read: boolean;
}

const EMOJI_QUICK = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"];

interface TelegramChatProps {
  messages: ChatMessage[];
  leadName: string;
}

export function TelegramChat({ messages: initialMessages, leadName }: TelegramChatProps) {
  const [msgs, setMsgs] = useState<Message[]>(() =>
    initialMessages.map((m, i) => ({
      id: m.id,
      author: m.author,
      content: m.content,
      createdAt: m.createdAt,
      isMe: m.author === "Vous" || m.author === "Sophie Martin",
      type: "text" as const,
      reactions: [],
      read: true,
    }))
  );
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [msgs, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [replyTo]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      author: "Vous",
      content: text,
      createdAt: new Date().toISOString(),
      isMe: true,
      type: "text",
      replyTo: replyTo ? { author: replyTo.author, content: replyTo.content } : undefined,
      reactions: [],
      read: false,
    };

    setMsgs(prev => [...prev, newMsg]);
    setInput("");
    setReplyTo(null);
    setShowEmoji(false);

    // Simulate read receipt
    setTimeout(() => {
      setMsgs(prev => prev.map(m => m.id === newMsg.id ? { ...m, read: true } : m));
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    Array.from(files).forEach(file => {
      const isImage = file.type.startsWith("image/");
      const newMsg: Message = {
        id: `msg-${Date.now()}-${file.name}`,
        author: "Vous",
        content: isImage ? "" : file.name,
        createdAt: new Date().toISOString(),
        isMe: true,
        type: isImage ? "image" : "file",
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        reactions: [],
        read: false,
      };
      setMsgs(prev => [...prev, newMsg]);
      toast.success(`${isImage ? "Image" : "Fichier"} envoyé !`);
    });

    e.target.value = "";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (!files?.length) return;

    Array.from(files).forEach(file => {
      const isImage = file.type.startsWith("image/");
      const newMsg: Message = {
        id: `msg-${Date.now()}-${file.name}`,
        author: "Vous",
        content: isImage ? "" : file.name,
        createdAt: new Date().toISOString(),
        isMe: true,
        type: isImage ? "image" : "file",
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        reactions: [],
        read: false,
      };
      setMsgs(prev => [...prev, newMsg]);
      toast.success(`${isImage ? "Image" : "Fichier"} envoyé !`);
    });
  };

  const addReaction = (msgId: string, emoji: string) => {
    setMsgs(prev =>
      prev.map(m => {
        if (m.id !== msgId) return m;
        const existing = m.reactions?.find(r => r.emoji === emoji);
        if (existing) {
          return {
            ...m,
            reactions: m.reactions?.map(r =>
              r.emoji === emoji
                ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted }
                : r
            ).filter(r => r.count > 0),
          };
        }
        return {
          ...m,
          reactions: [...(m.reactions || []), { emoji, count: 1, reacted: true }],
        };
      })
    );
    setShowReactions(null);
  };

  const insertEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const groupByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
      const last = groups[groups.length - 1];
      if (last?.date === date) {
        last.messages.push(msg);
      } else {
        groups.push({ date, messages: [msg] });
      }
    });
    return groups;
  };

  const grouped = groupByDate(msgs);

  return (
    <div
      className="flex flex-col h-[420px] relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-2 text-primary">
              <Upload className="w-10 h-10" />
              <span className="text-sm font-semibold">Déposez vos fichiers ici</span>
              <span className="text-xs text-muted-foreground">Images, PDF, documents…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
        style={{ background: "hsl(var(--muted) / 0.3)" }}
      >
        {msgs.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Démarrez la conversation avec {leadName}</p>
          </div>
        )}

        {grouped.map(group => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-foreground/10 text-foreground/60">
                {group.date}
              </span>
            </div>

            {group.messages.map((msg, i) => {
              const prevMsg = i > 0 ? group.messages[i - 1] : null;
              const sameSender = prevMsg?.isMe === msg.isMe;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`flex ${msg.isMe ? "justify-end" : "justify-start"} ${sameSender ? "mt-0.5" : "mt-2"} group/msg relative`}
                >
                  <div
                    className={`relative max-w-[75%] px-3 py-1.5 rounded-2xl text-sm leading-relaxed ${
                      msg.isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border rounded-bl-md"
                    }`}
                  >
                    {/* Reply preview */}
                    {msg.replyTo && (
                      <div className={`mb-1.5 pl-2 border-l-2 ${msg.isMe ? "border-primary-foreground/40" : "border-primary/40"} text-[11px] opacity-70`}>
                        <span className="font-semibold">{msg.replyTo.author}</span>
                        <p className="truncate">{msg.replyTo.content}</p>
                      </div>
                    )}

                    {/* Sender name (not me) */}
                    {!msg.isMe && !sameSender && (
                      <p className="text-[11px] font-semibold text-primary mb-0.5">{msg.author}</p>
                    )}

                    {/* Content */}
                    {msg.type === "image" && msg.fileUrl && (
                      <img src={msg.fileUrl} alt="upload" className="rounded-lg max-h-48 object-cover mb-1" />
                    )}
                    {msg.type === "file" && (
                      <div className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${msg.isMe ? "bg-primary-foreground/10" : "bg-muted"}`}>
                        <FileText className="w-5 h-5 flex-shrink-0" />
                        <span className="text-xs truncate">{msg.fileName}</span>
                      </div>
                    )}
                    {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                    {/* Time + read receipt */}
                    <div className={`flex items-center gap-1 justify-end mt-0.5 ${msg.isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                      {msg.isMe && (
                        msg.read
                          ? <CheckCheck className="w-3 h-3" />
                          : <Check className="w-3 h-3" />
                      )}
                    </div>

                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${msg.isMe ? "justify-end" : "justify-start"}`}>
                        {msg.reactions.map(r => (
                          <button
                            key={r.emoji}
                            onClick={() => addReaction(msg.id, r.emoji)}
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
                    <div className={`absolute top-0 ${msg.isMe ? "-left-20" : "-right-20"} hidden group-hover/msg:flex items-center gap-0.5 bg-card border rounded-lg shadow-sm p-0.5`}>
                      <button
                        onClick={() => setReplyTo(msg)}
                        className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
                        title="Répondre"
                      >
                        <Reply className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                        className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
                        title="Réaction"
                      >
                        <Smile className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Reaction picker */}
                    <AnimatePresence>
                      {showReactions === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`absolute ${msg.isMe ? "right-0" : "left-0"} -top-10 bg-card border rounded-xl shadow-lg p-1.5 flex gap-0.5 z-10`}
                        >
                          {EMOJI_QUICK.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(msg.id, emoji)}
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
      </div>

      {/* Reply bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 border-t bg-muted/50 overflow-hidden"
          >
            <div className="flex items-center gap-2 py-2">
              <Reply className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-primary">{replyTo.author}</p>
                <p className="text-[11px] text-muted-foreground truncate">{replyTo.content}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 border-t bg-card overflow-hidden"
          >
            <div className="flex flex-wrap gap-1 py-2">
              {["😀", "😂", "😍", "🥰", "😎", "🤔", "👍", "👎", "❤️", "🔥", "🎉", "👏", "💪", "🙏", "✅", "⭐", "📌", "📎", "🏠", "💰", "📞", "✉️", "📅", "🔑"].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="border-t bg-card px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showEmoji ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message..."
            className="flex-1 bg-muted/50 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
