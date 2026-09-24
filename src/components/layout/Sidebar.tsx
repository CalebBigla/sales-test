import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  Target,
  Package,
  ShoppingCart,
  Users,
  FileText,
  History,
  Settings,
} from "lucide-react";

const iconMap = {
  dashboard: LayoutDashboard,
  branches: Building2,
  sales: TrendingUp,
  targets: Target,
  inventory: Package,
  products: ShoppingCart,
  team: Users,
  reports: FileText,
  audit: History,
  settings: Settings,
};

const navItems = [
  { name: "Dashboard", href: "/owner/dashboard", icon: "dashboard", active: true },
  { name: "Branches", href: "/owner/branches", icon: "branches" },
  { name: "Sales", href: "/owner/sales", icon: "sales" },
  { name: "Targets", href: "/owner/targets", icon: "targets" },
  { name: "Inventory", href: "/owner/inventory", icon: "inventory" },
  { name: "Products", href: "/owner/products", icon: "products" },
  { name: "Team", href: "/owner/team", icon: "team" },
  { name: "Reports", href: "/owner/reports", icon: "reports" },
  { name: "Audit Log", href: "/owner/audit-log", icon: "audit" },
  { name: "Settings", href: "/owner/settings", icon: "settings" },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 w-[240px] bg-sidebar text-sidebar-foreground flex flex-col h-screen">
      <div className="flex items-center space-x-2.5 p-4 border-b border-sidebar-border">
        <div className="w-7 h-7 bg-primary rounded flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-[10px]">S</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm leading-tight">SalesFlow</span>
          <span className="text-xs text-sidebar-foreground/60">Pro</span>
        </div>
      </div>

      <nav className="flex-1 mt-2 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-smooth ${
                item.active
                  ? "bg-sidebar-accent text-sidebar-foreground border-l-2 border-sidebar-primary pl-[10px]"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center space-x-2.5 p-3 border-t border-sidebar-border">
        <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-[11px]">JD</span>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-[13px] truncate">James Daniel</span>
          <span className="inline-flex items-center text-[9px] font-semibold bg-sidebar-primary/15 text-sidebar-primary px-1.5 py-0.5 rounded w-fit mt-0.5">
            OWNER
          </span>
        </div>
      </div>
    </aside>
  );
}
