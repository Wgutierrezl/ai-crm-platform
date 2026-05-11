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

### WhatsApp checkout mock (estado actual)
- Checkout mock conversacional implementado desde bot WhatsApp.
- Inicio deterministico por texto (`confirmar compra`, `checkout`, `pagar`, etc.).
- Confirmacion deterministica (`si confirmar` / `sí confirmar`).
- Cancelacion deterministica (`cancelar`) cuando checkout esta activo.
- Simulacion de pago mock con estados:
  - `approved`
  - `rejected`
  - `pending`
  - `error`
- Si `approved`: crea orden + items, registra transaccion mock y cierra carrito.
- Si `rejected|pending|error`: mantiene carrito activo y no confirma orden pagada.
- Persistencia de transacciones mock en `payment_transactions`.

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
6. Probar manualmente checkout mock desde WhatsApp y validar escenarios negativos.
7. Verificar/aplicar migracion `payment_transactions` si no esta aplicada en entorno local.

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
- `1710000000007-EnhanceProductsForConversationalTools`
  - amplía `products` para consultas conversacionales (catálogo, búsqueda, precio, stock).

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

## Actualizacion tecnica (2026-05-08)

### IA multi-provider (estado real)
- Implementado soporte multi-provider en backend.
- Provider principal de pruebas: **Groq**.
- Provider premium/fallback soportado: **OpenAI**.
- Provider local futuro (no activado en esta fase): **Ollama**.
- Contrato `AIService` conservado.
- Salida canonica mantenida: `reply` y `action?`.

### Estado de pruebas
- Pruebas conversacionales activas con Groq.
- OpenAI disponible como fallback por configuracion.
- Ollama se evaluara en una fase posterior local/offline.

### Proximos pasos backend
1. Evolucionar modulo de productos con categorias.
2. Implementar tools de categorias y mejorar tools actuales de productos.
3. Mantener filtro multi-tenant por `companyId` en todas las consultas.
4. Mejorar respuesta de catalogo para WhatsApp (incluyendo evaluacion de listas interactivas).
5. Integrar proveedor externo de imagenes de productos (ej. Cloudinary) via adaptador desacoplado.

### Proximos pasos frontend
1. Ajustar formularios y listados de productos para categoria.
2. Crear/ajustar vistas de administracion de categorias.
3. Preparar UI para imagenes de productos.
4. Sincronizar la UI con los cambios de backend por fases.

### Fase posterior
- Modulo de proveedores (suppliers) con asociacion producto-proveedor y trazabilidad de inventario.

## Actualizacion integral 2026-05-08 (backend + frontend)

### Estado consolidado de la sesion
- Se completo la fase fullstack de **productos + categorias** con sincronizacion backend/frontend.
- La arquitectura hexagonal se mantiene intacta.
- No se altero onboarding ni autenticacion.
- No se altero multi-provider IA (Groq principal, OpenAI fallback, Ollama pendiente).

### Backend implementado en esta sesion
- Soporte completo de categorias de producto y relacion `products.category_id`.
- Endpoint de actualizacion de producto:
  - `PATCH /api/v1/products/:id`
  - validacion por `companyId` del usuario autenticado.
  - validacion de pertenencia tenant para `categoryId`.
  - soporte para quitar categoria con `categoryId: null`.
- Endpoint de estado de categoria:
  - `PATCH /api/v1/categories/:id/status`
  - activacion/desactivacion sin eliminacion.
- Capa application/domain/infrastructure extendida con:
  - `UpdateProductUseCase`
  - `UpdateCategoryStatusUseCase`
  - DTOs de update correspondientes.
- Repositorios actualizados para consultas de catalogo seguro:
  - solo productos activos,
  - solo categorias activas,
  - exclusion de productos asociados a categorias inactivas en consultas conversacionales.

### Bot y tools conversacionales (estado actual)
- El bot ya puede:
  - listar categorias activas,
  - listar productos por categoria,
  - buscar por categoria + texto,
  - filtrar por categoria + precio,
  - responder stock y precio de productos activos.
- Se reforzo regla de seguridad conversacional:
  - no exponer categorias inactivas,
  - no exponer productos inactivos,
  - no exponer productos ligados a categoria inactiva.
- Soporte inicial de listas interactivas WhatsApp:
  - categorias/productos en formato lista,
  - fallback automatico a texto cuando Meta no acepta lista interactiva.

### Frontend implementado en esta sesion
- Vista de categorias operativa:
  - crear categoria,
  - listar categorias,
  - activar/desactivar categoria.
- Vista de productos sincronizada con backend real:
  - creacion con categoria opcional,
  - edicion real por `PATCH /products/:id`,
  - cambio y eliminacion de categoria ("Sin categoria").
- Filtros visuales de productos:
  - categoria,
  - busqueda textual,
  - stock bajo,
  - combinacion de filtros + accion "Limpiar filtros".
- Manejo de categorias inactivas en UI:
  - visibles para gestion en admin,
  - no visibles como filtros activos publicos,
  - indicador visual de categoria inactiva cuando ya esta asociada a un producto.
- Campo visual de imagen preparado:
  - placeholder "proximamente",
  - preview si `imageUrl` ya existe,
  - base lista para integrar Cloudinary.

### Estado actual de arquitectura
- Hexagonal: vigente y respetada.
- IA multi-provider: vigente y estable.
- Backend y frontend: sincronizados en modelo de categorias/productos.
- WhatsApp: flujo conversacional activo con soporte interactivo inicial y fallback robusto.

### Proximos pasos prioritarios (siguiente sesion)
1. UX/UI avanzada de catalogo en WhatsApp.
2. Navegacion conversacional de catalogo (volver/cambiar categoria/ver detalle).
3. Paginacion conversacional y listas interactivas paginadas ("Ver mas").
4. Persistencia temporal de estado de navegacion conversacional.
5. Integracion Cloudinary desacoplada (`infrastructure/external-services/cloudinary`).
6. Enriquecimiento de respuestas WhatsApp con imagen + caption cuando aplique.
7. Estrategia de testing (unit + e2e + integracion) para tools, IA providers, WhatsApp y catalogo.
8. Modulo de proveedores/suppliers y fase posterior de pagos.

### Riesgos / decisiones pendientes documentadas
- Definir limite UX de listas interactivas por sesion y estrategia de paginacion.
- Definir modelo de estado para postbacks/selecciones de WhatsApp a nivel conversacion.
- Definir politica de cache/contexto para catalogo (evitar respuestas obsoletas).
- Definir contratos de prueba automatizada por proveedor externo (IA/WhatsApp/Cloudinary).
- Mantener control de costos/latencia en flujos con alto volumen conversacional.
