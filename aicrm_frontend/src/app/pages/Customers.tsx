import { useState, type ChangeEvent } from "react";
import { Search, MessageSquare, ShoppingCart } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Card, CardContent, CardHeader } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx";
import { useNavigate } from "react-router";

const mockCustomers = [
  {
    id: 1,
    name: "María González",
    phone: "+57 300 123 4567",
    email: "maria.gonzalez@email.com",
    identification: "CC 1234567890",
    lastConversation: "Hace 5 min",
    totalPurchased: 3250000,
    status: "frequent",
  },
  {
    id: 2,
    name: "Carlos Ruiz",
    phone: "+57 301 234 5678",
    email: "carlos.ruiz@email.com",
    identification: "CC 2345678901",
    lastConversation: "Hace 12 min",
    totalPurchased: 1580000,
    status: "new",
  },
  {
    id: 3,
    name: "Ana López",
    phone: "+57 302 345 6789",
    email: "ana.lopez@email.com",
    identification: "CC 3456789012",
    lastConversation: "Hace 1h",
    totalPurchased: 4750000,
    status: "frequent",
  },
  {
    id: 4,
    name: "Pedro Martínez",
    phone: "+57 303 456 7890",
    email: "pedro.martinez@email.com",
    identification: "CC 4567890123",
    lastConversation: "Hace 2 días",
    totalPurchased: 0,
    status: "no-purchase",
  },
  {
    id: 5,
    name: "Laura Díaz",
    phone: "+57 304 567 8901",
    email: "laura.diaz@email.com",
    identification: "CC 5678901234",
    lastConversation: "Hace 3h",
    totalPurchased: 2100000,
    status: "new",
  },
];

export default function Customers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    const matchesFilter = filterStatus === "all" || customer.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="default">Nuevo</Badge>;
      case "frequent":
        return <Badge className="bg-[var(--success)] text-white">Frecuente</Badge>;
      case "no-purchase":
        return <Badge variant="secondary">Sin compra</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Clientes
          </h1>
          <p className="text-muted-foreground">Gestiona tu base de clientes</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                <SelectItem value="new">Clientes nuevos</SelectItem>
                <SelectItem value="frequent">Clientes frecuentes</SelectItem>
                <SelectItem value="no-purchase">Sin compra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Última Conversación</TableHead>
                <TableHead>Total Comprado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.identification}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.lastConversation}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${customer.totalPurchased.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/conversations")}
                        title="Ver conversaciones"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/orders")}
                        title="Crear orden"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
