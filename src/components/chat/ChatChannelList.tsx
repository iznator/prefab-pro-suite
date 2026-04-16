import { useState } from "react";
import { Hash, MessageCircle, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Channel } from "@/hooks/useChat";

interface ChatChannelListProps {
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
  onCreateChannel: () => void;
}

export function ChatChannelList({ channels, activeChannelId, onSelectChannel, onCreateChannel }: ChatChannelListProps) {
  const [search, setSearch] = useState("");

  const channelList = channels.filter(c => c.type === "channel");
  const dmList = channels.filter(c => c.type === "dm");

  const filtered = (list: Channel[]) =>
    list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

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

  const renderChannel = (ch: Channel) => {
    const isActive = activeChannelId === ch.id;
    const Icon = ch.type === "channel" ? Hash : MessageCircle;

    return (
      <button
        key={ch.id}
        onClick={() => onSelectChannel(ch.id)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left group",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "hover:bg-muted text-foreground"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold",
          isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium truncate text-[13px]">{ch.name}</span>
            <span className={cn(
              "text-[10px] flex-shrink-0 ml-1",
              isActive ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {formatLastTime(ch.updated_at)}
            </span>
          </div>
          {ch.description && (
            <p className={cn(
              "text-[11px] truncate mt-0.5",
              isActive ? "text-primary-foreground/60" : "text-muted-foreground"
            )}>
              {ch.description}
            </p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="w-72 border-r bg-card flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Chat</h2>
          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={onCreateChannel}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Channels */}
        <div className="p-2">
          <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Channels
          </p>
          <div className="space-y-0.5">
            {filtered(channelList).map(renderChannel)}
          </div>
          {filtered(channelList).length === 0 && (
            <p className="px-2 py-3 text-xs text-muted-foreground text-center">Aucun channel</p>
          )}
        </div>

        {/* DMs */}
        <div className="p-2">
          <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Messages directs
          </p>
          <div className="space-y-0.5">
            {filtered(dmList).map(renderChannel)}
          </div>
          {filtered(dmList).length === 0 && (
            <p className="px-2 py-3 text-xs text-muted-foreground text-center">Aucun DM</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
