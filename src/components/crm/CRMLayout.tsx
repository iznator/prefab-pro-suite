import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CRMSidebar } from "./CRMSidebar";
import { CommandSearch } from "./CommandSearch";
import { NotificationsPanel } from "./NotificationsPanel";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { NewLeadDialog } from "./NewLeadDialog";
import { Moon, Sun, Plus, LogOut } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CRMLayoutProps {
  children: React.ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CRMSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <CommandSearch />
            </div>
            <div className="flex items-center gap-2">
              <NewLeadDialog
                trigger={
                  <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground hidden sm:flex">
                    <Plus className="w-3.5 h-3.5" /> Nouveau lead
                  </Button>
                }
              />
              <button
                onClick={toggle}
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
              </button>
              <NotificationsPanel />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity">
                    {initials}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-xs gap-2 text-destructive">
                    <LogOut className="w-3.5 h-3.5" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
      <KeyboardShortcutsDialog />
    </SidebarProvider>
  );
}
