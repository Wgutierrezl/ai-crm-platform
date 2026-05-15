import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Eye, Search } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Card, CardContent, CardHeader } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx";
import { useNavigate } from "react-router";
import KPICard from "../components/KPICard";
import { DollarSign, Clock, CheckCircle as CheckCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { orderService } from "../../api/services/order.service";
import { logger } from "../../utils/logger/logger";
import type { OrderDto } from "../../api/dtos/order.dto";
import { formatCurrency } from "../../utils/format/currency";

type FilterStatus = "all" | "pending" | "paid" | "cancelled" | "failed";

function getOrderUiStatus(order: OrderDto): "pending" | "paid" | "cancelled" | "failed" {
  if (order.status === "cancelled") return "cancelled";
  if (order.status === "payment_failed") return "failed";

  const paymentStatus = order.paymentTransaction?.status;
  if (paymentStatus === "approved") return "paid";
  if (paymentStatus === "rejected" || paymentStatus === "error") return "failed";
  if (paymentStatus === "pending") return "pending";

  if (order.status === "paid" || order.status === "confirmed" || order.status === "mock_paid") {
    return "paid";
  }

  return "pending";
}

function getStatusBadge(status: "pending" | "paid" | "cancelled" | "failed") {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pendiente</Badge>;
    case "paid":
      return <Badge className="bg-[var(--success)] text-white">Pagada</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelada</Badge>;
    case "failed":
      return <Badge variant="destructive">Pago fallido</Badge>;
    default:
      return <Badge variant="secondary">No disponible</Badge>;
  }
}

function getChannelLabel(order: OrderDto): "Chat IA" | "Manual" {
  return order.paymentTransaction ? "Chat IA" : "Manual";
}

function getCustomerName(order: OrderDto): string {
  return (
    order.customer?.fullName ||
    order.customer?.name ||
    `Cliente ${order.customerId.slice(0, 8)}`
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const data = await orderService.getOrders();
        setOrders(data);
      } catch (error) {
        logger.error("No se pudieron cargar órdenes desde API", error);
        toast.error("No se pudieron cargar las órdenes");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const enrichedOrders = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        uiStatus: getOrderUiStatus(order),
        customerName: getCustomerName(order),
        itemCount: order.items?.length ?? 0,
      })),
    [orders],
  );

  const filteredOrders = enrichedOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || order.uiStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalOrders = enrichedOrders.length;
  const pendingOrders = enrichedOrders.filter((o) => o.uiStatus === "pending").length;
  const paidOrders = enrichedOrders.filter((o) => o.uiStatus === "paid").length;
  const totalRevenue = enrichedOrders
    .filter((o) => o.uiStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Órdenes
        </h1>
        <p className="text-muted-foreground">Gestiona todas las órdenes de compra</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Total órdenes" value={totalOrders} icon={DollarSign} iconColor="text-primary" />
        <KPICard title="Pendientes" value={pendingOrders} icon={Clock} iconColor="text-[var(--warning)]" />
        <KPICard title="Pagadas" value={paidOrders} icon={CheckCircleIcon} iconColor="text-[var(--success)]" />
        <KPICard
          title="Ingresos"
          value={formatCurrency(totalRevenue)}
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
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="failed">Pago fallido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Fecha creación</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading &&
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{getStatusBadge(order.uiStatus)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleString("es-CO")}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getChannelLabel(order)}</Badge>
                    </TableCell>
                    <TableCell>{order.itemCount}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {!loading && filteredOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">No hay órdenes para los filtros seleccionados.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
