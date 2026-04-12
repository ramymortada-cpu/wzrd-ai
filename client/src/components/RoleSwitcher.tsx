import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export default function RoleSwitcher() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  if (!user?.canAccessCommandCenter) return null;

  const current = location.startsWith("/admin")
    ? "admin"
    : location.startsWith("/cc")
    ? "agency"
    : "client";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          {current === "client"
            ? "🛠 Client"
            : current === "agency"
            ? "🏢 Command Center"
            : "⚙️ Admin"}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate("/app/tools")}>
          🛠 Client View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/cc/dashboard")}>
          🏢 Command Center
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/admin")}>
          ⚙️ Admin Panel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
