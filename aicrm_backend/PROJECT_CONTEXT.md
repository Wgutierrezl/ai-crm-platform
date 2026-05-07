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

## Multi-tenant
- El companyId se incluye en entidades de negocio y persistencia multi-empresa.
- El companyId se extrae automaticamente desde JWT en JwtAuthGuard.
- Controladores usan CurrentUser para evitar recibir companyId manual desde body.

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
  - `company_whatsapp_apps`: identidad de app/numero WhatsApp.
  - `company_whatsapp_credentials`: secretos/tokens de acceso/verificacion.
- Flujo de canal validado:
  - mensaje entrante real -> parseo payload -> resolucion app -> respuesta automatica temporal.

### Respuesta temporal activa
- El backend responde con un mensaje predeterminado de confirmacion para validar el canal outbound.

### No implementado aun
- Persistencia de mensajes WhatsApp en entidades `Conversation/Message`.
- Resolucion y registro de cliente por telefono/wa_id.
- Integracion webhook -> `ProcessIncomingMessageUseCase`.
- Respuesta IA real con tools en el flujo de WhatsApp.
- Idempotencia por `message_id`/`wamid`.
- Firma `X-Hub-Signature-256`.
- Cifrado de secretos en BD.

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
