import { Home, Video, BookOpen, Settings, Users, FolderOpen, LogOut, Shield, ChevronLeft, Menu, Book } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const memberItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Módulos", url: "/modules", icon: Book },
  { title: "Ebooks", url: "/ebooks", icon: BookOpen },
];

const adminItems = [
  { title: "Painel Admin", url: "/admin", icon: Shield },
  { title: "Módulos", url: "/admin/modules", icon: FolderOpen },
  { title: "Conteúdos", url: "/admin/contents", icon: FolderOpen },
  { title: "Categorias", url: "/admin/categories", icon: Settings },
  { title: "Clientes", url: "/admin/clients", icon: Users },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin, signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-heading font-bold text-sm">FL</span>
            </div>
            {!collapsed && <span className="font-heading font-bold text-lg text-sidebar-foreground">Fatias Lucrativas</span>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSidebar()}
            className="h-9 w-9 p-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary shrink-0 transition-colors"
            title={collapsed ? "Abrir menu" : "Fechar menu"}
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {memberItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!collapsed && (
            <span className="text-xs text-sidebar-foreground truncate">
              {profile?.display_name || "Membro"}
            </span>
          )}
        </div>
        <Button variant="ghost" size={collapsed ? "icon" : "default"} onClick={handleSignOut} className="w-full justify-start text-sidebar-foreground hover:text-destructive">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
