import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Bot } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table.tsx";
import { Separator } from "../components/ui/separator.tsx";
import { toast } from "sonner";
import { orderService } from "../../api/services/order.service";
import { logger } from "../../utils/logger/logger";
import type { OrderDto } from "../../api/dtos/order.dto";
import { formatCurrency } from "../../utils/format/currency";

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

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const orders = await orderService.getOrders();
        const found = orders.find((entry) => entry.id === id) ?? null;
        setOrder(found);
        if (!found) {
          toast.warning("No se encontró la orden solicitada");
        }
      } catch (error) {
        logger.error("No se pudo cargar detalle de orden", error);
        toast.error("No se pudo cargar el detalle de la orden");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const uiStatus = useMemo(() => (order ? getOrderUiStatus(order) : "pending"), [order]);
  const customerName = useMemo(() => {
    if (!order) return "No disponible";
    return order.customer?.fullName || order.customer?.name || `Cliente ${order.customerId.slice(0, 8)}`;
  }, [order]);

  if (!loading && !order) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/orders")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a órdenes
        </Button>
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground">No se encontró información para esta orden.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Detalle de orden: {order?.id}
          </h1>
          <p className="text-muted-foreground">Información completa de la orden</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información de la orden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <div className="mt-1">{getStatusBadge(uiStatus)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de creación</p>
                <p className="mt-1">{order ? new Date(order.createdAt).toLocaleString("es-CO") : "No disponible"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Canal de origen</p>
                <Badge variant="outline" className="mt-1">
                  {order?.paymentTransaction ? (
                    <>
                      <Bot className="w-3 h-3 mr-1" />
                      Chat IA
                    </>
                  ) : (
                    "Manual"
                  )}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cliente ID</p>
                <p className="mt-1">{order?.customerId ?? "No disponible"}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3">Información del cliente</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nombre:</span>
                  <span className="text-sm font-medium">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium">{order?.customer?.email ?? "No disponible"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Teléfono:</span>
                  <span className="text-sm font-medium">{order?.customer?.phone ?? "No disponible"}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3">Items de la orden</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio unitario</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order?.items?.length ? (
                    order.items.map((item) => {
                      const subtotal = item.subtotal ?? item.price * item.quantity;
                      const currency = item.product?.currency || order.paymentTransaction?.currency || "COP";
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product?.name ?? `Producto ${item.productId.slice(0, 8)}`}
                          </TableCell>
                          <TableCell>{item.product?.description ?? "No disponible"}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.price, currency)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(subtotal, currency)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        No hay items disponibles para esta orden.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-lg" style={{ fontFamily: "var(--font-heading)" }}>
                Total de la orden
              </span>
              <span className="text-2xl text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                {formatCurrency(order?.total ?? 0, order?.paymentTransaction?.currency || "COP")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Estado de pago:</span>
              <span className="text-sm font-medium">
                {order?.paymentTransaction?.status ?? "No disponible"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Proveedor:</span>
              <span className="text-sm font-medium">
                {order?.paymentTransaction?.provider ?? "No disponible"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Referencia:</span>
              <span className="text-sm font-medium">
                {order?.paymentTransaction?.mockReference ?? "No disponible"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Método:</span>
              <span className="text-sm font-medium">
                {order?.paymentTransaction?.methodType ?? "No disponible"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Últimos 4:</span>
              <span className="text-sm font-medium">
                {order?.paymentTransaction?.last4 ?? "No disponible"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Marca:</span>
              <span className="text-sm font-medium">
                {order?.paymentTransaction?.brand ?? "No disponible"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Monto:</span>
              <span className="text-sm font-medium">
                {order?.paymentTransaction
                  ? formatCurrency(
                      order.paymentTransaction.amount,
                      order.paymentTransaction.currency || "COP",
                    )
                  : "No disponible"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
