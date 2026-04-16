import { useState, useCallback, useRef } from "react";
import { ChatChannelList } from "@/components/chat/ChatChannelList";
import { ChatMessageArea, type ChatMessageAreaHandle } from "@/components/chat/ChatMessageArea";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMediaPanel } from "@/components/chat/ChatMediaPanel";
import { ChatMembersPanel } from "@/components/chat/ChatMembersPanel";
import { CreateChannelDialog } from "@/components/chat/CreateChannelDialog";
import { useChannels, useMessages, useChannelMembers, type ChatMessage } from "@/hooks/useChat";
import { useChatPresence, useGlobalPresence } from "@/hooks/useChatPresence";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import { Pin } from "lucide-react";

export default function ChatPage() {
  const { channels, loading: channelsLoading, createChannel, refreshChannels } = useChannels();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const [recapContent, setRecapContent] = useState<string | null>(null);
  const [messageSearch, setMessageSearch] = useState("");
  const messageAreaRef = useRef<ChatMessageAreaHandle>(null);

  // Persist scroll positions per channel
  const scrollPositions = useRef<Map<string, number>>(new Map());

  const { messages, loading: msgsLoading, sendMessage, addReaction, deleteMessage, editMessage, togglePin } = useMessages(activeChannelId);
  const members = useChannelMembers(activeChannelId);
  const { onlineUsers, typingUsers, sendTyping } = useChatPresence(activeChannelId);
  const globalOnline = useGlobalPresence();

  const activeChannel = channels.find(c => c.id === activeChannelId) || null;
  const pinnedMessages = messages.filter(m => m.is_pinned);

  const handleSelectChannel = useCallback((id: string) => {
    if (activeChannelId) {
      const pos = messageAreaRef.current?.getScrollPosition?.();
      if (typeof pos === "number") {
        scrollPositions.current.set(activeChannelId, pos);
      }
    }

    setActiveChannelId(id);
    setMessageSearch("");
    setShowPinned(false);
  }, [activeChannelId]);

  const handleSend = useCallback(async (
    content: string, type: "text" | "image" | "file" | "link",
    fileUrl?: string, fileName?: string, fileType?: string, replyToId?: string
  ) => {
    await sendMessage(content, type, fileUrl, fileName, fileType, replyToId);
    requestAnimationFrame(() => {
      messageAreaRef.current?.scrollToBottom();
    });
  }, [sendMessage]);

  const handleRecap = useCallback(async () => {
    if (!activeChannelId || messages.length === 0) {
      toast.info("Aucun message à résumer");
      return;
    }
    setRecapLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat-recap", {
        body: {
          messages: messages.slice(-50).map(m => ({
            author: m.profile?.display_name || "Utilisateur",
            content: m.content,
            type: m.type,
          })),
          channelName: activeChannel?.name || "chat",
        },
      });
      if (error) throw error;
      setRecapContent(data.recap);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du récap IA");
    } finally {
      setRecapLoading(false);
    }
  }, [activeChannelId, messages, activeChannel]);

  // Channel actions
  const handleDeleteChannel = useCallback(async (id: string) => {
    if (!confirm("Supprimer ce channel ? Cette action est irréversible.")) return;
    await supabase.from("chat_messages").delete().eq("channel_id", id);
    await supabase.from("chat_channel_members").delete().eq("channel_id", id);
    await supabase.from("chat_channels").delete().eq("id", id);
    if (activeChannelId === id) setActiveChannelId(null);
    refreshChannels();
    toast.success("Channel supprimé");
  }, [activeChannelId, refreshChannels]);

  const handlePinChannel = useCallback(async (id: string) => {
    const ch = channels.find(c => c.id === id);
    if (!ch) return;
    const newVal = !(ch as any).is_pinned;
    await supabase.from("chat_channels").update({ is_pinned: newVal } as any).eq("id", id);
    refreshChannels();
    toast.success(newVal ? "Channel épinglé" : "Channel désépinglé");
  }, [channels, refreshChannels]);

  const handleArchiveChannel = useCallback(async (id: string) => {
    const ch = channels.find(c => c.id === id);
    if (!ch) return;
    const newVal = !(ch as any).is_archived;
    await supabase.from("chat_channels").update({ is_archived: newVal } as any).eq("id", id);
    if (newVal && activeChannelId === id) setActiveChannelId(null);
    refreshChannels();
    toast.success(newVal ? "Channel archivé" : "Channel désarchivé");
  }, [channels, activeChannelId, refreshChannels]);

  const handleSetAvatar = useCallback(async (id: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const path = `channel-avatars/${id}-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("chat-files").upload(path, file);
      if (error) { toast.error("Erreur upload"); return; }
      const { data } = supabase.storage.from("chat-files").getPublicUrl(path);
      await supabase.from("chat_channels").update({ avatar_url: data.publicUrl } as any).eq("id", id);
      refreshChannels();
      toast.success("Avatar mis à jour !");
    };
    input.click();
  }, [refreshChannels]);

  const filteredMessages = messageSearch.trim()
    ? messages.filter(m => m.content?.toLowerCase().includes(messageSearch.toLowerCase()))
    : messages;

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 md:-m-6 rounded-xl overflow-hidden border bg-background">
      <ChatChannelList
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={handleSelectChannel}
        onCreateChannel={() => setShowCreateDialog(true)}
        onlineUserIds={globalOnline}
        onDeleteChannel={handleDeleteChannel}
        onPinChannel={handlePinChannel}
        onArchiveChannel={handleArchiveChannel}
        onSetAvatar={handleSetAvatar}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          channel={activeChannel}
          memberCount={members.length}
          onlineCount={onlineUsers.length + 1}
          onToggleMedia={() => { setShowMedia(!showMedia); setShowMembers(false); setShowPinned(false); }}
          onToggleMembers={() => { setShowMembers(!showMembers); setShowMedia(false); setShowPinned(false); }}
          onTogglePinned={() => { setShowPinned(!showPinned); setShowMedia(false); setShowMembers(false); }}
          pinnedCount={pinnedMessages.length}
          onRecap={handleRecap}
          recapLoading={recapLoading}
          searchQuery={messageSearch}
          onSearchChange={setMessageSearch}
        />

        {activeChannelId ? (
          <>
            <ChatMessageArea
              ref={messageAreaRef}
              channelId={activeChannelId}
              initialScrollPosition={activeChannelId ? (scrollPositions.current.get(activeChannelId) ?? null) : null}
              messages={filteredMessages}
              loading={msgsLoading}
              onReply={setReplyTo}
              onReaction={addReaction}
              onDelete={deleteMessage}
              onEdit={editMessage}
              onTogglePin={togglePin}
            />

            {typingUsers.length > 0 && (
              <div className="px-4 py-1 border-t bg-muted/30">
                <p className="text-[11px] text-muted-foreground animate-pulse">
                  {typingUsers.map(t => t.display_name).join(", ")} {typingUsers.length === 1 ? "écrit" : "écrivent"}...
                </p>
              </div>
            )}

            <ChatInput
              channelId={activeChannelId}
              replyTo={replyTo}
              onClearReply={() => setReplyTo(null)}
              onSend={handleSend}
              members={members}
              onTyping={sendTyping}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <p className="text-sm font-medium">Bienvenue dans le Chat</p>
                <p className="text-xs text-muted-foreground mt-1">Sélectionnez une conversation ou créez-en une nouvelle</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPinned && activeChannelId && (
        <div className="w-72 border-l bg-card flex flex-col h-full">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5" /> Messages épinglés ({pinnedMessages.length})
            </h3>
            <button onClick={() => setShowPinned(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {pinnedMessages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Aucun message épinglé</p>
            )}
            {pinnedMessages.map(msg => (
              <div key={msg.id} className="p-2.5 rounded-lg bg-muted/50 text-xs space-y-1">
                <p className="font-semibold text-primary text-[11px]">{msg.profile?.display_name || "Utilisateur"}</p>
                <p className="text-foreground/80 line-clamp-3">{msg.content}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(msg.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showMedia && activeChannelId && (
        <ChatMediaPanel messages={messages} onClose={() => setShowMedia(false)} />
      )}
      {showMembers && activeChannelId && (
        <ChatMembersPanel members={members} onClose={() => setShowMembers(false)} />
      )}

      <CreateChannelDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={createChannel}
      />

      <Dialog open={!!recapContent} onOpenChange={() => setRecapContent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              ✨ Récap du chat #{activeChannel?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-h-96 overflow-y-auto">
            <ReactMarkdown>{recapContent || ""}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
