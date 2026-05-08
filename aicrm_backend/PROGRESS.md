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

## Entrada 2026-05-07

### Fase 1 - Fundacion conversacional (implementado)
- Se creo `HandleInboundChannelMessageUseCase` en `application` como punto unico de orquestacion del flujo entrante por canal.
- El webhook de WhatsApp quedo desacoplado y solo actua como adapter de entrada/salida.
- Se agrego idempotencia por `channel_message_id` en mensajes de canal.

### Fase 2 - Resolucion de identidad (implementado)
- Nueva entidad/tabla `external_identities` para mapear `company + channel + external_user_id` -> `customer`.
- Resolucion de cliente por identidad externa y fallback por telefono.
- Se agrega `company_id` en `company_whatsapp_apps` para mapear tenant real.

### Fase 3 - Onboarding conversacional (implementado)
- Nueva entidad/tabla `conversation_states` con `registration_step`.
- Flujo:
  - cliente desconocido => estado `awaiting_name`
  - captura nombre valida => update customer + estado `completed`
  - saludo personalizado post-registro.

### Fase 4 - Persistencia real de conversaciones/mensajes (implementado)
- `messages` ahora persiste:
  - `source_channel`
  - `channel_message_id`
  - `metadata_json`
- Se persiste inbound WhatsApp y outbound bot dentro de la conversacion.

### Fase 5 - Integracion con ProcessIncomingMessageUseCase (implementado)
- Orquestador de canal invoca `ProcessIncomingMessageUseCase` cuando onboarding esta completo.
- Se agregaron opciones de ejecucion:
  - `persistCustomerMessage?: boolean`
  - `outputChannel?: 'api' | 'whatsapp'`
  - `botReplyPrefix?: string`

### Fase 6 - Base desacoplada para future tools engine (implementado base)
- Se extrajo ejecucion de tools a `ToolExecutionService` (`application/services`).
- `ProcessIncomingMessageUseCase` ya no hardcodea toda la logica de herramientas.

### Migracion agregada
- `1710000000003-AddConversationalFoundation`:
  - `company_whatsapp_apps.company_id`
  - `external_identities`
  - `conversation_states`
  - columnas nuevas en `messages` para idempotencia y metadata.

### Verificacion tecnica
- Compilacion TypeScript validada con:
  - `npx tsc -p tsconfig.json --noEmit`

## Entrada 2026-05-07 (correccion warning companyId WhatsApp)

### Problema detectado
- Warning en webhook:
  - `Configuracion incompleta: app WhatsApp id=... sin companyId...`
- Causa raiz:
  - migracion `1710000000003` agrego `company_id` nullable en `company_whatsapp_apps`,
  - registros existentes quedaron en `NULL` (legacy).

### Correcciones implementadas
- Validacion fuerte en registro de app WhatsApp:
  - DTO exige `companyId` valido (`IsUUID` + `IsNotEmpty`).
- Validacion de integridad en use case:
  - `UpsertCompanyWhatsappAppUseCase` valida que la empresa exista.
- Migracion correctiva:
  - `1710000000004-BackfillWhatsappAppsCompanyId`,
  - backfill automatico solo cuando hay un unico tenant (escenario seguro).
- Mensaje de warning actualizado para dejar claro que es configuracion interna y no del usuario final.

### Impacto funcional
- El usuario final de WhatsApp no requiere credenciales Meta.
- Se mantiene el flujo correcto:
  - `phone_number_id` -> `company_whatsapp_apps` -> `companyId` -> credenciales Meta -> cliente externo (`wa_id`/telefono).

### Accion operativa recomendada para entornos con multiples tenants
- Ejecutar SQL manual para apps legacy sin `company_id`:
  - `UPDATE company_whatsapp_apps SET company_id = '<COMPANY_ID>' WHERE id = <APP_ID>;`

## Entrada 2026-05-07 (mejora onboarding conversacional)

### Objetivo
- Transformar onboarding básico en flujo conversacional natural, progresivo y más humano.

### Implementado
- Nuevas tools de onboarding en capa `application`:
  - `ASSISTANT_RESOLVE_USER_IDENTITY`
  - `ASSISTANT_START_ONBOARDING`
  - `ASSISTANT_COLLECT_PROFILE_DATA`
  - `ASSISTANT_REGISTER_USER`
  - `ASSISTANT_GET_USER_PROFILE`
  - `ASSISTANT_UPDATE_USER_PROFILE`
- Nuevo extractor de perfil:
  - `OnboardingProfileExtractorService`
  - extrae múltiples datos en un mismo mensaje.
- Rework de `HandleInboundChannelMessageUseCase`:
  - onboarding conversacional paso a paso,
  - mensajes más amigables,
  - personalización por nombre/perfil.
- Prompts runtime mejorados:
  - reglas explícitas de tono humano,
  - emojis moderados,
  - mensajes cortos,
  - no repetir preguntas.

### Customer ampliado para CRM/IA
- Nuevos campos de perfil y onboarding:
  - `firstName`, `lastName`, `fullName`, `address`, `city`, `age`,
  - `metadata_json`,
  - `onboardingCompleted`, `onboardingStep`, `profileCompletionPercentage`.

### Migración agregada
- `1710000000005-EnhanceCustomerConversationalProfile`.

### Verificación
- `npx tsc -p tsconfig.json --noEmit` en verde.

## Entrada 2026-05-07 (cascade delete para customers de prueba)

### Problema
- MySQL bloqueaba `DELETE FROM customers ...` con error 1451 por FKs en `conversations`.

### Solucion implementada
- Migracion: `1710000000006-AddCustomerCascadeDeleteRelations`.
- FKs actualizadas con `ON DELETE CASCADE` (+ `ON UPDATE CASCADE`) en cadena:
  - `FK_conversations_customer`
  - `FK_messages_conversation`
  - `FK_conversation_states_conversation`
  - `FK_external_identities_customer`
  - `FK_orders_customer`
  - `FK_order_items_order`

### Resultado esperado
- Al eliminar un customer de prueba, se limpian automaticamente:
  - conversaciones,
  - mensajes,
  - estados conversacionales,
  - identidades externas,
  - ordenes y order_items.

## Entrada 2026-05-07 (fix de flujo: resolver identidad antes de onboarding)

### Problema corregido
- El flujo podía iniciar extracción/onboarding sin respetar claramente el estado de usuario existente.

### Ajustes aplicados
- `HandleInboundChannelMessageUseCase` ahora sigue secuencia estricta:
  1. resolver identidad,
  2. evaluar estado,
  3. onboarding o IA según estado.
- Si `registered`:
  - no reinicia onboarding,
  - saluda con nombre desde BD,
  - reutiliza conversación/contexto.
- Si incompleto:
  - continúa desde `onboardingStep`,
  - no repite campos ya completados.
- Extractor actualizado para no tomar saludos como nombre.
- OpenAI recibe contexto estructurado (`customer_exists`, `onboarding_*`, `missing_fields`, etc.).

## Entrada 2026-05-07 (documentacion tecnica de sesion)

### Componentes nuevos/actualizados (estado funcional)
- Onboarding conversacional progresivo via WhatsApp.
- Resolucion de identidad externa antes de onboarding.
- Persistencia de estado conversacional y perfil extendido de customer.
- Prompt runtime por capas con reglas de tono y control de onboarding.
- Tools conversacionales `ASSISTANT_*` para lifecycle de onboarding.

### Lo que ya funciona
- Resolver/reusar identidad (`wa_id`, telefono, external identity).
- Reusar customer y conversacion existente.
- Separar flujo usuario registrado vs nuevo/incompleto.
- Inyectar contexto onboarding a OpenAI.

### Lo que sigue inestable
- Repeticion de la misma pregunta de onboarding (ej. cédula).
- `onboardingStep` y `missing_fields` pueden desalinearse en algunos turnos.
- Respuestas IA ocasionalmente construidas con contexto no totalmente actualizado.

### Causas probables documentadas
1. Persistencia no atomica entre perfil customer y conversation state.
2. Context builder potencialmente usando snapshot previo al update.
3. Recalculo de `missing_fields` sin tabla de transicion deterministica.
4. Extraccion parcial sin guardas de repeticion por campo.
5. Historial conversacional sin marcadores de ultimo campo solicitado/respondido.

### Siguiente sesion - prioridad
1. Corregir repeticion onboardingStep.
2. Sincronizar estado backend <-> contexto OpenAI por turno.
3. Refinar context builder post-update.
4. Validar persistencia onboarding con transaccion.
5. Endurecer validaciones de extraccion y transiciones.
6. Mejorar machine state conversacional.
7. Refinar flujo de tools y coherencia IA post-onboarding.

## Entrada 2026-05-07 (fix definitivo repeticion de cedula)

### Bug corregido
- El bot repetia la pregunta de cédula aun despues de recibirla.

### Causa raiz
- Flujo de transicion de onboarding no deterministico.
- Paso y missing fields se recalculaban de forma ambigua.
- Validacion de cédula no diferenciaba bien "invalida" vs "omitir".

### Solucion implementada
- Maquina de estados en backend:
  - `WAITING_NAME`
  - `WAITING_EMAIL`
  - `WAITING_DOCUMENT`
  - `COMPLETED`
- `ASSISTANT_COLLECT_PROFILE_DATA` ahora:
  - valida por paso actual,
  - persiste customer y state,
  - calcula siguiente paso de forma deterministica.
- Cédula opcional:
  - soporta `omitir`, `saltar`, `prefiero no`, `después`, `no`.
  - al omitir, marca onboarding como `COMPLETED`.
- Saludos como `hola` ya no se guardan como nombre.

### Resultado esperado
- No se repite cédula tras respuesta válida.
- No se reinicia onboarding para usuario registrado.
- Usuario registrado recibe saludo con nombre desde BD.

## Entrada 2026-05-07 (tools conversacionales de productos)

### Analisis de viabilidad
- Viable sin romper arquitectura hexagonal:
  - webhook sigue como canal,
  - orquestacion en `application`,
  - consultas DB por `ProductRepository`.

### Implementado
- Extension del modelo `Product` (dominio + ORM).
- Nuevos metodos de `ProductRepository` para:
  - catalogo activo,
  - busqueda por texto,
  - busqueda por nombre aproximado,
  - filtro por precio.
- Tools de productos en `ToolExecutionService`:
  - `CRM_GET_PRODUCTS`
  - `CRM_SEARCH_PRODUCTS`
  - `CRM_GET_PRODUCT_BY_NAME`
  - `CRM_FILTER_PRODUCTS_BY_PRICE`
  - `CRM_GET_PRODUCT_STOCK`
- Regla multi-tenant:
  - todas las tools filtran por `companyId` del contexto.
- Ordenes por chat:
  - deshabilitadas por ahora (mensaje de fase futura).

### Migracion agregada
- `1710000000007-EnhanceProductsForConversationalTools`
  - agrega campos de catalogo conversacional en `products`.

### Prompting
- Prompt runtime actualizado para intención de productos y uso obligatorio de tools.
- Se agregó `prompts/partials/tools/products-tools.md`.

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

## Entrada 2026-05-07 (decision arquitectura IA multi-provider)

### Incidente observado
- Durante pruebas de flujo conversacional se detecto:
  - `RateLimitError: 429 You exceeded your current quota`.

### Conclusiones
- La falla no estuvo en:
  - arquitectura hexagonal,
  - flujo de onboarding,
  - webhook de WhatsApp,
  - tools de productos.
- La causa fue limite de cuota de OpenAI API en `platform.openai.com`.
- ChatGPT Plus no cubre consumo de API backend.

### Decision tomada
- Evolucionar a arquitectura IA multi-provider (documentada en contexto).
- Objetivos:
  - fallback entre proveedores,
  - optimizacion de costo,
  - menor dependencia de vendor unico,
  - mayor continuidad operativa.

### Providers considerados
- OpenAI
- Groq
- OpenRouter
- Anthropic
- Gemini
- Providers locales futuros (opcional)

### Estado de tools de productos
- Las tools de productos quedaron implementadas a nivel backend.
- Pruebas conversacionales end-to-end con IA quedaron parcialmente bloqueadas por cuota OpenAI API.

### Proximos pasos recomendados (sin implementar aun)
1. Definir `ai-provider.port.ts` en `domain/ports`.
2. Crear adapters por proveedor en `infrastructure/ai/providers`.
3. Implementar `AIProviderResolver` para seleccion por entorno/tenant/canal.
4. Implementar fallback policy (primary -> secondary).
5. Reanudar pruebas E2E de tools de productos una vez resuelta cuota API.

## Cierre de sesion 2026-05-07 (siguientes pasos)

### Lo que quedo funcionando
- Onboarding conversacional por WhatsApp con control de estado.
- Resolucion de identidad y reutilizacion de customer existente.
- Flujo para evitar reinicio de onboarding cuando el usuario ya esta registrado.
- Base de tools de productos en backend.
- Documentacion de roadmap multi-provider IA.

### Pendientes prioritarios backend
1. Implementar arquitectura IA multi-provider:
   - puerto/adaptadores por proveedor,
   - seleccion por `.env`,
   - fallback entre proveedores.
2. Reanudar pruebas E2E de tools de productos:
   - catalogo general,
   - busqueda por nombre,
   - busqueda por palabra clave/categoria,
   - filtro por precio,
   - stock,
   - validacion de aislamiento por `companyId`.
3. Implementar fallback conversacional cuando falle IA:
   - cuota excedida,
   - timeout,
   - proveedor caido,
   - error de modelo.

### Incidente operativo registrado
- `RateLimitError: 429 insufficient_quota` en OpenAI API.
- Confirmado: ChatGPT Plus no cubre creditos de backend API.
- Impacto: bloqueo parcial de pruebas conversacionales completas.

## Entrada 2026-05-08 (multi-provider IA implementado)

### Implementado
- Se implemento arquitectura multi-provider de IA en `infrastructure/ai` manteniendo arquitectura hexagonal.
- Se mantuvo el contrato `AIService` para evitar ruptura en `application`.
- Se integro **Groq** como provider principal de pruebas conversacionales.
- Se mantuvo **OpenAI** como provider soportado/premium/fallback configurable.
- Se dejo **Ollama** implementado como opcion local futura (no activado en esta fase).
- Se incorporo seleccion por configuracion (`primary`, `fallback`, `timeout`, `retries`, `json_strict`).
- Se incorporo fallback tecnico controlado y normalizacion minima de respuesta JSON (`reply`, `action?`).

### Estado actual de pruebas
- Pruebas activas con Groq en curso.
- OpenAI disponible como fallback/alternativa segun entorno.
- Ollama pendiente para fase posterior local/offline.

### Pendientes backend prioritarios (nueva fase)
1. Evolucion de productos con categorias.
2. Evaluar y crear migracion para entidad/tabla de categorias.
3. Implementar tools de categorias.
4. Mejorar tools de productos con:
   - busqueda/listado por categoria,
   - destacados por categoria,
   - stock por categoria,
   - filtros combinados (precio/categoria/nombre).
5. Mantener aislamiento multi-tenant por `companyId` en todas las consultas.

### Pendiente UX WhatsApp
- Mejorar visualizacion de productos y categorias en respuestas del bot.
- Evaluar listas interactivas de WhatsApp para catalogo.
- Mantener copy corto y claro adaptado al canal.

### Pendiente integracion imagenes
- Integrar proveedor externo (ej. Cloudinary) para imagenes de productos.
- Subida y asociacion por URL segura.
- Mantener adaptador desacoplado para evitar dependencia de vendor unico.

### Pendientes frontend sincronizados
1. Ajustar formularios y vistas de productos para categoria.
2. Crear/ajustar vistas para administracion de categorias.
3. Preparar UI para soporte de imagenes de productos.
4. Sincronizar cambios backend/frontend por fases.

### Fase posterior documentada
- Modulo de proveedores (suppliers) con CRUD y asociacion producto-proveedor.
- Evaluar migracion futura para tabla de proveedores y relacion con productos.
- Mantener enfoque multi-tenant por `companyId`.

## Entrada 2026-05-08 (fullstack categorias + update + estado activo)

### Backend implementado
- Endpoint de actualizacion de producto habilitado:
  - `PATCH /api/v1/products/:id`
  - validacion tenant por `companyId` del JWT.
  - soporte update de:
    - `name`, `description`, `price`, `stock`, `sku`, `brand`, `currency`, `minStock`, `isActive`, `categoryId`, `imageUrl`.
  - soporte para quitar categoria con `categoryId: null`.
- Endpoint de activacion/desactivacion de categoria:
  - `PATCH /api/v1/categories/:id/status`
  - sin eliminacion fisica.
- Repositorios/Tools ajustados para catalogo publico conversacional:
  - categorias activas unicamente,
  - productos activos unicamente,
  - exclusion de productos en categorias inactivas,
  - mantenimiento de aislamiento por `companyId`.
- WhatsApp interactive lists (base):
  - envio de listas para categorias/productos,
  - fallback automatico a texto si falla payload interactivo.

### Frontend implementado
- Vista de categorias con operaciones:
  - crear,
  - listar,
  - activar/desactivar.
- Vista de productos actualizada:
  - edicion real por API (`PATCH /products/:id`),
  - cambio/quitar categoria,
  - estado activo/inactivo,
  - filtro visual por categoria,
  - combinacion de filtros (categoria + busqueda + stock),
  - etiqueta para categorias inactivas asociadas.
- Campo visual de imagen preparado para Cloudinary (sin carga real aun).

### Estado funcional del bot
- Ya lista categorias activas.
- Ya lista productos activos por categoria.
- Ya evita categorias inactivas en tools publicas.
- Ya evita productos de categorias inactivas en respuestas de catalogo.
- Ya responde con fallback conversacional seguro cuando lista interactiva no aplica.

### Verificacion tecnica
- Backend: `npx tsc -p tsconfig.json --noEmit` en verde.
- Frontend:
  - `npm.cmd run lint` en verde.
  - `./node_modules/.bin/tsc.cmd -b` en verde.
  - build Vite puede fallar por `spawn EPERM` del entorno (limitacion externa al codigo).

### Siguiente fase prioritaria
1. UX/UI avanzada de catalogo en WhatsApp (listas paginadas + detalle de producto).
2. Integracion Cloudinary desacoplada.
3. Imagenes en respuestas del bot cuando el canal lo permita.
4. Paginacion conversacional y navegacion (volver/cambiar categoria/ver mas).
5. Plan de pruebas unitarias y E2E integral.
6. Modulo suppliers/proveedores.
7. Integracion futura de pagos.
