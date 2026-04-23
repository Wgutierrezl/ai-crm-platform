import { Bell, Search, ChevronDown } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.tsx";
import { Avatar, AvatarFallback } from "./ui/avatar.tsx";
import { useNavigate } from "react-router";

export default function Topbar() {
  const navigate = useNavigate();
  const companyName = "Mi Empresa";
  const userName = "Juan Pérez";
  const userRole = "Admin";

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes, productos, órdenes..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right mr-2">
          <p className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{companyName}</p>
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userName.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm">{userName}</p>
                <p className="text-xs text-muted-foreground">{userRole}</p>
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
