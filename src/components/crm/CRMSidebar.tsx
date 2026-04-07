import { 
  Users, LayoutDashboard, Map, KanbanSquare, Settings, 
  Home, BarChart3, CalendarDays, Keyboard, Calculator, Network
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { leads } from "@/data/mockData";
import { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const newLeadsCount = leads.filter(l => l.status === 'nouveau').length;
const activeLeadsCount = leads.filter(l => !['gagné', 'perdu'].includes(l.status)).length;

const mainItems = [
  { title: "Tableau de bord", url: "/", icon: LayoutDashboard, shortcut: "1" },
  { title: "Leads", url: "/leads", icon: Users, badge: activeLeadsCount, shortcut: "2" },
  { title: "Pipeline", url: "/pipeline", icon: KanbanSquare, badge: newLeadsCount > 0 ? `${newLeadsCount} new` : undefined, shortcut: "3" },
  { title: "Carte", url: "/carte", icon: Map, shortcut: "4" },
  { title: "Calendrier", url: "/calendrier", icon: CalendarDays, shortcut: "5" },
  { title: "Rapports", url: "/rapports", icon: BarChart3, shortcut: "6" },
  { title: "Configurateur", url: "/configurateur", icon: Calculator, shortcut: "7" },
];

export function CRMSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  // Keyboard navigation shortcuts (1-6)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const item = mainItems.find(i => i.shortcut === e.key);
      if (item) {
        e.preventDefault();
        navigate(item.url);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Home className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-display font-bold text-sm text-sidebar-accent-foreground truncate">ModulaHome</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">CRM Maisons Modulaires</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={collapsed ? item.title : undefined}>
                    <NavLink to={item.url} end>
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                  {item.badge && !collapsed && (
                    <SidebarMenuBadge className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {typeof item.badge === 'number' ? item.badge : item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/parametres" end>
                <Settings className="w-4 h-4" />
                {!collapsed && <span>Paramètres</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {!collapsed && (
            <SidebarMenuItem>
              <SidebarMenuButton className="text-sidebar-foreground/40 text-xs">
                <Keyboard className="w-3.5 h-3.5" />
                <span>Raccourcis</span>
                <kbd className="ml-auto px-1.5 py-0.5 rounded bg-sidebar-accent text-[9px] font-mono">?</kbd>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
