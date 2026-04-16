import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, X, Reply, Upload, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ChatMessage } from "@/hooks/useChat";

const EMOJI_LIST = ["😀", "😂", "😍", "🥰", "😎", "🤔", "👍", "👎", "❤️", "🔥", "🎉", "👏", "💪", "🙏", "✅", "⭐", "📌", "📎", "🏠", "💰", "📞", "✉️", "📅", "🔑"];

interface ChatInputProps {
  channelId: string;
  replyTo: ChatMessage | null;
  onClearReply: () => void;
  onSend: (content: string, type: "text" | "image" | "file" | "link", fileUrl?: string, fileName?: string, fileType?: string, replyToId?: string) => Promise<void>;
  members?: { user_id: string; profile?: { display_name: string | null } }[];
  onTyping?: () => void;
}

interface LeadSuggestion {
  id: string;
  first_name: string;
  last_name: string;
  city: string | null;
  status: string;
}

export function ChatInput({ channelId, replyTo, onClearReply, onSend, members, onTyping }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showLeadPicker, setShowLeadPicker] = useState(false);
  const [leadQuery, setLeadQuery] = useState("");
  const [leads, setLeads] = useState<LeadSuggestion[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    inputRef.current?.focus();
  }, [replyTo, channelId]);

  // Fetch leads for autocomplete
  useEffect(() => {
    if (!showLeadPicker) return;
    const fetchLeads = async () => {
      let query = supabase
        .from("leads")
        .select("id, first_name, last_name, city, status")
        .order("last_name", { ascending: true })
        .limit(20);

      if (leadQuery.trim()) {
        query = query.or(`first_name.ilike.%${leadQuery}%,last_name.ilike.%${leadQuery}%,city.ilike.%${leadQuery}%`);
      }

      const { data } = await query;
      setLeads(data || []);
    };
    fetchLeads();
  }, [showLeadPicker, leadQuery]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    onClearReply();
    setShowEmoji(false);
    // Fire and forget — optimistic update handles UI
    onSend(text, "text", undefined, undefined, undefined, replyTo?.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    if (e.key === "@") {
      setShowMentions(true);
      setMentionQuery("");
    }

    if (e.key === "#") {
      setShowLeadPicker(true);
      setLeadQuery("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    onTyping?.();

    // Track mention query
    const lastAt = val.lastIndexOf("@");
    if (lastAt >= 0 && showMentions) {
      setMentionQuery(val.slice(lastAt + 1));
    } else {
      setShowMentions(false);
    }

    // Track lead query
    const lastHash = val.lastIndexOf("#");
    if (lastHash >= 0 && showLeadPicker) {
      setLeadQuery(val.slice(lastHash + 1));
    } else {
      setShowLeadPicker(false);
    }
  };

  const insertMention = (name: string) => {
    const lastAt = input.lastIndexOf("@");
    const before = input.slice(0, lastAt);
    setInput(`${before}@${name} `);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const insertLead = (lead: LeadSuggestion) => {
    const lastHash = input.lastIndexOf("#");
    const before = input.slice(0, lastHash);
    // Format: [lead:UUID:FirstName LastName]
    setInput(`${before}[lead:${lead.id}:${lead.first_name} ${lead.last_name}] `);
    setShowLeadPicker(false);
    inputRef.current?.focus();
  };

  const uploadFile = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const isImage = file.type.startsWith("image/");
    const path = `${user.id}/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("chat-files")
      .upload(path, file);

    if (error) {
      toast.error("Erreur lors de l'upload");
      console.error(error);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);

    await onSend(
      isImage ? "" : file.name,
      isImage ? "image" : "file",
      urlData.publicUrl,
      file.name,
      file.type,
      replyTo?.id
    );
    onClearReply();
    setUploading(false);
    toast.success(`${isImage ? "Image" : "Fichier"} envoyé !`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach(uploadFile);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const files = e.dataTransfer.files;
    if (files?.length) Array.from(files).forEach(uploadFile);
  };

  const filteredMembers = (members || []).filter(m =>
    m.profile?.display_name?.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "qualifié": return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "contacté": return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      case "nouveau": return "bg-amber-500/20 text-amber-700 dark:text-amber-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div
      className="relative"
      onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; if (e.dataTransfer.types.includes("Files")) setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }}
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-2 text-primary">
              <Upload className="w-8 h-8" />
              <span className="text-sm font-semibold">Déposez vos fichiers ici</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 border-t bg-muted/50 overflow-hidden"
          >
            <div className="flex items-center gap-2 py-2">
              <Reply className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-primary">{replyTo.profile?.display_name || "Utilisateur"}</p>
                <p className="text-[11px] text-muted-foreground truncate">{replyTo.content}</p>
              </div>
              <button onClick={onClearReply} className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center">
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
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 border-t bg-card overflow-hidden"
          >
            <div className="flex flex-wrap gap-1 py-2">
              {EMOJI_LIST.map(emoji => (
                <button key={emoji} onClick={() => { setInput(prev => prev + emoji); inputRef.current?.focus(); }}
                  className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center text-lg transition-colors">
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mention suggestions */}
      <AnimatePresence>
        {showMentions && filteredMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-4 right-4 mb-1 bg-card border rounded-lg shadow-lg p-1 z-20 max-h-40 overflow-y-auto"
          >
            {filteredMembers.map(m => (
              <button
                key={m.user_id}
                onClick={() => insertMention(m.profile?.display_name || "user")}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted rounded-md transition-colors"
              >
                @{m.profile?.display_name || "Utilisateur"}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead suggestions */}
      <AnimatePresence>
        {showLeadPicker && leads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-4 right-4 mb-1 bg-card border rounded-lg shadow-lg p-1 z-20 max-h-52 overflow-y-auto"
          >
            <p className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Taguer un lead</p>
            {leads.map(lead => (
              <button
                key={lead.id}
                onClick={() => insertLead(lead)}
                className="w-full text-left px-3 py-2 hover:bg-muted rounded-md transition-colors flex items-center gap-2"
              >
                <Hash className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">{lead.first_name} {lead.last_name}</span>
                {lead.city && <span className="text-[11px] text-muted-foreground">• {lead.city}</span>}
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${getStatusColor(lead.status)}`}>
                  {lead.status}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="border-t bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showEmoji ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
            disabled={uploading}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" className="hidden" onChange={handleFileUpload} />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message... (@mention  #lead)"
            className="flex-1 bg-muted/50 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            disabled={uploading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || uploading}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
