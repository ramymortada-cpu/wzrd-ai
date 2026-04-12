import type { ReactNode } from "react";
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
  Wrench,
  BookOpen,
  Bot,
  CreditCard,
  User,
  ListChecks,
  BarChart3,
  Sun,
  Moon,
  Languages,
  LogOut,
  PanelLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: Wrench, label: "Tools", labelAr: "الأدوات", path: "/app/tools" },
  { icon: BookOpen, label: "My Brand", labelAr: "علامتي", path: "/app/my-brand" },
  { icon: Bot, label: "Copilot", labelAr: "المساعد", path: "/app/copilot" },
  { icon: BarChart3, label: "Benchmark", labelAr: "المقارنة", path: "/app/tools/benchmark" },
  { icon: CreditCard, label: "Pricing", labelAr: "الباقات", path: "/app/pricing" },
  { icon: ListChecks, label: "My Requests", labelAr: "طلباتي", path: "/app/my-requests" },
  { icon: User, label: "Profile", labelAr: "الملف", path: "/app/profile" },
];

const GOLD = "#E8A838";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login?redirect=/app/tools" });
  const [location, navigate] = useLocation();
  const { t, locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();

  if (loading) return <PageSkeleton />;
  if (!user) return null; // redirect handled by useAuth

  const initials = (user.name ?? user.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <Sidebar
        className="border-r border-border/60 bg-background"
        style={{ "--sidebar-accent": GOLD } as React.CSSProperties}
      >
        {/* Header */}
        <SidebarHeader className="h-14 flex items-center px-4 border-b border-border/60">
          <button
            onClick={() => navigate("/app/tools")}
            className="flex items-baseline gap-1.5 font-bold tracking-tight hover:opacity-80 transition"
            style={{ color: GOLD }}
          >
            <span className="font-display text-base">WZZRD AI</span>
            <span className="text-[9px] rounded px-1 py-0.5 bg-amber-500/20 text-amber-500">✨</span>
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
                    (item.path !== "/app/tools" && location.startsWith(item.path));
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => navigate(item.path)}
                        className="gap-2.5"
                        style={isActive ? { color: GOLD } : undefined}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{locale === "ar" ? item.labelAr : item.label}</span>
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
              onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
              title="Toggle language"
            >
              <Languages className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => toggleTheme?.()}
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </Button>
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]" style={{ background: GOLD + "33", color: GOLD }}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs max-w-[90px] truncate">{user.name ?? user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/app/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    {t("nav.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.signOut")}
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
