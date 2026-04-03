import { useState } from "react";
import { Bell, Check, User, Mail, Phone, Home } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  type: "lead" | "email" | "call" | "status";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  { id: "1", type: "lead", title: "Nouveau lead", description: "Nathalie Fournier via Site web", time: "Il y a 2h", read: false },
  { id: "2", type: "status", title: "Lead qualifié", description: "Jean Moreau est passé en Qualifié", time: "Il y a 4h", read: false },
  { id: "3", type: "email", title: "Email reçu", description: "Réponse de Claire Dubois", time: "Il y a 6h", read: false },
  { id: "4", type: "call", title: "Appel manqué", description: "Marc Lefèvre — 06 77 88 99 00", time: "Hier", read: true },
  { id: "5", type: "lead", title: "Score mis à jour", description: "Sophie Garcia : 72 → 78", time: "Hier", read: true },
  { id: "6", type: "status", title: "Lead gagné 🎉", description: "Anne Petit — Loft 40m² à Lille", time: "Il y a 2j", read: true },
];

const iconMap = {
  lead: User,
  email: Mail,
  call: Phone,
  status: Home,
};

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-display font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={markAllRead}>
              <Check className="w-3 h-3" /> Tout marquer lu
            </Button>
          )}
        </div>
        <ScrollArea className="h-[320px]">
          <div className="divide-y">
            {notifications.map(n => {
              const Icon = iconMap[n.type];
              return (
                <div key={n.id} className={`flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!n.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-medium' : ''}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
