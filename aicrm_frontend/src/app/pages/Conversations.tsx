import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Send, Bot, Package, UserPlus, ShoppingCart, Paperclip } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { ScrollArea } from "../components/ui/scroll-area.tsx";
import { toast } from "sonner";
import { conversationService } from "../../api/services/conversation.service";
import { messageService } from "../../api/services/message.service";
import { logger } from "../../utils/logger/logger";
import type { MessageRole } from "../../api/dtos/message.dto";

const mockConversations = [
  {
    id: "1",
    customer: "María González",
    lastMessage: "¿Tienen disponible el producto X?",
    time: "5 min",
    unread: true,
    status: "lead",
  },
  {
    id: "2",
    customer: "Carlos Ruiz",
    lastMessage: "Quiero hacer un pedido",
    time: "12 min",
    unread: false,
    status: "interested",
  },
  {
    id: "3",
    customer: "Ana López",
    lastMessage: "Gracias por la información",
    time: "1h",
    unread: false,
    status: "buyer",
  },
];

const mockMessages = [
  {
    id: 1,
    role: "customer",
    content: "Hola, buenos días. Estoy buscando una laptop para trabajo",
    timestamp: "10:30 AM",
  },
  {
    id: 2,
    role: "bot",
    content: "¡Hola! Encantado de ayudarte. Tenemos varias opciones de laptops. ¿Qué características te interesan más?",
    timestamp: "10:30 AM",
  },
  {
    id: 3,
    role: "customer",
    content: "Necesito algo con buen rendimiento, al menos 16GB RAM",
    timestamp: "10:32 AM",
  },
  {
    id: 4,
    role: "bot",
    content: "Perfecto! Te recomiendo la Laptop Dell XPS 15. Tiene 16GB RAM, procesador Intel i7, y excelente rendimiento. El precio es $4,500,000. ¿Te gustaría más información?",
    timestamp: "10:32 AM",
    action: "GET_PRODUCTS",
  },
  {
    id: 5,
    role: "customer",
    content: "Sí, me interesa. ¿Cuánto tiempo de garantía tiene?",
    timestamp: "10:35 AM",
  },
  {
    id: 6,
    role: "agent",
    content: "Hola María, soy Juan del equipo de ventas. La laptop tiene 1 año de garantía del fabricante y podemos extenderla a 3 años por un costo adicional.",
    timestamp: "10:40 AM",
  },
  {
    id: 7,
    role: "customer",
    content: "Perfecto, me gustaría comprarla con la garantía extendida",
    timestamp: "10:42 AM",
  },
  {
    id: 8,
    role: "bot",
    content: "¡Excelente! He creado tu orden con la Laptop Dell XPS 15 y garantía extendida. El total es $4,850,000. Te enviaré los detalles de pago.",
    timestamp: "10:43 AM",
    action: "CREATE_ORDER",
  },
];

const suggestedProducts = [
  { id: 1, name: "Laptop Dell XPS 15", price: 4500000 },
  { id: 2, name: "Monitor LG 27 4K", price: 1200000 },
  { id: 3, name: "Mouse Logitech MX Master", price: 280000 },
];

const aiSuggestedActions = [
  { label: "Ver productos", icon: Package, action: "GET_PRODUCTS" },
  { label: "Crear cliente", icon: UserPlus, action: "CREATE_CUSTOMER" },
  { label: "Crear orden", icon: ShoppingCart, action: "CREATE_ORDER" },
];

export default function Conversations() {
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const apiConversations = await conversationService.getConversations();
        if (apiConversations.length === 0) {
          return;
        }

        const mapped = apiConversations.map((conv, index) => ({
          id: conv.id,
          customer: `Cliente ${index + 1}`,
          lastMessage: "Conversación activa",
          time: new Date(conv.createdAt).toLocaleDateString("es-CO"),
          unread: false,
          status: "lead",
        }));

        setConversations(mapped);
        setSelectedConversation(mapped[0]);
      } catch (error) {
        logger.warn("No se pudieron cargar conversaciones desde API. Se usa mock fallback", error);
        toast.warning("Conversaciones cargadas desde datos de ejemplo");
      }
    };

    loadConversations();
  }, []);

  const handleSendMessage = async (asAgent = true) => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      if (asAgent) {
        const response = await messageService.sendMessage(
          String(selectedConversation.id),
          newMessage,
        );

        const message = {
          id: messages.length + 1,
          role: response.role as MessageRole,
          content: response.content,
          timestamp: new Date(response.createdAt).toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prev) => [...prev, message]);
      } else {
        const response = await messageService.processIncomingMessage(
          String(selectedConversation.id),
          newMessage,
        );

        const customerMessage = {
          id: messages.length + 1,
          role: response.customerMessage.role as MessageRole,
          content: response.customerMessage.content,
          timestamp: new Date(response.customerMessage.createdAt).toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        const botMessage = {
          id: messages.length + 2,
          role: response.botMessage.role as MessageRole,
          content: response.botMessage.content,
          timestamp: new Date(response.botMessage.createdAt).toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          action: response.actionExecuted,
        };

        setMessages((prev) => [...prev, customerMessage, botMessage]);
      }

      setNewMessage("");
      toast.success(`Mensaje enviado como ${asAgent ? "agente" : "IA"}`);
    } catch (error) {
      logger.error("Error al enviar mensaje", error);
      toast.error("No fue posible enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  const getMessageBubbleClass = (role: string) => {
    switch (role) {
      case "customer":
        return "bg-card border border-border text-foreground ml-0 mr-auto";
      case "agent":
        return "bg-primary text-primary-foreground ml-auto mr-0";
      case "bot":
        return "bg-primary/10 border border-primary/20 text-foreground ml-0 mr-auto";
      default:
        return "";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "lead":
        return <Badge variant="secondary">Lead</Badge>;
      case "interested":
        return <Badge className="bg-[var(--info)] text-white">Interesado</Badge>;
      case "buyer":
        return <Badge className="bg-[var(--success)] text-white">Comprador</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Conversaciones
        </h1>
        <p className="text-muted-foreground">Gestiona las conversaciones con tus clientes</p>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100%-5rem)]">
        <Card className="col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Conversaciones</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-4">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation.id === conv.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm">{conv.customer}</p>
                      {conv.unread && (
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      {conv.lastMessage}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{conv.time}</span>
                      {getStatusBadge(conv.status)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-6 flex flex-col">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedConversation.customer}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {getStatusBadge(selectedConversation.status)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex flex-col">
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${getMessageBubbleClass(
                        message.role
                      )}`}
                    >
                      {message.role === "bot" && (
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className="w-4 h-4" />
                          <span className="text-xs">Bot IA</span>
                        </div>
                      )}
                      <p className="text-sm">{message.content}</p>
                      {message.action && (
                        <div className="mt-2 pt-2 border-t border-current/20">
                          <Badge variant="outline" className="text-xs">
                            Acción: {message.action}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs text-muted-foreground mt-1 ${
                        message.role === "agent" ? "text-right" : ""
                      }`}
                    >
                      {message.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  disabled={sending}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={() => handleSendMessage()} disabled={sending}>
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? "Enviando..." : "Como Agente"}
                </Button>
                <Button variant="secondary" onClick={() => handleSendMessage(false)} disabled={sending}>
                  <Bot className="w-4 h-4 mr-2" />
                  Enviar a IA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Contexto Comercial</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden space-y-6">
            <div>
              <h3 className="font-medium mb-3">Productos Sugeridos</h3>
              <div className="space-y-2">
                {suggestedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
                  >
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-sm text-primary">
                      ${product.price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Carrito Sugerido por IA</h3>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Laptop Dell XPS 15</span>
                    <span>$4,500,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Garantía extendida</span>
                    <span>$350,000</span>
                  </div>
                  <div className="pt-2 border-t border-primary/20 flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-primary">$4,850,000</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Acciones Sugeridas</h3>
              <div className="space-y-2">
                {aiSuggestedActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => toast.info(`Acción: ${action.action}`)}
                  >
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
              <p className="text-sm font-medium text-[var(--success)] mb-1">
                Orden creada automáticamente
              </p>
              <p className="text-xs text-muted-foreground">
                La IA creó la orden ORD-1234 por $4,850,000
              </p>
              <Button variant="outline" size="sm" className="w-full mt-2">
                Ver orden
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
