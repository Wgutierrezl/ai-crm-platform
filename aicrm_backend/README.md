# AI CRM Backend

Backend NestJS para CRM multi-tenant con arquitectura hexagonal e integracion de canal WhatsApp Cloud API (Meta).

## Estado actual

### CRM Core
- Auth JWT (register/login)
- Productos
- Clientes
- Conversaciones
- Mensajes
- Ordenes
- Flujo IA base (`ProcessIncomingMessageUseCase`) con tools CRM iniciales

### WhatsApp (Meta Cloud API)
- Webhook GET de verificacion: `GET /api/v1/webhooks/whatsapp`
- Webhook POST de recepcion: `POST /api/v1/webhooks/whatsapp`
- Registro interno de app WhatsApp: `POST /api/v1/company-whatsapp-apps`
- Registro interno de credenciales WhatsApp: `POST /api/v1/company-whatsapp-credentials`
- Respuesta automatica temporal outbound ya funcional

## Arquitectura

Estructura hexagonal:
- `domain/`: entidades y puertos
- `application/`: casos de uso
- `infrastructure/`: adapters DB/AI/WhatsApp
- `interfaces/`: controllers, dtos, guards

Regla principal:
- WhatsApp actua como canal de entrada/salida.
- La logica de negocio se orquesta en `application`.
- Integraciones externas se mantienen desacopladas por puertos.

## Variables de entorno (WhatsApp)

Configurar en `.env`:
- `INTERNAL_API_KEY`
- `META_GRAPH_API_VERSION`
- `META_VERIFY_TOKEN` (fallback local opcional)
- `WHATSAPP_WEBHOOK_VALIDATE_SIGNATURE`
- `META_APP_SECRET`

## Ejecucion local

```bash
npm install
npm run migration:run
npm run start:dev
```

## Pruebas webhook con ngrok

1. Exponer local:
```bash
ngrok http 3000
```
2. Configurar callback en Meta:
- `https://<ngrok>.ngrok-free.app/api/v1/webhooks/whatsapp`
3. Configurar verify token en Meta con el token registrado en credenciales.

## Flujo operativo actual (WhatsApp)

1. Usuario envia mensaje al numero WhatsApp conectado.
2. Meta envia webhook POST.
3. Backend extrae `phone_number_id`, resuelve app, extrae mensaje y destinatario.
4. Backend envia respuesta automatica temporal por Graph API.

Respuesta temporal actual:
- "Hola 👋 Soy el asistente virtual de AI CRM. Ya recibi tu mensaje. Pronto podre ayudarte a consultar productos, crear pedidos y resolver dudas comerciales."

## Pendientes inmediatos

1. Persistir mensajes WhatsApp en DB.
2. Resolver/crear cliente por telefono o `wa_id`.
3. Crear/reusar `Conversation`.
4. Integrar webhook con `ProcessIncomingMessageUseCase`.
5. Responder con IA real y tools.
6. Implementar idempotencia por `message_id`/`wamid`.
7. Validar firma `X-Hub-Signature-256`.
8. Cifrar `accessToken` y `appSecret` en BD.

## Vision de evolucion

Evolucion recomendada: de CRM cerrado a plataforma modular de asistente IA.

Modulos objetivo:
- WhatsApp (canal)
- CRM (productos/clientes/pedidos)
- IA (orquestacion de tools)
- Integraciones (Google y otras via adaptadores)

Ejemplos de tools desacopladas:
- `CRM_GET_PRODUCTS`
- `CRM_CREATE_ORDER`
- `CRM_CREATE_CUSTOMER`
- `GOOGLE_GMAIL_SEARCH`
- `GOOGLE_DRIVE_UPLOAD`
- `GOOGLE_CONTACTS_SEARCH`
- `ASSISTANT_HELP_MENU`
