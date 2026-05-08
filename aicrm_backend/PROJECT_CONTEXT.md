# PROJECT CONTEXT - AI CRM Backend

## Descripcion del proyecto
Backend de CRM multi-tenant orientado a ventas, con IA conversacional para asistir a clientes y automatizar acciones de negocio como consulta de productos, creacion de clientes y creacion de pedidos.

## Objetivo del sistema
- Centralizar operaciones comerciales por empresa (tenant).
- Gestionar usuarios internos (User) y clientes externos (Customer) de forma separada.
- Permitir conversaciones asistidas por IA para mejorar conversion comercial.
- Ejecutar acciones reales en base de datos a partir de intenciones detectadas por IA.

## Arquitectura
Se implementa arquitectura hexagonal estricta (Ports and Adapters):

- domain/
  - entities/: modelos de dominio puros, sin dependencia de framework.
  - ports/: contratos abstractos de repositorios y servicios externos.

- application/
  - use-cases/: orquestacion de reglas de negocio y flujo de la aplicacion.

- infrastructure/
  - database/: entidades ORM y migraciones TypeORM (MySQL).
  - repositories/: adaptadores concretos TypeORM que implementan puertos.
  - ai/: adaptador OpenAI que implementa AIService.
  - external-services/: reservado para futuras integraciones.

- interfaces/
  - http/controllers/: endpoints REST.
  - http/dtos/: validacion de entrada con class-validator.
  - http/guards/: JWT guard y decorador de usuario actual.

## Tecnologias
- NestJS 11
- TypeORM 0.3
- MySQL
- JWT + bcrypt
- OpenAI API
- class-validator / class-transformer

## Limitacion actual de IA (operativa)
- Durante pruebas reales se presento `RateLimitError 429` por cuota de OpenAI API.
- Aclaracion importante:
  - ChatGPT Plus NO incluye creditos para uso de OpenAI API en backend.
  - El backend consume desde `platform.openai.com` y depende de la cuota/billing de API.
- Conclusión:
  - la incidencia no se originó en arquitectura, onboarding, WhatsApp ni tools,
  - fue una limitación de cuota del proveedor OpenAI API.

## Multi-tenant
- El companyId se incluye en entidades de negocio y persistencia multi-empresa.
- El companyId se extrae automaticamente desde JWT en JwtAuthGuard.
- Controladores usan CurrentUser para evitar recibir companyId manual desde body.
- En WhatsApp, conviven dos objetivos:
  - operacion global temporal (iteracion rapida del onboarding),
  - preparacion para tenant-routing estricto futuro.
- Esta dualidad requiere alineacion final en proxima fase para evitar divergencias entre entornos.

## Modulos principales
- Autenticacion: register/login con hash de password y JWT.
- Catalogo: creacion y consulta de productos por empresa.
- Conversaciones: creacion y listado de conversaciones.
- Mensajeria: mensajes manuales y mensajes entrantes procesados por IA.
- Ordenes: creacion/listado de pedidos y items.
- IA: analisis conversacional y ejecucion de tools.
- WhatsApp (Meta Cloud API):
  - verificacion webhook,
  - recepcion de eventos,
  - resolucion de app por `phone_number_id`,
  - envio de mensajes salientes.

## Flujo IA + Tools
Flujo completo:

1. Llega mensaje del cliente al endpoint de mensajes entrantes.
2. Use case ProcessIncomingMessage guarda el mensaje en DB.
3. Recupera historial de conversacion.
4. Llama a AIService.processMessage(input).
5. OpenAIService construye prompt del agente y obtiene JSON estructurado.
6. Si llega action, backend ejecuta tool:
   - GET_PRODUCTS
   - CREATE_CUSTOMER
   - CREATE_ORDER
7. Backend compone respuesta final del bot.
8. Guarda respuesta del bot en DB.
9. Devuelve resultado al cliente/API consumer.

### Tools de productos (fase actual)
- `CRM_GET_PRODUCTS`
- `CRM_SEARCH_PRODUCTS`
- `CRM_GET_PRODUCT_BY_NAME`
- `CRM_FILTER_PRODUCTS_BY_PRICE`
- `CRM_GET_PRODUCT_STOCK`

Regla:
- Todas las consultas de productos filtran por `companyId` resuelto desde el flujo de canal.
- No se habilita creacion de ordenes desde chat en esta fase.

## Onboarding conversacional (nuevo)

El onboarding ahora es progresivo y humano:
- solicita un dato por turno,
- reutiliza datos detectados para no repreguntar,
- acepta multiples datos en un solo mensaje,
- mantiene tono cercano para WhatsApp.

Tools internas de onboarding en `application/services/assistant-onboarding-tools.service.ts`:
- `ASSISTANT_RESOLVE_USER_IDENTITY`
- `ASSISTANT_START_ONBOARDING`
- `ASSISTANT_COLLECT_PROFILE_DATA`
- `ASSISTANT_REGISTER_USER`
- `ASSISTANT_GET_USER_PROFILE`
- `ASSISTANT_UPDATE_USER_PROFILE`

Regla de lifecycle:
- La resolucion de identidad es obligatoria antes de onboarding o IA.
- El modelo no decide si el usuario existe; ese estado lo decide backend/application.
- Si `registered`, no se reinicia onboarding.
- Si perfil incompleto, se retoma desde `onboardingStep` actual.

Estado real de estabilidad:
- Funciona: resolucion de identidad y bifurcacion base por estado.
- Corregido en onboarding base: transicion deterministica de pasos (`WAITING_NAME -> WAITING_EMAIL -> WAITING_DOCUMENT -> COMPLETED`).
- Riesgo remanente: falta transaccion atomica para endurecer consistencia al 100%.

Extraccion progresiva:
- Servicio: `OnboardingProfileExtractorService`.
- Detecta: nombre, apellido, email, cédula, ciudad, direccion, edad.
- Permite extraer varios campos en el mismo mensaje.

## Perfil Customer (extendido)
- Se amplía el perfil para personalizacion CRM/IA:
  - `firstName`, `lastName`, `fullName`,
  - `address`, `city`, `age`,
  - `metadata_json`,
  - `onboardingCompleted`,
  - `onboardingStep`,
  - `profileCompletionPercentage`.

## Producto (extendido)
- Se amplió `products` para consultas conversacionales:
  - `description`, `isActive`, `sku`, `brand`,
  - `features_json`, `tags_json`, `imageUrl`,
  - `currency`, `minStock`, `metadata_json`,
  - `createdAt`, `updatedAt`.

## Politica de borrado para testing
- Se habilitó cascade delete orientado a pruebas de onboarding por WhatsApp:
  - `customers -> conversations` (`ON DELETE CASCADE`)
  - `conversations -> messages` (`ON DELETE CASCADE`)
  - `conversations -> conversation_states` (`ON DELETE CASCADE`)
  - `customers -> external_identities` (`ON DELETE CASCADE`)
  - `customers -> orders` (`ON DELETE CASCADE`)
  - `orders -> order_items` (`ON DELETE CASCADE`)
- Objetivo: permitir recrear clientes de prueba desde cero sin basura referencial.

## Ejemplo detallado con CREATE_ORDER
Caso de uso real:

1. Cliente escribe: "Quiero 2 unidades del producto X".
2. ProcessIncomingMessage guarda ese mensaje.
3. AIService responde JSON:
   {
     "reply": "Perfecto, estoy creando tu pedido.",
     "action": {
       "type": "CREATE_ORDER",
       "payload": {
         "customerId": "cust-123",
         "items": [
           { "productId": "prod-001", "quantity": 2, "price": 50000 }
         ]
       }
     }
   }
4. ProcessIncomingMessage ejecuta la tool CREATE_ORDER:
   - Calcula total = 2 * 50000 = 100000.
   - Crea Order con estado pending.
   - Crea OrderItem asociado al pedido.
5. Construye respuesta final del bot con confirmacion de pedido.
6. Guarda respuesta bot como Message.
7. Retorna customerMessage + botMessage + actionExecuted=CREATE_ORDER.

Resultado: Order y OrderItem creados correctamente en MySQL dentro del tenant de la empresa.

## Estado actual WhatsApp (Meta)

### Implementado
- Endpoints:
  - `GET /api/v1/webhooks/whatsapp`
  - `POST /api/v1/webhooks/whatsapp`
- Endpoint interno protegido:
  - `POST /api/v1/company-whatsapp-apps`
  - `POST /api/v1/company-whatsapp-credentials`
- Variables de entorno:
  - `INTERNAL_API_KEY`
  - `META_GRAPH_API_VERSION`
  - `META_VERIFY_TOKEN` (fallback local opcional)
  - `WHATSAPP_WEBHOOK_VALIDATE_SIGNATURE`
  - `META_APP_SECRET`
- Modelo desacoplado:
  - `company_whatsapp_apps`: identidad de app/numero WhatsApp + ownership por tenant via `company_id`.
  - `company_whatsapp_credentials`: secretos/tokens de acceso/verificacion.
- Flujo de canal productivo:
  - mensaje entrante real -> parseo payload -> resolucion app/tenant ->
    orquestacion conversacional (`HandleInboundChannelMessageUseCase`) ->
    persistencia de identidad/conversacion/mensajes ->
    onboarding o IA -> respuesta outbound.

### Flujo activo implementado
- Idempotencia inbound por `channel_message_id`.
- Resolucion/creacion de `Customer` por `wa_id` y telefono.
- Reutilizacion/creacion de `Conversation`.
- Persistencia completa de inbound/outbound en `messages`.
- Onboarding conversacional de nombre para cliente desconocido.
- Saludo personalizado para cliente resuelto.
- Delegacion a IA + tools via `ProcessIncomingMessageUseCase`.
- Requisito de configuracion:
  - `company_whatsapp_apps.company_id` es obligatorio para resolver tenant.
  - si falta, el webhook reporta warning de configuracion interna y omite procesamiento del mensaje.

Nota de producto actual:
- En esta etapa se prioriza canal/bot global temporal para acelerar validacion UX.
- Se mantiene preparado el camino para multi-tenant estricto por app en fases siguientes.

### Aclaracion de modelo de identidad
- El cliente externo que escribe por WhatsApp NO tiene ni necesita credenciales Meta.
- Las credenciales Meta pertenecen al tenant/empresa (`company_whatsapp_credentials`).
- El tenant se resuelve por `phone_number_id` usando `company_whatsapp_apps`.

### No implementado aun
- Firma `X-Hub-Signature-256`.
- Cifrado de secretos en BD.
- Motor dinamico de tools por tenant con registry persistido.
- Resolucion de prompts por capas en runtime (base/canal/asistente/tenant).

## Vision de evolucion del producto

El proyecto puede evolucionar de "CRM con bot" a "plataforma modular de asistente IA", donde WhatsApp es el canal principal y el CRM un modulo de negocio desacoplado.

### Direccion recomendada
- Mantener arquitectura hexagonal.
- Tratar cada integracion externa como adaptador independiente.
- Definir puertos por dominio de integracion.
- Mantener casos de uso orquestadores en `application`.
- Evitar acoplar:
  - logica CRM dentro del modulo WhatsApp.
  - logica Google dentro del modulo CRM.

### Direccion IA (multi-provider)
- Se define como decision arquitectonica soportar multiples proveedores de IA para:
  - reducir dependencia de un unico vendor,
  - optimizar costo/latencia,
  - habilitar fallback,
  - mejorar continuidad operativa en desarrollo y produccion.

Providers objetivo:
- OpenAI (premium/produccion futura)
- Groq (rapidez/costo para desarrollo y canal conversacional)
- OpenRouter
- Anthropic
- Gemini
- Providers locales futuros (opcional)

Arquitectura propuesta (documentada, no implementada aun):
- `domain/ports/ai-provider.port.ts`
- `infrastructure/ai/providers/`
  - `openai/`
  - `groq/`
  - `openrouter/`
  - `anthropic/`
  - `gemini/`
- Componentes de orquestacion candidatos:
  - `AIProviderFactory`
  - `AIProviderResolver`
  - `AIOrchestrator`

Estado:
- Actualmente el proyecto usa OpenAI como provider activo.
- La base de prompts/tools ya está encaminada para evolucionar a multi-provider.

### Proximos pasos backend (prioridad)
1. Implementar capa multi-provider (OpenAI, Groq, OpenRouter, Ollama, Gemini, Anthropic).
2. Habilitar seleccion de proveedor por configuracion y fallback automatico.
3. Implementar respuesta segura de continuidad cuando IA falle.
4. Completar pruebas conversacionales de tools de productos cuando exista cuota/provider disponible.

### Tools de productos - estado de validacion
- Implementacion base disponible.
- Validacion integral pendiente por limite de cuota OpenAI API.
- Requisito funcional: todas las consultas deben filtrar por `companyId` resuelto desde canal/app.

### Modulos futuros sugeridos
- WhatsApp:
  - webhooks, envio, plantillas, estado conversacional.
- CRM:
  - productos, clientes, pedidos, conversaciones.
- Google:
  - Gmail, Drive, Contacts, Calendar (opcional).
- IA:
  - orquestacion de tools, prompt/contexto, memoria, seleccion de herramientas.
- Integraciones:
  - OAuth, token management, adaptadores desacoplados.

### Tools desacopladas sugeridas
- `CRM_GET_PRODUCTS`
- `CRM_CREATE_ORDER`
- `CRM_CREATE_CUSTOMER`
- `GOOGLE_GMAIL_SEARCH`
- `GOOGLE_DRIVE_UPLOAD`
- `GOOGLE_CONTACTS_SEARCH`
- `ASSISTANT_HELP_MENU`

## Roadmap recomendado

### Siguiente fase
1. Persistir mensajes WhatsApp en DB.
2. Resolver cliente por telefono/wa_id.
3. Implementar registro conversacional para cliente desconocido.
4. Crear/reusar Conversation.
5. Conectar webhook con `ProcessIncomingMessageUseCase`.
6. Responder por WhatsApp con salida IA real.

### Fase posterior
1. Integrar Gmail.
2. Integrar Google Drive.
3. Integrar Google Contacts.
4. Implementar OAuth por tenant/usuario.
5. Crear sistema dinamico de tools activables por tenant/app.
6. Crear panel de configuracion de integraciones.

## Actualizacion 2026-05-08 - Multi-provider IA implementado

### Estado confirmado
- La arquitectura multi-provider de IA ya se implemento en backend.
- `AIService` se mantiene como contrato estable en dominio.
- La orquestacion de providers se realiza en infraestructura sin romper capas superiores.
- Provider principal de pruebas actuales: **Groq**.
- Provider premium/fallback soportado: **OpenAI**.
- Provider local futuro aun no activado en esta fase: **Ollama**.

### Objetivo de la mejora
- Evitar bloqueo por cuota de OpenAI API.
- Mantener continuidad de pruebas conversacionales (WhatsApp + onboarding + tools CRM).
- Reducir dependencia de un unico proveedor sin romper arquitectura hexagonal.

### Estado de pruebas IA
- Fase actual: pruebas activas con Groq.
- OpenAI: disponible como fallback o provider premium segun configuracion.
- Ollama: no se configura ni prueba en esta etapa; queda para fase posterior local/offline.

### Alcance de integracion
- No se modifico la logica de onboarding conversacional.
- No se altero el flujo principal de WhatsApp.
- No se cambio la regla de tools por `companyId`.
- Se mantuvo salida canonica de IA (`reply`, `action?`).

## Prioridades backend siguientes (actualizadas)

1. Mejorar tools de productos.
2. Evaluar y preparar migracion para categorias de productos.
3. Agregar entidad/tabla de categorias y asociacion de productos para evitar catalogo sin clasificacion.
4. Implementar tools de categorias.
5. Extender tools de productos para:
   - busqueda por categoria,
   - listado por categoria,
   - productos destacados por categoria,
   - stock por categoria,
   - filtros combinados por precio/categoria/nombre.
6. Mantener todas las consultas filtradas por `companyId`.

## Pendiente UX WhatsApp (catalogo)

- Mejorar formato de respuesta de productos para WhatsApp.
- Evaluar listas interactivas para catalogo y categorias.
- Entregar respuestas mas ordenadas/usables para usuarios finales.
- Mantener mensajes cortos, claros y adaptados al canal.

## Pendiente integracion de imagenes

- Integrar proveedor externo de imagenes de productos (ej. Cloudinary).
- Permitir subida de fotos y asociacion via URL segura.
- Mantener desacople de almacenamiento como adaptador en `infrastructure/external-services` (o modulo equivalente).
- Preservar capacidad de cambio de proveedor en el futuro.

## Pendientes frontend sincronizados

1. Ajustar formularios de productos para incluir categoria.
2. Ajustar vistas/listados para mostrar categoria.
3. Crear o ajustar vistas de administracion de categorias.
4. Preparar UI para imagenes de productos.
5. Sincronizar UI incrementalmente con cambios backend.

## Fase posterior: modulo proveedores

- Implementar modulo de proveedores (suppliers).
- Crear/editar/listar/consultar proveedores desde frontend.
- Asociar producto -> proveedor para trazabilidad de inventario.
- Evaluar migracion futura de tabla de proveedores y relacion producto-proveedor.
- Mantener soporte multi-tenant por `companyId`.
