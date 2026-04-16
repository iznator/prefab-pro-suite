import { Hash, MessageCircle, Image, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Channel } from "@/hooks/useChat";

interface ChatHeaderProps {
  channel: Channel | null;
  memberCount: number;
  onToggleMedia: () => void;
  onToggleMembers: () => void;
  onRecap: () => void;
  recapLoading: boolean;
}

export function ChatHeader({ channel, memberCount, onToggleMedia, onToggleMembers, onRecap, recapLoading }: ChatHeaderProps) {
  if (!channel) {
    return (
      <div className="h-14 border-b bg-card px-4 flex items-center">
        <p className="text-sm text-muted-foreground">Sélectionnez une conversation</p>
      </div>
    );
  }

  return (
    <div className="h-14 border-b bg-card px-4 flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        {channel.type === "channel"
          ? <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">{channel.name}</h3>
          {channel.description && (
            <p className="text-[10px] text-muted-foreground truncate">{channel.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
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
