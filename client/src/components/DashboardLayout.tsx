import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  FolderKanban,
  CheckSquare,
  StickyNote,
  DollarSign,
  Sparkles,
  BookOpen,
  FileText,
  Sun,
  Moon,
  Languages,
  BarChart3,
  Rocket,
  Shield,
  Brain,
  Zap,
  Database,
  Heart,
  Target,
  TrendingUp,
  Wand2,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/" },
  { icon: Users, labelKey: "nav.clients", path: "/clients" },
  { icon: FolderKanban, labelKey: "nav.projects", path: "/projects" },
  { icon: CheckSquare, labelKey: "nav.deliverables", path: "/deliverables" },
  { icon: StickyNote, labelKey: "nav.notes", path: "/notes" },
  { icon: DollarSign, labelKey: "nav.financials", path: "/financials" },
  { icon: FileText, labelKey: "nav.proposals", path: "/proposals" },
  { icon: Sparkles, labelKey: "nav.ai", path: "/ai" },
  { icon: BarChart3, labelKey: "nav.analytics", path: "/analytics" },
  { icon: BookOpen, labelKey: "nav.playbooks", path: "/playbooks" },
  { icon: Rocket, labelKey: "nav.onboarding", path: "/onboarding" },
  { icon: Shield, labelKey: "nav.portal", path: "/portal-management" },
  { icon: Brain, labelKey: "nav.research", path: "/research" },
  { icon: Database, labelKey: "nav.knowledge", path: "/knowledge" },
  { icon: Zap, labelKey: "nav.pipeline", path: "/pipeline" },
  { icon: Heart, labelKey: "nav.brandTwin", path: "/brand-twin" },
  { icon: Target, labelKey: "nav.leads", path: "/leads" },
  { icon: TrendingUp, labelKey: "nav.salesFunnel", path: "/sales-funnel" },
];

/** Deep agency surfaces — hidden from sidebar unless user has Command Center access. */
const AGENCY_COMMAND_CENTER_PATHS = new Set([
  "/ai",
  "/brand-twin",
  "/pipeline",
  "/research",
  "/knowledge",
]);

const coreNavItems = menuItems.filter((i) => !AGENCY_COMMAND_CENTER_PATHS.has(i.path));
const agencyCommandNavItems = menuItems.filter((i) => AGENCY_COMMAND_CENTER_PATHS.has(i.path));

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { t, locale } = useI18n();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663371561184/TgSL8MhgJ4oMR4dsotVnRS/wzrd-ai-logo_a6bceffd.png" alt="Primo Marca" className="w-12 h-12 rounded-lg" />
                <div>
                  <h1 className="text-lg font-bold tracking-tight">Primo Marca</h1>
                  <p className="text-xs text-muted-foreground tracking-wider">
                    {locale === "ar" ? "Command Center · مساحة العمل الداخلية" : "Command Center · Internal workspace"}
                  </p>
                </div>
              </div>
            </div>
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {locale === "ar"
                ? "تسجيل الدخول لمساحة الوكالة الداخلية — العملاء، المشاريع، التسليمات. (ليست لوحة إدارة منتج WZRD العامة.)"
                : "Sign in to the agency workspace — clients, projects, deliverables. (Not the public WZRD product admin.)"}
            </p>
            <Button
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              size="lg"
              className="w-full shadow-lg hover:shadow-xl transition-all"
            >
              {t("nav.signIn")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const canAccessCommandCenter = Boolean(
    user &&
      "canAccessCommandCenter" in user &&
      (user as { canAccessCommandCenter?: boolean }).canAccessCommandCenter
  );
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { t, toggleLocale, locale, dir } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const activeMenuItem = menuItems.find((item) => item.path === location);
  const isMobile = useIsMobile();
  const sidebarSide = dir === "rtl" ? "right" : "left";

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarEl = sidebarRef.current;
      if (!sidebarEl) return;
      const rect = sidebarEl.getBoundingClientRect();
      let newWidth: number;
      if (dir === "rtl") {
        newWidth = rect.right - e.clientX;
      } else {
        newWidth = e.clientX - rect.left;
      }
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth, dir]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          side={sidebarSide}
          className={dir === "rtl" ? "border-l-0" : "border-r-0"}
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                {isCollapsed ? (
                  <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663371561184/TgSL8MhgJ4oMR4dsotVnRS/wzrd-ai-logo_a6bceffd.png" alt="Primo Marca" className="w-8 h-8 rounded-lg" />
                ) : (
                  <PanelLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663371561184/TgSL8MhgJ4oMR4dsotVnRS/wzrd-ai-logo_a6bceffd.png" alt="Primo Marca" className="w-7 h-7 rounded-md shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold tracking-tight text-sm block truncate">Primo Marca</span>
                    <span className="text-[10px] text-muted-foreground tracking-wider block leading-tight">
                      {locale === "ar" ? "Command Center · داخلي" : "Command Center · Internal"}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {coreNavItems.map((item) => {
                const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={t(item.labelKey)}
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{t(item.labelKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            {canAccessCommandCenter && !isCollapsed && (
              <p className="mx-3 mt-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600/80 dark:text-violet-400/90">
                {locale === "ar" ? "وكالة — Command Center" : "Agency Command Center"}
              </p>
            )}
            {canAccessCommandCenter && (
              <SidebarMenu className="px-2 pb-1">
                {agencyCommandNavItems.map((item) => {
                  const isActive =
                    location === item.path || (item.path !== "/" && location.startsWith(item.path));
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={t(item.labelKey)}
                        className={`h-10 transition-all font-normal ${isActive ? "border-s-2 border-violet-500/70 bg-violet-500/5" : ""}`}
                      >
                        <item.icon
                          className={`h-4 w-4 ${isActive ? "text-violet-500 dark:text-violet-400" : ""}`}
                        />
                        <span>{t(item.labelKey)}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}

            <div
              className={`mx-2 mt-3 mb-2 rounded-xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/[0.08] via-violet-500/[0.06] to-transparent p-2 ${
                isCollapsed ? "hidden" : ""
              }`}
            >
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                WZRD AI Tools
              </p>
              <SidebarMenu className="gap-0.5 px-0">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={locale === "ar" ? "أدوات التشخيص" : "Diagnostic tools"} className="h-9">
                    <a href="/tools" className="flex w-full cursor-pointer items-center gap-2">
                      <Wand2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      <span>{locale === "ar" ? "الأدوات" : "Tools"}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={locale === "ar" ? "صحة البراند" : "My Brand"} className="h-9">
                    <a href="/my-brand" className="flex w-full cursor-pointer items-center gap-2">
                      <Heart className="h-4 w-4 text-rose-500/90" />
                      <span>{locale === "ar" ? "صحة البراند" : "My Brand"}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={locale === "ar" ? "المستشار" : "Copilot"} className="h-9">
                    <a href="/copilot" className="flex w-full cursor-pointer items-center gap-2">
                      <Brain className="h-4 w-4 text-violet-500/90" />
                      <span>{locale === "ar" ? "المستشار" : "Copilot"}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>

          {/* Public product admin — same access tier as Command Center */}
          {canAccessCommandCenter && (
            <div className="px-3 pb-2 space-y-1">
              <p className="text-[10px] text-muted-foreground px-1 uppercase tracking-wide">
                {locale === "ar" ? "← منتج منفصل" : "← Separate product"}
              </p>
              <a
                href="/wzrd-admin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-0.5 px-3 py-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 hover:border-indigo-500/20 transition text-xs font-medium text-indigo-400"
              >
                <span className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>WZRD AI · {locale === "ar" ? "إدارة الموقع العام" : "Public site admin"}</span>
                </span>
                <span className="text-[10px] font-normal text-muted-foreground ps-6">
                  {locale === "ar" ? "يفتح في تبويب جديد" : "Opens in new tab"}
                </span>
              </a>
            </div>
          )}

          <SidebarFooter className="p-3 space-y-2">
            {/* Language & Theme toggles */}
            {!isCollapsed && (
              <div className="flex items-center gap-1.5 px-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLocale}
                  className="flex-1 h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Languages className="h-3.5 w-3.5" />
                  {locale === "en" ? "عربي" : "English"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </Button>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border border-primary/30 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isCollapsed && (
                  <>
                    <DropdownMenuItem onClick={toggleLocale} className="cursor-pointer">
                      <Languages className="me-2 h-4 w-4" />
                      <span>{locale === "en" ? "عربي" : "English"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                      {theme === "dark" ? <Sun className="me-2 h-4 w-4" /> : <Moon className="me-2 h-4 w-4" />}
                      <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="me-2 h-4 w-4" />
                  <span>{t("nav.signOut")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 ${dir === "rtl" ? "left-0" : "right-0"} w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem ? t(activeMenuItem.labelKey) : "Menu"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggleLocale} className="h-8 w-8">
                <Languages className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
