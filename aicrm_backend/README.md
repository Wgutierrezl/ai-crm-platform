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

1. Validar firma `X-Hub-Signature-256`.
2. Cifrar `accessToken` y `appSecret` en BD.
3. Introducir registro de ejecucion de tools (`tool_executions`) con auditoria.
4. Integrar estrategia de prompts por capas en `OpenAIService` (base/canal/asistente/tenant).
5. Pruebas unitarias y e2e del flujo WhatsApp onboarding + IA.

## Estado nuevo: flujo conversacional WhatsApp (implementado)

- Orquestador de entrada en `application`: `HandleInboundChannelMessageUseCase`.
- Resolucion de identidad externa por canal:
  - tabla `external_identities`.
- Estado conversacional para onboarding:
  - tabla `conversation_states`.
- Persistencia de mensajes con metadatos de canal:
  - columnas `source_channel`, `channel_message_id`, `metadata_json` en `messages`.
- Idempotencia inbound por `channel_message_id`.
- Onboarding conversacional:
  - usuario desconocido -> solicitud nombre -> registro -> saludo personalizado.
- Integracion con IA:
  - WhatsApp delega al orquestador, el orquestador delega a `ProcessIncomingMessageUseCase`.
- Base para tools desacopladas:
  - `ToolExecutionService` en `application/services`.

## Migraciones nuevas

- `1710000000003-AddConversationalFoundation`
  - agrega `company_id` a `company_whatsapp_apps` (para multi-tenant consistente),
  - crea `external_identities`,
  - crea `conversation_states`,
  - extiende `messages` con metadata de canal e idempotencia.
- `1710000000004-BackfillWhatsappAppsCompanyId`
  - backfill seguro de `company_whatsapp_apps.company_id` solo si existe un unico tenant.
- `1710000000005-EnhanceCustomerConversationalProfile`
  - amplía `customers` para onboarding conversacional y perfil progresivo.

## Nota operativa: warning de companyId nulo en app WhatsApp

Si aparece:
- `Configuracion incompleta: app WhatsApp id=<id> sin companyId...`

Significa que:
- la configuracion interna del tenant/app esta incompleta,
- NO que el usuario final de WhatsApp necesite credenciales.

Regla correcta:
- `phone_number_id` -> `company_whatsapp_apps` -> `companyId` (tenant) -> credenciales Meta -> cliente externo (`wa_id`/telefono).

SQL de diagnostico:
```sql
SELECT id, company_id, phone_number_id, name
FROM company_whatsapp_apps
WHERE company_id IS NULL;
```

SQL correctivo manual (si aplica):
```sql
UPDATE company_whatsapp_apps
SET company_id = '<COMPANY_ID_CORRECTO>'
WHERE id = 2;
```

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
