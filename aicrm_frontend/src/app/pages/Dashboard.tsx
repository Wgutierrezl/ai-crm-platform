import { useEffect, useState } from "react";
import { MessageSquare, DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react";
import KPICard from "../components/KPICard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button } from "../components/ui/button.tsx";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router";
import { productService } from "../../api/services/product.service";
import { conversationService } from "../../api/services/conversation.service";
import { orderService } from "../../api/services/order.service";
import { logger } from "../../utils/logger/logger";
import { toast } from "sonner";

const salesData = [
  { day: "Lun", sales: 4200 },
  { day: "Mar", sales: 3800 },
  { day: "Mié", sales: 5100 },
  { day: "Jue", sales: 4600 },
  { day: "Vie", sales: 6200 },
  { day: "Sáb", sales: 5800 },
  { day: "Dom", sales: 4900 },
];

const recentConversations = [
  { id: 1, customer: "María González", lastMessage: "¿Tienen disponible el producto X?", time: "Hace 5 min", status: "active" },
  { id: 2, customer: "Carlos Ruiz", lastMessage: "Quiero hacer un pedido", time: "Hace 12 min", status: "bot" },
  { id: 3, customer: "Ana López", lastMessage: "Gracias por la información", time: "Hace 1h", status: "closed" },
];

const recentOrders = [
  { id: "ORD-1234", customer: "Pedro Martínez", total: "$1,250,000", status: "paid", items: 3 },
  { id: "ORD-1235", customer: "Laura Díaz", total: "$850,000", status: "pending", items: 2 },
  { id: "ORD-1236", customer: "Roberto Silva", total: "$2,100,000", status: "paid", items: 5 },
];

const aiRecommendations = [
  "María González está interesada en el Producto X - Alta probabilidad de cierre",
  "Carlos Ruiz ha visitado la página 3 veces - Enviar oferta especial",
  "3 clientes abandonaron carrito - Seguimiento recomendado",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeConversations, setActiveConversations] = useState(23);
  const [pendingOrders, setPendingOrders] = useState(8);
  const [paidOrders, setPaidOrders] = useState(42);
  const [dailySales, setDailySales] = useState("$4.9M");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [conversations, orders, products] = await Promise.all([
          conversationService.getConversations(),
          orderService.getOrders(),
          productService.getProducts(),
        ]);

        const pending = orders.filter((order) => order.status === "pending").length;
        const paid = orders.filter((order) => order.status === "paid").length;
        const today = new Date().toDateString();
        const todayRevenue = orders
          .filter(
            (order) =>
              order.status === "paid" &&
              new Date(order.createdAt).toDateString() === today,
          )
          .reduce((sum, order) => sum + order.total, 0);

        setActiveConversations(conversations.length);
        setPendingOrders(pending);
        setPaidOrders(paid);
        setDailySales(`$${(todayRevenue / 1000000).toFixed(1)}M`);

        logger.info("Dashboard actualizado", {
          conversations: conversations.length,
          orders: orders.length,
          products: products.length,
        });
      } catch (error) {
        logger.warn("No fue posible cargar dashboard desde API. Se mantiene fallback visual", error);
        toast.warning("Dashboard usando datos de ejemplo");
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tu actividad comercial</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Conversaciones Activas"
          value={activeConversations}
          icon={MessageSquare}
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Ventas del Día"
          value={dailySales}
          icon={DollarSign}
          trend={{ value: 8, isPositive: true }}
          iconColor="text-[var(--success)]"
        />
        <KPICard
          title="Órdenes Pendientes"
          value={pendingOrders}
          icon={Clock}
          iconColor="text-[var(--warning)]"
        />
        <KPICard
          title="Órdenes Pagadas"
          value={paidOrders}
          icon={CheckCircle}
          trend={{ value: 15, isPositive: true }}
          iconColor="text-[var(--success)]"
        />
        <KPICard
          title="Conversión Bot → Orden"
          value="68%"
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
          iconColor="text-primary"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Ventas Semanal</CardTitle>
          <CardDescription>Ventas de los últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: 'var(--primary)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversaciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate("/conversations")}
                >
                  <div className="flex-1">
                    <p className="font-medium">{conv.customer}</p>
                    <p className="text-sm text-muted-foreground">{conv.lastMessage}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{conv.time}</span>
                    <Badge variant={conv.status === "active" ? "default" : conv.status === "bot" ? "secondary" : "outline"}>
                      {conv.status === "active" ? "Activa" : conv.status === "bot" ? "Bot" : "Cerrada"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/conversations")}>
              Ver todas las conversaciones
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recomendaciones IA</CardTitle>
            <CardDescription>Acciones sugeridas para cerrar ventas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiRecommendations.map((rec, index) => (
                <div key={index} className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div>
                  <p className="font-medium">{order.id}</p>
                  <p className="text-sm text-muted-foreground">{order.customer} • {order.items} items</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{order.total}</span>
                  <Badge variant={order.status === "paid" ? "default" : "secondary"}>
                    {order.status === "paid" ? "Pagada" : "Pendiente"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/orders")}>
            Ver todas las órdenes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
