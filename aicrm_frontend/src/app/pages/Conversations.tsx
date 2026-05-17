import { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Bot, Loader2, Paperclip, Send, Search } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { ScrollArea } from "../components/ui/scroll-area.tsx";
import { toast } from "sonner";
import { conversationService } from "../../api/services/conversation.service";
import { messageService } from "../../api/services/message.service";
import { logger } from "../../utils/logger/logger";
import type { ConversationDto } from "../../api/dtos/conversation.dto";
import type { MessageDto } from "../../api/dtos/message.dto";

type ConversationView = {
  id: string;
  customerId: string;
  companyId: string;
  createdAt: string;
};

export default function Conversations() {
  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedConversation = useMemo(
    () => conversations.find((conv) => conv.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoadingConversations(true);
        setConversationError(null);

        const apiConversations = await conversationService.getConversations();
        const sorted = [...apiConversations].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setConversations(
          sorted.map((conv: ConversationDto) => ({
            id: conv.id,
            customerId: conv.customerId,
            companyId: conv.companyId,
            createdAt: conv.createdAt,
          })),
        );

        if (sorted.length > 0) {
          setSelectedConversationId(sorted[0].id);
        } else {
          setSelectedConversationId(null);
        }
      } catch (error) {
        logger.warn("No se pudieron cargar conversaciones desde API", error);
        setConversationError("No se pudieron cargar las conversaciones.");
        toast.error("No se pudieron cargar las conversaciones");
      } finally {
        setLoadingConversations(false);
      }
    };

    queueMicrotask(() => {
      void loadConversations();
    });
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversationId) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        setMessageError(null);

        const data = await conversationService.getConversationMessages(selectedConversationId);
        setMessages(data);
      } catch (error) {
        logger.error("No se pudo cargar el historial de mensajes", error);
        setMessageError("No fue posible cargar el historial de mensajes.");
      } finally {
        setLoadingMessages(false);
      }
    };

    void loadMessages();
  }, [selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      if (!term) return true;
      return (
        conv.id.toLowerCase().includes(term) ||
        conv.customerId.toLowerCase().includes(term)
      );
    });
  }, [conversations, searchQuery]);

  const handleSendMessage = async (asAgent = true) => {
    if (!newMessage.trim() || !selectedConversationId) return;

    setSending(true);
    try {
      if (asAgent) {
        await messageService.sendMessage(selectedConversationId, newMessage);
      } else {
        await messageService.processIncomingMessage(selectedConversationId, newMessage);
      }

      const refreshed = await conversationService.getConversationMessages(selectedConversationId);
      setMessages(refreshed);

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

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Conversaciones
        </h1>
        <p className="text-muted-foreground">Gestiona las conversaciones con tus clientes</p>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100%-5rem)]">
        <Card className="col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Conversaciones</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchQuery(event.target.value)}
                placeholder="Buscar por ID o customerId"
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-4">
                {loadingConversations ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando conversaciones...
                  </div>
                ) : conversationError ? (
                  <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    {conversationError}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    {conversations.length === 0
                      ? "Aun no hay conversaciones registradas."
                      : "No se encontraron conversaciones con esa busqueda."}
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversationId === conv.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-accent"
                      }`}
                    >
                      <div className="mb-1">
                        <p className="font-medium text-sm">Conv: {conv.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">Customer: {conv.customerId.slice(0, 8)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.createdAt).toLocaleString("es-CO")}
                        </span>
                        <Badge variant="outline">Activa</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-6 flex flex-col">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedConversation
                    ? `Conversacion ${selectedConversation.id.slice(0, 8)}`
                    : "Sin conversacion seleccionada"}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedConversation
                    ? `Customer: ${selectedConversation.customerId}`
                    : "Selecciona una conversacion para ver mensajes."}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando historial...
                </div>
              ) : messageError ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  {messageError}
                </div>
              ) : !selectedConversation ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Selecciona una conversacion para ver su historial real.
                </div>
              ) : messages.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Esta conversacion aun no tiene mensajes.
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex flex-col">
                      <div className={`max-w-[70%] rounded-lg p-3 ${getMessageBubbleClass(message.role)}`}>
                        {message.role === "bot" && (
                          <div className="flex items-center gap-2 mb-1">
                            <Bot className="w-4 h-4" />
                            <span className="text-xs">Bot IA</span>
                          </div>
                        )}
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <span
                        className={`text-xs text-muted-foreground mt-1 ${
                          message.role === "agent" ? "text-right" : ""
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" disabled>
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  disabled={sending || !selectedConversationId}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                    e.key === "Enter" && void handleSendMessage()
                  }
                />
                <Button onClick={() => void handleSendMessage()} disabled={sending || !selectedConversationId}>
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? "Enviando..." : "Como Agente"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void handleSendMessage(false)}
                  disabled={sending || !selectedConversationId}
                >
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
          <CardContent className="flex-1 overflow-hidden space-y-4">
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Sugerencias IA disponibles cuando exista endpoint real de contexto comercial para conversaciones.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
