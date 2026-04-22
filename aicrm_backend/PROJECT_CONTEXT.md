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
