import { useState } from "react";
import { Hash, MessageCircle, Image, Users, Sparkles, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Channel } from "@/hooks/useChat";

interface ChatHeaderProps {
  channel: Channel | null;
  memberCount: number;
  onToggleMedia: () => void;
  onToggleMembers: () => void;
  onRecap: () => void;
  recapLoading: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export function ChatHeader({ channel, memberCount, onToggleMedia, onToggleMembers, onRecap, recapLoading, searchQuery = "", onSearchChange }: ChatHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);

  if (!channel) {
    return (
      <div className="h-14 border-b bg-card px-4 flex items-center">
        <p className="text-sm text-muted-foreground">Sélectionnez une conversation</p>
      </div>
    );
  }

  return (
    <div className="h-14 border-b bg-card px-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {channel.type === "channel"
          ? <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">{channel.name}</h3>
          {channel.description && !showSearch && (
            <p className="text-[10px] text-muted-foreground truncate">{channel.description}</p>
          )}
        </div>

        {/* Inline search */}
        {showSearch && (
          <div className="flex-1 flex items-center gap-1 ml-2">
            <Input
              autoFocus
              value={searchQuery}
              onChange={e => onSearchChange?.(e.target.value)}
              placeholder="Rechercher dans les messages..."
              className="h-7 text-xs flex-1"
            />
            <button onClick={() => { setShowSearch(false); onSearchChange?.(""); }}
              className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setShowSearch(!showSearch)} title="Rechercher">
          <Search className="w-4 h-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onRecap} disabled={recapLoading} className="gap-1.5 text-xs h-8">
          <Sparkles className={`w-3.5 h-3.5 ${recapLoading ? "animate-spin" : ""}`} />
          Récap
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onToggleMedia} title="Médias">
          <Image className="w-4 h-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onToggleMembers} title="Membres">
          <Users className="w-4 h-4 text-muted-foreground" />
        </Button>
        <span className="text-[10px] text-muted-foreground ml-1">{memberCount}</span>
      </div>
    </div>
  );
}
