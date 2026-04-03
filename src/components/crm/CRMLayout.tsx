import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CRMSidebar } from "./CRMSidebar";
import { CommandSearch } from "./CommandSearch";
import { NotificationsPanel } from "./NotificationsPanel";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface CRMLayoutProps {
  children: React.ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const { theme, toggle } = useTheme();

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
              <button
                onClick={toggle}
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
              </button>
              <NotificationsPanel />
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                MD
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
