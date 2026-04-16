import { useState } from "react";
import { Hash, MessageCircle, Plus, Search, Users } from "lucide-react";
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

  return (
    <div className="w-72 border-r bg-card flex flex-col h-full">
      {/* Header */}
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
          {filtered(channelList).map(ch => (
            <button
              key={ch.id}
              onClick={() => onSelectChannel(ch.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left",
                activeChannelId === ch.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <Hash className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              <span className="truncate flex-1">{ch.name}</span>
            </button>
          ))}
          {filtered(channelList).length === 0 && (
            <p className="px-2 py-3 text-xs text-muted-foreground text-center">Aucun channel</p>
          )}
        </div>

        {/* DMs */}
        <div className="p-2">
          <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Messages directs
          </p>
          {filtered(dmList).map(ch => (
            <button
              key={ch.id}
              onClick={() => onSelectChannel(ch.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left",
                activeChannelId === ch.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <MessageCircle className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              <span className="truncate flex-1">{ch.name}</span>
            </button>
          ))}
          {filtered(dmList).length === 0 && (
            <p className="px-2 py-3 text-xs text-muted-foreground text-center">Aucun DM</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
