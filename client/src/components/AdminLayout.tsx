import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/contexts/ThemeContext";
import { PageSkeleton } from "@/components/PageSkeleton";
import RoleSwitcher from "@/components/RoleSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  ScrollText,
  Settings,
  Mail,
  LogOut,
  User,
  PanelLeft,
  Sun,
  Moon,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Admin Panel", path: "/admin" },
  { icon: Users, label: "Team", path: "/admin/settings/team" },
  { icon: MessageSquare, label: "WhatsApp", path: "/admin/settings/whatsapp" },
  { icon: ScrollText, label: "Audit Logs", path: "/admin/settings/audit-logs" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
  { icon: Mail, label: "Invite", path: "/admin/invite" },
];

const RED = "#EF4444";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [location, navigate] = useLocation();
  const { locale } = useI18n();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (!user.canAccessCommandCenter) {
      navigate("/app/tools");
    }
  }, [loading, user, navigate]);

  if (loading) return <PageSkeleton />;
  if (!user || !user.canAccessCommandCenter) return null;

  const initials = (user.name ?? user.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-border/60 bg-background">
        {/* Header */}
        <SidebarHeader className="h-14 flex items-center px-4 border-b border-border/60">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-baseline gap-1.5 font-bold tracking-tight hover:opacity-80 transition"
            style={{ color: RED }}
          >
            <span className="font-display text-sm">WZZRD Admin</span>
            <span className="text-[10px]">⚙️</span>
          </button>
          <div className="ml-auto">
            <RoleSwitcher />
          </div>
        </SidebarHeader>

        {/* Nav */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    location === item.path ||
                    (item.path !== "/admin" && location.startsWith(item.path));
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => navigate(item.path)}
                        className="gap-2.5"
                        style={isActive ? { color: RED } : undefined}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t border-border/60 p-2">
          <div className="flex items-center gap-2 px-2 py-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => toggleTheme?.()}
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]" style={{ background: RED + "22", color: RED }}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs max-w-[90px] truncate">{user.name ?? user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/app/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    {locale === "ar" ? "الملف" : "Profile"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {locale === "ar" ? "خروج" : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
          <SidebarTrigger>
            <PanelLeft className="h-4 w-4" />
          </SidebarTrigger>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
