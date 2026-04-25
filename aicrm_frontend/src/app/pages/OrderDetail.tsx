import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Bot } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table.tsx";
import { Separator } from "../components/ui/separator.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog.tsx";
import { toast } from "sonner";
import { orderService } from "../../api/services/order.service";
import { logger } from "../../utils/logger/logger";

const mockOrderDetails = {
  id: "ORD-1234",
  customer: "María González",
  customerEmail: "maria.gonzalez@email.com",
  customerPhone: "+57 300 123 4567",
  status: "paid",
  date: "2026-04-22 10:43 AM",
  channel: "chat",
  createdBy: "Bot IA",
  items: [
    {
      id: 1,
      product: "Laptop Dell XPS 15",
      quantity: 1,
      unitPrice: 4500000,
      subtotal: 4500000,
    },
    {
      id: 2,
      product: "Garantía Extendida 3 años",
      quantity: 1,
      unitPrice: 350000,
      subtotal: 350000,
    },
  ],
  total: 4850000,
  statusHistory: [
    { status: "pending", date: "2026-04-22 10:43 AM", user: "Bot IA" },
    { status: "paid", date: "2026-04-22 11:20 AM", user: "Juan Pérez (Agent)" },
  ],
};

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(mockOrderDetails);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;

      try {
        const orders = await orderService.getOrders();
        const found = orders.find((entry) => entry.id === id);

        if (!found) {
          logger.warn("Orden no encontrada en API, se mantiene mock fallback", { id });
          return;
        }

        setOrder({
          id: found.id,
          customer: `Cliente ${found.customerId.slice(0, 6)}`,
          customerEmail: "No disponible",
          customerPhone: "No disponible",
          status: found.status,
          date: new Date(found.createdAt).toLocaleString("es-CO"),
          channel: "chat",
          createdBy: "Sistema",
          items:
            found.items?.map((item, idx) => ({
              id: idx + 1,
              product: `Producto ${item.productId.slice(0, 6)}`,
              quantity: item.quantity,
              unitPrice: item.price,
              subtotal: item.price * item.quantity,
            })) ?? [],
          total: found.total,
          statusHistory: [
            {
              status: "pending",
              date: new Date(found.createdAt).toLocaleString("es-CO"),
              user: "Sistema",
            },
            ...(found.status !== "pending"
              ? [
                  {
                    status: found.status,
                    date: new Date(found.createdAt).toLocaleString("es-CO"),
                    user: "Sistema",
                  },
                ]
              : []),
          ],
        });
      } catch (error) {
        logger.warn("No se pudo cargar detalle de orden desde API. Se usa mock fallback", error);
      }
    };

    loadOrder();
  }, [id]);

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

  const handleMarkAsPaid = () => {
    setOrder((prev) => ({ ...prev, status: "paid" }));
    toast.success("Orden marcada como pagada");
  };

  const handleCancel = () => {
    setOrder((prev) => ({ ...prev, status: "cancelled" }));
    toast.success("Orden cancelada");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Detalle de Orden: {order.id}
          </h1>
          <p className="text-muted-foreground">Información completa de la orden</p>
        </div>
        {order.status === "pending" && (
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar como Pagada
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Marcar como pagada?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción marcará la orden como pagada. ¿Estás seguro?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleMarkAsPaid}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar Orden
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar orden?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción cancelará la orden permanentemente. ¿Estás seguro?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, volver</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>
                    Sí, cancelar orden
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información de la Orden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <div className="mt-1">{getStatusBadge(order.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                <p className="mt-1">{order.date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Canal de Origen</p>
                <Badge variant="outline" className="mt-1">
                  {order.channel === "chat" ? (
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
                <p className="text-sm text-muted-foreground">Creada por</p>
                <p className="mt-1">{order.createdBy}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3">Información del Cliente</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nombre:</span>
                  <span className="text-sm font-medium">{order.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium">{order.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Teléfono:</span>
                  <span className="text-sm font-medium">{order.customerPhone}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3">Items de la Orden</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">
                        ${item.subtotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                Total de la Orden
              </span>
              <span
                className="text-2xl text-primary"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                ${order.total.toLocaleString()}
              </span>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/conversations")}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Volver a Conversación Origen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.statusHistory.map((history, index) => (
                <div key={index} className="relative pl-6 pb-4">
                  {index < order.statusHistory.length - 1 && (
                    <div className="absolute left-2 top-6 bottom-0 w-px bg-border"></div>
                  )}
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(history.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">{history.date}</p>
                    <p className="text-xs text-muted-foreground">Por: {history.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
