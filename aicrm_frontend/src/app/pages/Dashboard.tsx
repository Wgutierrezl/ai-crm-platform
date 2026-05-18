import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Box,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import KPICard from "../components/KPICard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button } from "../components/ui/button.tsx";
import { productService } from "../../api/services/product.service";
import { conversationService } from "../../api/services/conversation.service";
import { orderService } from "../../api/services/order.service";
import { logger } from "../../utils/logger/logger";
import type { ConversationDto } from "../../api/dtos/conversation.dto";
import type { OrderDto } from "../../api/dtos/order.dto";
import type { ProductDto } from "../../api/dtos/product.dto";

type DashboardData = {
  conversations: ConversationDto[];
  orders: OrderDto[];
  products: ProductDto[];
};

const moneyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function getOrderStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Pagada";
    case "confirmed":
      return "Confirmada";
    case "pending":
      return "Pendiente";
    case "cancelled":
      return "Cancelada";
    case "mock_paid":
      return "Mock pagada";
    case "payment_failed":
      return "Pago fallido";
    default:
      return status;
  }
}

function getConversationCustomerName(conversation: ConversationDto): string {
  return (
    conversation.customer?.fullName ||
    conversation.customer?.name ||
    [conversation.customer?.firstName, conversation.customer?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Cliente no disponible"
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({
    conversations: [],
    orders: [],
    products: [],
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);

        const [conversations, orders, products] = await Promise.all([
          conversationService.getConversations(),
          orderService.getOrders(),
          productService.getProducts(),
        ]);

        setData({ conversations, orders, products });

        logger.info("Dashboard actualizado con datos reales", {
          conversations: conversations.length,
          orders: orders.length,
          products: products.length,
        });
      } catch (error) {
        logger.warn("No fue posible cargar dashboard desde API", error);
        setErrorMessage("No fue posible cargar el dashboard.");
        toast.error("No fue posible cargar el dashboard");
      } finally {
        setLoading(false);
      }
    };

    queueMicrotask(() => {
      void loadDashboardData();
    });
  }, []);

  const metrics = useMemo(() => {
    const totalConversations = data.conversations.length;
    const totalProducts = data.products.length;
    const totalOrders = data.orders.length;

    const pendingOrders = data.orders.filter((order) => order.status === "pending").length;
    const completedOrders = data.orders.filter(
      (order) => order.status === "paid" || order.status === "confirmed" || order.status === "mock_paid",
    ).length;

    const totalSales = data.orders
      .filter((order) => order.status === "paid" || order.status === "confirmed" || order.status === "mock_paid")
      .reduce((sum, order) => sum + order.total, 0);

    const lowStockProducts = data.products.filter(
      (product) => product.stock <= (product.minStock ?? 0),
    ).length;

    return {
      totalConversations,
      totalProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalSales,
      lowStockProducts,
    };
  }, [data]);

  const recentOrders = useMemo(() => {
    return [...data.orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [data.orders]);

  const recentConversations = useMemo(() => {
    return [...data.conversations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [data.conversations]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Dashboard
        </h1>
        <p className="text-muted-foreground">Resumen de tu actividad comercial</p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando metricas del dashboard...
            </div>
          </CardContent>
        </Card>
      ) : errorMessage ? (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
              <p className="font-medium">No se pudo cargar el dashboard.</p>
              <p className="text-sm text-muted-foreground">
                Verifica tu conexion o vuelve a intentar en unos segundos.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Conversaciones" value={metrics.totalConversations} icon={MessageSquare} />
            <KPICard title="Productos" value={metrics.totalProducts} icon={Box} />
            <KPICard title="Ordenes" value={metrics.totalOrders} icon={Clock} iconColor="text-[var(--warning)]" />
            <KPICard title="Ventas acumuladas" value={moneyFormatter.format(metrics.totalSales)} icon={DollarSign} iconColor="text-[var(--success)]" />
            <KPICard title="Ordenes pendientes" value={metrics.pendingOrders} icon={Clock} iconColor="text-[var(--warning)]" />
            <KPICard title="Ordenes completadas" value={metrics.completedOrders} icon={CheckCircle} iconColor="text-[var(--success)]" />
            <KPICard title="Productos con stock bajo" value={metrics.lowStockProducts} icon={AlertCircle} iconColor="text-[var(--warning)]" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tendencia de ventas</CardTitle>
              <CardDescription>Estado actual de analitica del dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
                <p className="font-medium">No disponible hasta tener endpoint de metricas.</p>
                <p className="text-sm text-muted-foreground">
                  La tendencia de ventas requiere un endpoint agregado de series temporales.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Conversaciones recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {recentConversations.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
                    <p className="font-medium">Aun no hay conversaciones registradas.</p>
                    <p className="text-sm text-muted-foreground">
                      Las conversaciones apareceran aqui cuando existan en backend.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => navigate("/conversations")}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{getConversationCustomerName(conv)}</p>
                          <p className="text-sm text-muted-foreground">
                            {conv.lastMessage?.content || "Sin mensajes todavia"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {new Date(conv.lastMessage?.createdAt || conv.createdAt).toLocaleString("es-CO")}
                          </span>
                          <Badge variant="outline">{(conv.messageCount ?? 0).toString()} msgs</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/conversations")}>
                  Ver todas las conversaciones
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones inteligentes</CardTitle>
                <CardDescription>Estado de integracion de analitica/IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Las recomendaciones estaran disponibles cuando se conecte el endpoint de analitica/IA para dashboard.
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ordenes recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
                  <p className="font-medium">Aun no hay ordenes registradas.</p>
                  <p className="text-sm text-muted-foreground">
                    Las ordenes apareceran aqui cuando existan en backend.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer?.fullName || order.customer?.name || "Cliente no disponible"} • {order.items.length} items
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{moneyFormatter.format(order.total)}</span>
                        <Badge variant={order.status === "pending" ? "secondary" : "default"}>
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/orders")}>
                Ver todas las ordenes
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
