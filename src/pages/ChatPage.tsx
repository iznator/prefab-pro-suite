import { useState, useCallback } from "react";
import { ChatChannelList } from "@/components/chat/ChatChannelList";
import { ChatMessageArea } from "@/components/chat/ChatMessageArea";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMediaPanel } from "@/components/chat/ChatMediaPanel";
import { ChatMembersPanel } from "@/components/chat/ChatMembersPanel";
import { CreateChannelDialog } from "@/components/chat/CreateChannelDialog";
import { useChannels, useMessages, useChannelMembers, type ChatMessage } from "@/hooks/useChat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";

export default function ChatPage() {
  const { channels, loading: channelsLoading, createChannel } = useChannels();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const [recapContent, setRecapContent] = useState<string | null>(null);

  const { messages, loading: msgsLoading, sendMessage, addReaction, deleteMessage } = useMessages(activeChannelId);
  const members = useChannelMembers(activeChannelId);

  const activeChannel = channels.find(c => c.id === activeChannelId) || null;

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

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 md:-m-6 rounded-xl overflow-hidden border bg-background">
      {/* Channel list */}
      <ChatChannelList
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={setActiveChannelId}
        onCreateChannel={() => setShowCreateDialog(true)}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          channel={activeChannel}
          memberCount={members.length}
          onToggleMedia={() => { setShowMedia(!showMedia); setShowMembers(false); }}
          onToggleMembers={() => { setShowMembers(!showMembers); setShowMedia(false); }}
          onRecap={handleRecap}
          recapLoading={recapLoading}
        />

        {activeChannelId ? (
          <>
            <ChatMessageArea
              messages={messages}
              loading={msgsLoading}
              onReply={setReplyTo}
              onReaction={addReaction}
              onDelete={deleteMessage}
            />
            <ChatInput
              channelId={activeChannelId}
              replyTo={replyTo}
              onClearReply={() => setReplyTo(null)}
              onSend={sendMessage}
              members={members}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-muted-foreground">💬</p>
              <p className="text-sm text-muted-foreground">Sélectionnez ou créez une conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* Side panels */}
      {showMedia && activeChannelId && (
        <ChatMediaPanel messages={messages} onClose={() => setShowMedia(false)} />
      )}
      {showMembers && activeChannelId && (
        <ChatMembersPanel members={members} onClose={() => setShowMembers(false)} />
      )}

      {/* Create channel dialog */}
      <CreateChannelDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={createChannel}
      />

      {/* Recap dialog */}
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
