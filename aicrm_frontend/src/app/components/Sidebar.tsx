import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Package,
  Tags,
  ShoppingCart,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/conversations", label: "Conversaciones", icon: MessageSquare },
  { path: "/customers", label: "Clientes", icon: Users },
  { path: "/products", label: "Productos", icon: Package },
  { path: "/categories", label: "Categorias", icon: Tags },
  { path: "/orders", label: "Ordenes", icon: ShoppingCart },
  { path: "/settings", label: "Configuracion", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl text-primary" style={{ fontFamily: "var(--font-heading)" }}>
          CRM AI
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
