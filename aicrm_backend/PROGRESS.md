# PROGRESS - AI CRM Backend

## Funcionalidades implementadas
- Arquitectura hexagonal base creada (domain/application/infrastructure/interfaces).
- Entidades de dominio implementadas: Company, User, Customer, Product, Conversation, Message, Order, OrderItem.
- Puertos de dominio implementados:
  - CompanyRepository
  - UserRepository
  - CustomerRepository
  - ProductRepository
  - ConversationRepository
  - MessageRepository
  - OrderRepository
  - OrderItemRepository
  - AIService
- Casos de uso implementados:
  - RegisterUser
  - LoginUser
  - CreateProduct
  - GetProductsByCompany
  - CreateConversation
  - CreateMessage
  - GetConversations
  - CreateOrder
  - GetOrdersByCompany
  - ProcessIncomingMessage
- Adaptadores de infraestructura TypeORM:
  - Entidades ORM separadas del dominio.
  - Repositorios concretos con mapeo dominio <-> persistencia.
- Integracion IA:
  - OpenAIService con prompt de ventas + reglas + respuesta JSON.
  - Tools soportadas: GET_PRODUCTS, CREATE_CUSTOMER, CREATE_ORDER.
- Seguridad:
  - bcrypt para hash de password.
  - JWT para autenticacion.
  - Guard JWT para proteger endpoints.
  - companyId extraido del token automaticamente.
- HTTP Interfaces:
  - AuthController
  - ProductController
  - ConversationController
  - MessageController
  - OrderController
  - DTOs con class-validator.
- Base de datos:
  - Configuracion TypeORM para MySQL mediante .env.
  - Migracion inicial con tablas y llaves foraneas.
- Configuracion:
  - .env y .env.example creados.
  - .env ya ignorado en .gitignore.

## Pendientes
- Implementar manejo de errores de dominio mas granular (clases de excepcion propias).
- Agregar pruebas unitarias y e2e por modulo.
- Mejorar validacion de payload de tools de IA con schemas estrictos.
- Incorporar control de permisos por rol (admin/agent) a nivel de rutas.
- Crear seeds iniciales para datos de prueba.
- Definir estrategia de observabilidad (logs estructurados y tracing).

## Cambios recientes
- Normalizacion de idioma (ingles -> espanol) en comentarios, mensajes y descripciones dentro del codigo.
- Documentacion del codigo con estilo JSDoc en casos de uso y componentes clave.
- Integracion de Swagger en NestJS con exposicion en /api/docs.
- Documentacion de endpoints con @ApiTags, @ApiOperation, @ApiResponse, @ApiBody y @ApiBearerAuth.
- Documentacion de DTOs con @ApiProperty y ejemplos de uso por campo.
- Configuracion de autenticacion en Swagger mediante Bearer Token JWT.
- Se agrego el script [src/infrastructure/database/test-connection.ts](src/infrastructure/database/test-connection.ts) para validar la conexion a MySQL con variables de entorno.
- Se ejecuto la migracion de base de datos para crear/aplicar estructura inicial del CRM.

Fecha: 2026-04-22
Descripcion breve: Se reforzo la capa de interfaces HTTP con documentacion OpenAPI completa, se mejoro la mantenibilidad con JSDoc en application y se estandarizo el idioma del proyecto al espanol sin alterar la arquitectura hexagonal.

## Bitacora
- 2026-04-22: Se creo base hexagonal completa para CRM multi-tenant en NestJS.
- 2026-04-22: Se implementaron entidades, puertos, casos de uso y adaptadores TypeORM.
- 2026-04-22: Se integro OpenAIService con flujo de tools y ejemplo CREATE_ORDER.
- 2026-04-22: Se configuraron JWT, guard de autenticacion y extraccion de companyId desde token.
- 2026-04-22: Se agrego migracion inicial y configuracion MySQL via variables de entorno.
- 2026-04-22: Se agrego script de prueba de conexion a BD y se corrio la migracion en entorno local.

## Entrada 2026-05-05

### Integracion inicial WhatsApp Cloud API (Meta)
- Se agrego soporte multi-tenant para credenciales de WhatsApp por empresa:
  - Entidad de dominio `CompanyWhatsappCredential`.
  - Entidad ORM `company_whatsapp_credentials`.
  - Puerto de repositorio y adaptador TypeORM.
  - Migracion `1710000000001-AddCompanyWhatsappCredentials`.
- Se implemento caso de uso `UpsertCompanyWhatsappCredentialUseCase`:
  - Crea o actualiza credenciales por `companyId`.
  - Valida conflicto de `phoneNumberId` entre empresas.
  - Devuelve salida saneada (sin secretos).
- Se agrego endpoint interno:
  - `POST /api/v1/company-whatsapp-credentials`
  - Protegido con header `X-Internal-Api-Key` contra `INTERNAL_API_KEY`.
- Se implementaron endpoints de webhook:
  - `GET /api/v1/webhooks/whatsapp` (verificacion Meta por token en BD y fallback opcional global).
  - `POST /api/v1/webhooks/whatsapp` (recepcion base, extraccion de `phone_number_id`, resolucion de `companyId`, log de mensaje).
- Se creo adaptador `MetaWhatsappService` con metodo `sendTextMessage(...)` para envio a Graph API.
- Se actualizaron variables de entorno en `.env.example`.
- Se registraron controllers/providers/entities nuevos en `AppModule`.

## Entrada 2026-05-06

### Integracion WhatsApp Cloud API - estado funcional de canal
- Se completo la recepcion real de mensajes desde Meta en:
  - `GET /api/v1/webhooks/whatsapp` (verificacion de webhook).
  - `POST /api/v1/webhooks/whatsapp` (recepcion de eventos/mensajes).
- Se valido flujo real con ngrok + callback de Meta.
- Se confirmo extraccion de payload clave:
  - `phone_number_id`
  - `whatsappAppId`
  - `wa_id` / `from`
  - `message_id`
  - `text.body`
- Se implemento respuesta automatica temporal outbound por WhatsApp usando `MetaWhatsappService.sendTextMessage(...)`.
- Se valido fin a fin el canal:
  - usuario escribe por WhatsApp
  - backend recibe evento
  - backend responde mensaje predeterminado al usuario.

### Respuesta temporal actual
- `"Hola 👋 Soy el asistente virtual de AI CRM. Ya recibi tu mensaje. Pronto podre ayudarte a consultar productos, crear pedidos y resolver dudas comerciales."`

### Problemas tecnicos resueltos en esta sesion
1. JWT / build:
   - error de tipado en `expiresIn` corregido con tipado compatible de `jsonwebtoken`.
2. TypeORM + MySQL:
   - correccion de columnas nullable con `type` explicito para evitar inferencia `Object`.
3. TypeScript nullability:
   - normalizacion `null/undefined` en mapeos ORM -> dominio (`?? null`).
4. Modelo conceptual de integracion:
   - se reemplazo enfoque inicial acoplado a `companies` por modelo desacoplado:
     - `company_whatsapp_apps` (identidad de app/numero WhatsApp)
     - `company_whatsapp_credentials` (secretos/tokens).
5. Migraciones:
   - se aplico migracion correctiva para separar app/numero de credenciales y remover dependencia a `companies`.

### Estado actual de la integracion
- WhatsApp canal: **funcional**.
- Inbound webhook: **funcional**.
- Outbound mensaje temporal: **funcional**.
- Seguridad base:
  - endpoints internos protegidos con `X-Internal-Api-Key`.
  - variables de entorno de WhatsApp agregadas.

### Aun no implementado (pendiente inmediato)
- Integracion completa con:
  - `Customer`
  - `Conversation`
  - `Message`
  - `ProcessIncomingMessageUseCase`
  - OpenAI + tools de negocio en flujo webhook
- Registro conversacional de cliente desconocido.
- Idempotencia por `message_id`/`wamid`.
- Validacion de firma `X-Hub-Signature-256`.
- Cifrado de `accessToken` / `appSecret` en base de datos.

## Entrada 2026-04-24

### Funcionalidades implementadas
- Registro de usuario.
- Login con autenticacion JWT.
- Creacion de productos.

### Mejoras tecnicas
- Implementacion inicial de logging en:
  - Auth
  - Register
- Configuracion de CORS para habilitar consumo desde frontend en desarrollo.
- Versionado inicial de rutas HTTP bajo prefijo global /api/v1.

### Pendientes
- Implementar modulo completo de Customer:
  - Controller
  - Service
  - Repository
- Completar sistema de logging en:
  - Products
  - Orders
  - Conversations
  - Otros endpoints
