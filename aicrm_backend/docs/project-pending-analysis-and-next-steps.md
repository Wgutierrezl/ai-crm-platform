# Project Pending Analysis And Next Steps

Fecha: 2026-05-14
Alcance: analisis documental + contraste rapido con estructura real de backend/frontend (sin cambios de logica de negocio).

## 1. Resumen ejecutivo del estado actual
- El proyecto ya tiene una base funcional fuerte en backend hexagonal: auth JWT, catalogo (productos/categorias), conversaciones/mensajes, WhatsApp inbound/outbound, onboarding manual + Google OAuth (users y customers), carrito persistente, checkout mock, correo SMTP HTML y PDF adjunto.
- Frontend tiene rutas principales implementadas y consume APIs en varios modulos, pero mantiene zonas con fallback/mock y brechas UX/UI visibles (login, ordenes, formato monetario y experiencia conversacional en pantallas).
- No existe Dockerizacion operativa (sin `Dockerfile` y sin `docker-compose.yml` en la raiz).
- La documentacion esta bastante completa, pero hay contenido legacy/desactualizado y contradicciones menores entre docs antiguas y estado actual consolidado.

## 2. Mapa de funcionalidades implementadas
- Backend core:
  - Auth: login/register JWT + Google OAuth users (`start`, `callback`, `exchange`, `complete-registration`).
  - CRM: customers, conversations, messages, products, categories, orders.
  - WhatsApp: webhook verify/inbound + envio outbound + routing por `phone_number_id`.
  - Onboarding: manual progresivo + OAuth Google para customers.
  - Catalogo conversacional: categorias/productos activos + list replies + fallback texto.
  - Carrito: sesiones/items persistentes, expiracion, update/remove/clear.
  - Checkout mock: confirmacion conversacional, creacion real de `orders`, `order_items`, `payment_transactions`, idempotencia reforzada.
  - SMTP: bienvenida y confirmacion de compra HTML.
  - PDF: recibo adjunto en compra mock aprobada.
  - AI: arquitectura multi-provider activa (Groq/OpenAI, Ollama preparado).
- Frontend:
  - Ruteo publico/protegido y persistencia de sesion.
  - Pantallas principales (login, register, dashboard, products, customers, conversations, orders, order detail, settings).
  - Integracion API en auth/products/categories/orders/conversations (parcial en calidad de UX y datos presentados).

## 3. Pendientes funcionales
- Checkout/pagos:
  - Pago real aun no implementado (solo mock).
  - Falta definir estrategia de sandbox real (Stripe/MercadoPago/PayU/Wompi) o simulador propio mas auditable.
- Orders para empresa:
  - Existe endpoint/listado, pero UX y completitud funcional en frontend aun no es robusta para operacion diaria.
- WhatsApp UX conversacional:
  - Mejorar legibilidad de mensajes y flujo de acciones contextuales.
  - Navegacion/paginacion conversacional mas consistente.
- Facturacion/comprobantes:
  - PDF actual es funcional pero visualmente basico.
  - No hay facturacion legal/electronica (esperado, no bug).

## 4. Pendientes técnicos
- Dockerizacion completa backend + frontend + `docker-compose.yml` raiz.
- Definir `.dockerignore` por proyecto y actualizar `.env.example` para entorno contenedorizado.
- Endurecimiento de seguridad:
  - firma `X-Hub-Signature-256` de WhatsApp pendiente.
  - cifrado de secretos Meta en BD pendiente.
- Hardening de integridad de datos:
  - politica FK para limpieza dev/test vs trazabilidad prod (incidente FK en `payment_transactions`).
- Testing:
  - ampliar E2E integrales (WhatsApp->carrito->checkout->email/PDF, OAuth real, idempotencia en escenarios de concurrencia).

## 5. Pendientes frontend
- Login UI:
  - Requiere rediseño visual y validacion de posibles problemas de render/percepcion.
- Formato de precios:
  - Hay render con `toLocaleString()` y otros con texto plano; falta normalizar con formato por moneda y locale.
- Modulo ordenes:
  - Actualmente mezcla datos reales con fallback/mock y alias de cliente generico.
  - Falta mejorar detalle de orden para uso empresarial real (estado, totales, trazabilidad de pago).
- Consistencia de estados:
  - mejorar loading/empty/error states en flujos clave.

## 6. Pendientes backend
- Pago real/sandbox provider desacoplado manteniendo `PaymentProviderPort`.
- Normalizacion de formato monetario en respuestas de bot/correos/PDF (hoy hay multiples formatos directos con `toFixed` o concatenacion).
- Mejoras de resiliencia:
  - outbox/cola para correos transaccionales (hoy se envian inline con tolerancia a fallo).
- Observabilidad:
  - consolidar trazas funcionales por flujo de negocio (pedido/transaccion/email/pdf) con correlacion consistente.

## 7. Pendientes WhatsApp bot / UX conversacional
- Copywriting y tono:
  - mensajes mas claros, breves y amables para usuario final.
- Presentacion de catalogo/carrito:
  - mejor jerarquia visual de producto, precio, stock, cantidad y acciones.
- Acciones contextuales:
  - separar mejor acciones del producto vs acciones globales del carrito.
- Formato de precios:
  - evitar valores planos sin separadores ni simbolo correcto.
- Navegacion:
  - mejorar persistencia de contexto y comandos naturales de agregar/modificar cantidad.

## 8. Pendientes de correos y PDF
- Correo bienvenida:
  - mejorar plantilla HTML (branding, jerarquia, legibilidad movil).
- Correo compra:
  - mejorar plantilla y estructura visual de items/totales/estado.
- PDF compra:
  - rediseño visual (tipografia, spacing, bloques de resumen, branding empresa).
- Consistencia monetaria:
  - unificar formato de precios en email y PDF por moneda/locale.

## 9. Pendientes de checkout mock / pagos
- Mantener mock actual pero fortalecer:
  - trazabilidad explicita de `order`, `order_items`, `payment_transactions` y `idempotency_key`.
  - escenarios `pending/rejected/error` visibles en frontend para soporte operativo.
- Definir siguiente paso:
  - opcion A: pasarela sandbox real.
  - opcion B: simulador mock mas formal con estados/linea de tiempo y audit trail completo.

## 10. Pendientes de Dockerización
- Backend:
  - `Dockerfile` multistage (build + runtime).
- Frontend:
  - `Dockerfile` para build Vite y servidor estatico (ej. Nginx) o alternativa definida.
- Raiz:
  - `docker-compose.yml` para levantar ambos servicios rapidamente.
- Configuracion:
  - mantener conexion a DB local (host machine) como pediste.
  - revisar mapeo de variables (`FRONTEND_URL`, `VITE_API_URL`, puertos).
- Soporte operativo:
  - `.dockerignore` en backend/frontend.
  - seccion de docs para ejecucion con Docker.

## 11. Riesgos técnicos actuales
- Riesgo de drift documental:
  - hay docs antiguas con estado ya superado que pueden confundir decisiones.
- Riesgo UX/comercial:
  - bot y frontend muestran datos, pero formato/copy puede afectar conversion y confianza.
- Riesgo operativo de correos:
  - sin outbox/retry formal, depende de disponibilidad SMTP al momento de checkout.
- Riesgo de consistencia dev/test:
  - limpieza de datos con FKs de trazabilidad puede generar bloqueos frecuentes.
- Riesgo de seguridad:
  - pendientes de firma webhook y hardening de secretos.

## 12. Recomendación de prioridades por fases
- Fase 1: Dockerizacion (backend + frontend + compose + docs).
- Fase 2: UX/UI critica (login frontend + orders frontend + formato monetario unificado).
- Fase 3: WhatsApp UX conversacional (copy, estructura de mensajes, acciones contextuales, precios).
- Fase 4: Hardening transaccional y seguridad (firma webhook, estrategia FK dev/test, observabilidad).
- Fase 5: Checkout evolucionado (sandbox real o mock avanzado auditable).
- Fase 6: Pruebas E2E integrales y estabilizacion final.

## 13. Primera fase recomendada: Dockerización backend + frontend
- Objetivo:
  - reducir friccion de setup,
  - estandarizar entorno local,
  - facilitar pruebas cruzadas frontend/backend.
- Alcance de esta fase:
  - solo infraestructura de ejecucion (sin tocar logica de negocio).
- Restriccion operativa:
  - DB puede seguir local, exponiendo host desde contenedores con configuracion explicita.

## 14. Checklist detallado para implementar Dockerización después
- Descubrimiento:
  - validar puertos efectivos backend/frontend.
  - confirmar variables minimas requeridas por servicio.
- Backend container:
  - crear `aicrm_backend/Dockerfile` multistage.
  - definir comando runtime (`npm run start:prod` tras build).
- Frontend container:
  - crear `aicrm_frontend/Dockerfile`.
  - inyectar `VITE_API_URL` correcto para entorno Docker.
- Compose raiz:
  - crear `docker-compose.yml` con servicios `backend` y `frontend`.
  - mapear puertos (`3000`, `5173`/`80` segun estrategia frontend).
  - definir red interna y dependencias minimas.
- Ignorados:
  - agregar `.dockerignore` en ambos proyectos (`node_modules`, `dist`, logs, etc.).
- Variables:
  - complementar `.env.example` con notas Docker (`DB_HOST`, URLs internas/externas).
- Documentacion:
  - agregar seccion "Run with Docker" en READMEs.
  - incluir comando de arranque unico (`docker compose up --build`).
- Validacion:
  - comprobar login frontend.
  - comprobar endpoints protegidos backend.
  - comprobar comunicacion frontend->backend desde contenedor.

## Funcionalidades incompletas o documentadas pero no implementadas (consolidado)
- Pagos reales/pasarela: documentado en roadmap, no implementado.
- Firma webhook WhatsApp: documentado como pendiente, no implementado.
- Cifrado de secretos Meta en BD: pendiente.
- Outbox/retry de emails: pendiente.
- UX avanzada completa de carrito/catalogo WhatsApp (paginacion y contexto pleno): parcial.
- Facturacion legal/electronica: roadmap futuro, no implementado.
- Dockerizacion: no implementada.

## Duplicados, desactualizados o contradictorios detectados
- `aicrm_backend/PROJECT_CONTEXT.md`:
  - mezcla entradas historicas con estado vigente; incluye roadmap antiguos ya cumplidos y otros ya superados.
- `aicrm_backend/docs/session-2026-05-07-technical-state.md`:
  - documento de handoff historico; partes estan desfasadas frente a avances de 2026-05-08 a 2026-05-12.
- `aicrm_backend/docs/products-conversational-tools.md`:
  - al inicio dice que no hay creacion de orden en fase; luego el propio documento y roadmap ya referencian checkout mock/ordenes. Requiere aclarar vigencia por secciones/fechas.
- `aicrm_frontend/PROGRESSION.md`, `API_INTEGRATION_PLAN.md`, `API_INTEGRATION_IMPLEMENTED.md`, `README.md`:
  - contienen capas de historico con diferentes estados de integracion (algunas partes ya obsoletas).
- Codificacion/encoding:
  - se observan caracteres mojibake en varios archivos (`Ã³`, `diseÃ±o`, etc.), lo que afecta legibilidad y calidad documental.

## Recommended implementation order
1. Dockerizacion backend + frontend + `docker-compose.yml` raiz + docs de ejecucion.
2. Normalizacion de variables de entorno y `.dockerignore` + hardening de arranque local.
3. Mejora UI login frontend y modulo ordenes (empresa).
4. Normalizacion transversal de formato de precios (frontend, WhatsApp, email, PDF).
5. Rediseño UX conversacional WhatsApp (copy, estructura de respuestas, acciones contextuales).
6. Mejora plantillas HTML de bienvenida y compra.
7. Mejora diseño visual del PDF de compra.
8. Hardening checkout mock (observabilidad y estados visibles) y decision sandbox real vs simulador avanzado.
9. Seguridad/robustez: firma webhook, secretos, politica FK dev/test, pruebas E2E integrales.
