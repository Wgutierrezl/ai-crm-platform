import { useState, type ChangeEvent } from "react";
import { Search, Eye, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Card, CardContent, CardHeader } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx";
import { useNavigate } from "react-router";
import KPICard from "../components/KPICard";
import { DollarSign, Clock, CheckCircle as CheckCircleIcon } from "lucide-react";

const mockOrders = [
  {
    id: "ORD-1234",
    customer: "María González",
    status: "paid",
    total: 4850000,
    date: "2026-04-22",
    channel: "chat",
    items: 2,
  },
  {
    id: "ORD-1235",
    customer: "Carlos Ruiz",
    status: "pending",
    total: 1200000,
    date: "2026-04-22",
    channel: "chat",
    items: 1,
  },
  {
    id: "ORD-1236",
    customer: "Ana López",
    status: "paid",
    total: 2100000,
    date: "2026-04-21",
    channel: "manual",
    items: 3,
  },
  {
    id: "ORD-1237",
    customer: "Pedro Martínez",
    status: "cancelled",
    total: 980000,
    date: "2026-04-21",
    channel: "chat",
    items: 1,
  },
  {
    id: "ORD-1238",
    customer: "Laura Díaz",
    status: "pending",
    total: 3500000,
    date: "2026-04-20",
    channel: "manual",
    items: 4,
  },
];

export default function Orders() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "paid":
        return <Badge className="bg-[var(--success)] text-white">Pagada</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return null;
    }
  };

  const totalOrders = mockOrders.length;
  const pendingOrders = mockOrders.filter((o) => o.status === "pending").length;
  const paidOrders = mockOrders.filter((o) => o.status === "paid").length;
  const totalRevenue = mockOrders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Órdenes
        </h1>
        <p className="text-muted-foreground">Gestiona todas las órdenes de compra</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Órdenes"
          value={totalOrders}
          icon={DollarSign}
          iconColor="text-primary"
        />
        <KPICard
          title="Pendientes"
          value={pendingOrders}
          icon={Clock}
          iconColor="text-[var(--warning)]"
        />
        <KPICard
          title="Pagadas"
          value={paidOrders}
          icon={CheckCircleIcon}
          iconColor="text-[var(--success)]"
        />
        <KPICard
          title="Ingresos"
          value={`$${(totalRevenue / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          iconColor="text-[var(--success)]"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID o cliente..."
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="font-medium">
                    ${order.total.toLocaleString()}
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {order.channel === "chat" ? "Chat IA" : "Manual"}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      {order.status === "pending" && (
                        <>
                          <Button variant="ghost" size="sm" className="text-[var(--success)]">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-[var(--error)]">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
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
