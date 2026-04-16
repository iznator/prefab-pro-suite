import { X, Shield, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChannelMember } from "@/hooks/useChat";

interface ChatMembersPanelProps {
  members: ChannelMember[];
  onClose: () => void;
}

export function ChatMembersPanel({ members, onClose }: ChatMembersPanelProps) {
  const admins = members.filter(m => m.role === "admin");
  const regularMembers = members.filter(m => m.role === "member");

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="w-64 border-l bg-card flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Membres ({members.length})</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <ScrollArea className="flex-1 p-2">
        {admins.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Admins</p>
            {admins.map(m => (
              <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                  {getInitials(m.profile?.display_name)}
                </div>
                <span className="text-sm flex-1 truncate">{m.profile?.display_name || "Utilisateur"}</span>
                <Shield className="w-3 h-3 text-primary" />
              </div>
            ))}
          </div>
        )}
        {regularMembers.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Membres</p>
            {regularMembers.map(m => (
              <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                  {getInitials(m.profile?.display_name)}
                </div>
                <span className="text-sm flex-1 truncate">{m.profile?.display_name || "Utilisateur"}</span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
