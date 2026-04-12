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
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
  Radio,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

type SidebarNavItem = {
  icon: typeof LayoutDashboard;
  path: string;
  label: string;
  labelAr?: string;
  labelKey?: string;
  requiresCommandCenter?: boolean;
};

const NAV_OVERVIEW: SidebarNavItem[] = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", label: "Dashboard", labelAr: "Dashboard", path: "/cc/dashboard" },
  { icon: BarChart3, labelKey: "nav.analytics", label: "Analytics", labelAr: "Analytics", path: "/cc/analytics" },
  { icon: Zap, labelKey: "nav.pipeline", label: "Pipeline", labelAr: "Pipeline", path: "/cc/pipeline", requiresCommandCenter: true },
];

const NAV_WORKSPACE: SidebarNavItem[] = [
  { icon: Users, labelKey: "nav.clients", label: "Clients", labelAr: "Clients", path: "/cc/clients" },
  { icon: FolderKanban, labelKey: "nav.projects", label: "Projects", labelAr: "Projects", path: "/cc/projects" },
  { icon: CheckSquare, labelKey: "nav.deliverables", label: "Deliverables", labelAr: "Deliverables", path: "/cc/deliverables" },
  { icon: StickyNote, labelKey: "nav.notes", label: "Notes", labelAr: "Notes", path: "/cc/notes" },
];

const NAV_FINANCE: SidebarNavItem[] = [
  { icon: FileText, labelKey: "nav.proposals", label: "Proposals", labelAr: "Proposals", path: "/cc/proposals" },
  { icon: FileText, label: "Contracts", labelAr: "Contracts", path: "/cc/contracts" },
  { icon: DollarSign, label: "Invoices", labelAr: "Invoices", path: "/cc/invoices" },
];

const NAV_AI_TOOLS: SidebarNavItem[] = [
  { icon: Sparkles, labelKey: "nav.ai", label: "AI Copilot", labelAr: "AI Copilot", path: "/cc/ai", requiresCommandCenter: true },
  { icon: Heart, labelKey: "nav.brandTwin", label: "Brand Health Score", labelAr: "مؤشر صحة البراند", path: "/cc/brand-twin", requiresCommandCenter: true },
  { icon: Radio, labelKey: "nav.brandMonitor", label: "Brand Monitor", labelAr: "مراقبة العلامة", path: "/cc/brand-monitor", requiresCommandCenter: true },
  { icon: Brain, labelKey: "nav.research", label: "Research", labelAr: "Research", path: "/cc/research", requiresCommandCenter: true },
  { icon: BookOpen, labelKey: "nav.playbooks", label: "Playbooks", labelAr: "Playbooks", path: "/cc/playbooks" },
];

const NAV_MORE: SidebarNavItem[] = [
  { icon: DollarSign, labelKey: "nav.financials", label: "Financials", labelAr: "Financials", path: "/cc/financials" },
  { icon: Rocket, labelKey: "nav.onboarding", label: "Onboarding", labelAr: "Onboarding", path: "/cc/onboarding" },
  { icon: Shield, labelKey: "nav.portal", label: "Portal", labelAr: "Portal", path: "/cc/portal-management" },
  { icon: Database, labelKey: "nav.knowledge", label: "Knowledge", labelAr: "Knowledge", path: "/cc/knowledge", requiresCommandCenter: true },
  { icon: Target, labelKey: "nav.leads", label: "Leads", labelAr: "Leads", path: "/cc/leads" },
  { icon: TrendingUp, labelKey: "nav.salesFunnel", label: "Sales Funnel", labelAr: "Sales Funnel", path: "/cc/sales-funnel" },
];

const ALL_SIDEBAR_ITEMS: SidebarNavItem[] = [
  ...NAV_OVERVIEW,
  ...NAV_WORKSPACE,
  ...NAV_FINANCE,
  ...NAV_AI_TOOLS,
  ...NAV_MORE,
];

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
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663371561184/TgSL8MhgJ4oMR4dsotVnRS/wzrd-ai-logo_a6bceffd.png" alt="WZZRD AI" className="w-12 h-12 rounded-lg" />
                <div>
                  <h1 className="text-lg font-bold tracking-tight">WZZRD AI</h1>
                  <p className="text-xs text-muted-foreground tracking-wider">
                    {locale === "ar" ? "Command Center · مساحة العمل الداخلية" : "Command Center · Internal workspace"}
                  </p>
                </div>
              </div>
            </div>
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {locale === "ar"
                ? "تسجيل الدخول لمساحة الوكالة الداخلية — العملاء، المشاريع، التسليمات. (ليست لوحة إدارة منتج WZZRD العامة.)"
                : "Sign in to the agency workspace — clients, projects, deliverables. (Not the public WZZRD product admin.)"}
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
  const activeMenuItem = ALL_SIDEBAR_ITEMS.find((item) => item.path === location);
  const isMobile = useIsMobile();
  const sidebarSide = dir === "rtl" ? "right" : "left";

  const sidebarItemLabel = (item: SidebarNavItem) => {
    if (item.labelKey) return t(item.labelKey);
    return locale === "ar" ? item.labelAr || item.label : item.label;
  };

  const visibleItems = (items: SidebarNavItem[]) =>
    items.filter((i) => !i.requiresCommandCenter || canAccessCommandCenter);

  const activeBorderClass = dir === "rtl" ? "border-l-2 border-purple-500" : "border-r-2 border-purple-500";
  const activeItemClass = `${activeBorderClass} bg-zinc-800/50 text-zinc-50`;
  const inactiveItemClass = "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30";
  const groupLabelClass =
    "text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-600 px-3 mb-1";

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
                  <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663371561184/TgSL8MhgJ4oMR4dsotVnRS/wzrd-ai-logo_a6bceffd.png" alt="WZZRD AI" className="w-8 h-8 rounded-lg" />
                ) : (
                  <PanelLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663371561184/TgSL8MhgJ4oMR4dsotVnRS/wzrd-ai-logo_a6bceffd.png" alt="WZZRD AI" className="w-7 h-7 rounded-md shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold tracking-tight text-sm block truncate">WZZRD AI</span>
                    <span className="text-[10px] text-muted-foreground tracking-wider block leading-tight">
                      {locale === "ar" ? "Command Center · داخلي" : "Command Center · Internal"}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {!isCollapsed && <WorkspaceSwitcher />}
            <div className="py-2">
              {([
                { label: "OVERVIEW", items: NAV_OVERVIEW },
                { label: "WORKSPACE", items: NAV_WORKSPACE },
                { label: "FINANCE", items: NAV_FINANCE },
                { label: "AI & TOOLS", items: NAV_AI_TOOLS },
                { label: "MORE", items: NAV_MORE },
              ] as const).map((g) => {
                const items = visibleItems(g.items);
                if (items.length === 0) return null;
                return (
                  <SidebarGroup key={g.label}>
                    <SidebarGroupLabel className={groupLabelClass}>{g.label}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu className="px-2 py-0">
                        {items.map((item) => {
                          const isActive =
                            location === item.path ||
                            (item.path !== "/cc/dashboard" && location.startsWith(item.path));
                          return (
                            <SidebarMenuItem key={item.path}>
                              <SidebarMenuButton
                                isActive={isActive}
                                onClick={() => setLocation(item.path)}
                                tooltip={sidebarItemLabel(item)}
                                className={`h-10 transition-all font-normal rounded-lg ${
                                  isActive ? activeItemClass : inactiveItemClass
                                }`}
                              >
                                <item.icon className="h-4 w-4" />
                                <span>{sidebarItemLabel(item)}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                );
              })}
            </div>
          </SidebarContent>

          {/* Public product admin — same access tier as Command Center */}
          {canAccessCommandCenter && (
            <div className="px-3 pb-2 space-y-1">
              <p className="text-[10px] text-muted-foreground px-1 uppercase tracking-wide">
                {locale === "ar" ? "← منتج منفصل" : "← Separate product"}
              </p>
              <a
                href="/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-0.5 px-3 py-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 hover:border-indigo-500/20 transition text-xs font-medium text-indigo-400"
              >
                <span className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>WZZRD AI · {locale === "ar" ? "إدارة الموقع العام" : "Public site admin"}</span>
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
                    {activeMenuItem ? sidebarItemLabel(activeMenuItem) : "Menu"}
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
