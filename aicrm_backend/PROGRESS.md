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
