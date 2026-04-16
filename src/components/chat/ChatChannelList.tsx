import { useState } from "react";
import { Hash, MessageCircle, Plus, Search, Pin, Archive, Trash2, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Channel } from "@/hooks/useChat";
import { AnimatePresence, motion } from "framer-motion";

interface ChatChannelListProps {
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
  onCreateChannel: () => void;
  onlineUserIds?: Set<string>;
  onDeleteChannel?: (id: string) => void;
  onPinChannel?: (id: string) => void;
  onArchiveChannel?: (id: string) => void;
  onSetAvatar?: (id: string) => void;
}

interface CtxState { id: string; x: number; y: number }

export function ChatChannelList({
  channels, activeChannelId, onSelectChannel, onCreateChannel, onlineUserIds,
  onDeleteChannel, onPinChannel, onArchiveChannel, onSetAvatar,
}: ChatChannelListProps) {
  const [search, setSearch] = useState("");
  const [ctx, setCtx] = useState<CtxState | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const visibleChannels = channels.filter(c => showArchived ? (c as any).is_archived : !(c as any).is_archived);
  const channelList = visibleChannels.filter(c => c.type === "channel");
  const dmList = visibleChannels.filter(c => c.type === "dm");

  // Sort: pinned first
  const sortPinned = (list: Channel[]) =>
    [...list].sort((a, b) => ((b as any).is_pinned ? 1 : 0) - ((a as any).is_pinned ? 1 : 0));

  const filtered = (list: Channel[]) =>
    sortPinned(list.filter(c => c.name.toLowerCase().includes(search.toLowerCase())));

  const formatLastTime = (date?: string) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const handleCtx = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setCtx({ id, x: e.clientX, y: e.clientY });
  };

  const ctxChannel = ctx ? channels.find(c => c.id === ctx.id) : null;

  const renderChannel = (ch: Channel) => {
    const isActive = activeChannelId === ch.id;
    const isPinned = (ch as any).is_pinned;
    const avatarUrl = (ch as any).avatar_url;
    const unread = ch.unread || 0;

    return (
      <button
        key={ch.id}
        onClick={() => onSelectChannel(ch.id)}
        onContextMenu={(e) => handleCtx(e, ch.id)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all duration-100 text-left group",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "hover:bg-muted text-foreground"
        )}
      >
        {/* Avatar or icon */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold overflow-hidden",
          isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
        )}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : ch.type === "channel" ? (
            <Hash className="w-3.5 h-3.5" />
          ) : (
            <MessageCircle className="w-3.5 h-3.5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={cn("truncate text-[12px]", unread > 0 && !isActive ? "font-bold" : "font-medium")}>
              {isPinned && <Pin className="w-2.5 h-2.5 inline mr-0.5 opacity-50" />}
              {ch.name}
            </span>
            <span className={cn(
              "text-[9px] flex-shrink-0 ml-1",
              isActive ? "text-primary-foreground/70" : unread > 0 ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              {formatLastTime(ch.updated_at)}
            </span>
          </div>
          {unread > 0 && !isActive && (
            <div className="flex justify-end mt-0.5">
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                {unread > 99 ? "99" : unread}
              </span>
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="w-60 border-r bg-card flex flex-col h-full">
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xs">Chat</h2>
          <Button size="icon" variant="ghost" className="w-6 h-6" onClick={onCreateChannel}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 h-7 text-[11px]"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1.5">
          <p className="px-2 py-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            Channels
          </p>
          <div className="space-y-px">
            {filtered(channelList).map(renderChannel)}
          </div>
          {filtered(channelList).length === 0 && (
            <p className="px-2 py-2 text-[10px] text-muted-foreground text-center">Aucun channel</p>
          )}
        </div>

        <div className="p-1.5">
          <p className="px-2 py-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            Messages directs
          </p>
          <div className="space-y-px">
            {filtered(dmList).map(renderChannel)}
          </div>
          {filtered(dmList).length === 0 && (
            <p className="px-2 py-2 text-[10px] text-muted-foreground text-center">Aucun DM</p>
          )}
        </div>

        {/* Toggle archived */}
        <div className="p-1.5 pt-0">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full text-[10px] text-muted-foreground hover:text-foreground py-1 transition-colors"
          >
            {showArchived ? "← Retour aux actifs" : `Archivés (${channels.filter(c => (c as any).is_archived).length})`}
          </button>
        </div>
      </ScrollArea>

      {/* Channel context menu */}
      <AnimatePresence>
        {ctx && ctxChannel && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setCtx(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-50 bg-card border rounded-xl shadow-xl py-1 min-w-[180px]"
              style={{ left: ctx.x, top: ctx.y }}
            >
              <button
                onClick={() => { onPinChannel?.(ctx.id); setCtx(null); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted transition-colors"
              >
                <Pin className="w-3.5 h-3.5" />
                {(ctxChannel as any).is_pinned ? "Désépingler" : "Épingler"}
              </button>
              <button
                onClick={() => { onSetAvatar?.(ctx.id); setCtx(null); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted transition-colors"
              >
                <Image className="w-3.5 h-3.5" />
                Changer l'avatar
              </button>
              <button
                onClick={() => { onArchiveChannel?.(ctx.id); setCtx(null); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                {(ctxChannel as any).is_archived ? "Désarchiver" : "Archiver"}
              </button>
              <div className="border-t my-0.5" />
              <button
                onClick={() => { onDeleteChannel?.(ctx.id); setCtx(null); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted transition-colors text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
