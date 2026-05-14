# PROGRESSION - AI CRM Frontend

## Resumen
El frontend del AI CRM se encuentra en una fase de prototipo funcional basado en un diseño previamente definido en Figma. Ya existe una base navegable y visualmente consistente sobre la cual se puede avanzar hacia la integracion completa con backend.

## Lo realizado hasta el momento
- Se reemplazo la plantilla inicial de Vite por la estructura real del frontend del CRM.
- Se implemento la navegacion principal de la aplicacion con React Router.
- Se construyeron las vistas principales del sistema:
  - Login
  - Registro
  - Dashboard
  - Productos
  - Clientes
  - Conversaciones
  - Ordenes
  - Detalle de orden
  - Configuracion
- Se implemento la base de layout del sistema:
  - Sidebar
  - Topbar
  - Layout principal
  - KPI cards
- Se creo una capa base de componentes UI reutilizables para soportar el prototipo.
- Se ajusto la configuracion del proyecto para que compile correctamente con TypeScript y Vite.
- Se corrigieron errores de imports, rutas, configuracion y tipado que impedian compilar el proyecto.
- Se dejo el proyecto validado con build y lint exitosos.
- Se organizo la base de estilos y tema visual para sostener el diseño del frontend.

## Estado actual del frontend
- El frontend ya funciona como prototipo navegable.
- La interfaz ya representa visualmente el flujo principal del CRM.
- La mayor parte de la logica visible aun trabaja con datos mock o quemados.
- Aun no existe una capa formal de consumo de APIs para conectarse al backend.

## Pendientes inmediatos
- Eliminar los datos quemados en componentes y paginas.
- Instalar Axios para consumir peticiones HTTP.
- Empezar a construir las clases, funciones o servicios para consumir los endpoints del backend.
- Implementar las interfaces TypeScript necesarias para enviar y recibir datos correctamente.
- Conectar autenticacion, productos, conversaciones, mensajes y ordenes con respuestas reales del backend.

## Pendientes tecnicos sugeridos
- Crear una carpeta de servicios o api clients, por ejemplo `src/services` o `src/infrastructure/api`.
- Crear un cliente base de Axios con configuracion compartida.
- Incorporar manejo centralizado de token JWT.
- Definir tipos para DTOs de request y response segun el backend.
- Reemplazar mocks por llamadas reales de forma incremental por modulo.
- Incorporar estados de carga, error y respuestas vacias en cada pantalla.

## Propuesta de siguiente etapa
### Fase 1 - Conexion base
- Instalar Axios.
- Configurar cliente HTTP base.
- Definir archivo de configuracion para URL del backend.

### Fase 2 - Contratos e interfaces
- Crear interfaces para auth, productos, conversaciones, mensajes y ordenes.
- Mapear estructuras del backend al frontend.

### Fase 3 - Integracion por modulos
- Autenticacion.
- Productos.
- Conversaciones y mensajes.
- Ordenes.
- Dashboard con datos reales.

### Fase 4 - Limpieza del prototipo
- Eliminar completamente datos mock restantes.
- Alinear mensajes, validaciones y estados con backend real.
- Refinar experiencia de usuario para escenarios reales.

## Riesgos o puntos a vigilar
- Diferencias entre el diseño de Figma y la respuesta real del backend.
- Contratos HTTP aun no reflejados en interfaces del frontend.
- Posibles cambios en nombres de campos o payloads entre frontend y backend.
- Necesidad de definir una estrategia clara para manejo de errores de API.

## Fecha de actualizacion
2026-04-23

## Entrada 2026-04-24

### Funcionalidades implementadas
- Integracion con backend:
  - Registro de usuario
  - Login
  - Creacion de productos
- Implementacion de capa API con axios.
- Persistencia de sesion con localStorage.

### Mejoras tecnicas
- Configuracion de axios con interceptores.
- Implementacion de logger.
- Organizacion de servicios por dominio.

### Pendientes
- Reemplazar datos mock por datos reales.
- Integrar endpoints faltantes:
  - Customers
  - Orders
  - Conversations
- Mejorar manejo de errores en UI.

## Entrada 2026-04-25

### Funcionalidades implementadas
- Backend actualizado con modulo Customer completo y disponible para consumo desde frontend.
- Endpoints Customer disponibles y versionados:
  - POST /api/v1/customers
  - GET /api/v1/customers
  - GET /api/v1/customers/:id
- Documentacion Swagger de Customer alineada con el patron del proyecto.

### Mejoras tecnicas
- Logging integrado en flujo Customer del backend (controller, use cases y repository).
- DTO de Customer documentado en Swagger con ejemplos y campos requeridos/opcionales.

### Pendientes
- Reemplazar datos mock por datos reales en Customers.tsx (retirar fallback progresivamente).
- Integrar completamente endpoints faltantes en frontend:
  - Orders
  - Conversations
- Mejorar manejo de errores en UI con mensajes consistentes por tipo de fallo.

## Entrada 2026-05-07 (correccion flujo inicial auth/routing)

### Problema detectado
- La app iniciaba mostrando dashboard directamente, aun sin sesion.

### Causa raiz
- Ruta raiz (`/`) apuntaba a `Layout` + `Dashboard` sin `ProtectedRoute`.
- No habia bifurcacion explicita de rutas publicas vs protegidas.

### Correcciones implementadas
- Se crearon componentes de control de acceso:
  - `ProtectedRoute`
  - `PublicRoute`
  - `RootRedirect`
- Router actualizado:
  - `/` decide segun sesion: `/login` o `/dashboard`
  - `/login` y `/register` son publicas
  - `dashboard/products/customers/conversations/orders/settings` quedan protegidas
- Login/Register:
  - si existe sesion, redirigen a `/dashboard`
  - despues de auth exitosa redirigen a `/dashboard`
- Sidebar:
  - acceso principal actualizado a `/dashboard`
- Topbar:
  - logout real via `authService.logout()`
  - redireccion a `/login`
  - se elimino uso de usuario fijo para sesion aparente

### Resultado funcional esperado
1. Usuario sin sesion entra a `/` -> redirige a `/login`.
2. Usuario autenticado entra a `/` -> redirige a `/dashboard`.
3. Rutas protegidas sin sesion -> redirigen a `/login`.
4. Logout limpia sesion y bloquea acceso a rutas protegidas.

### Verificacion tecnica
- `npx tsc -b` exitoso.
- `npm run build` no pudo completarse por problema de entorno (`spawn EPERM` de esbuild en este host), no por errores de tipado/rutas.

## Cierre de sesion 2026-05-07 (proximos pasos frontend)

### Lo que quedo funcionando
- Flujo inicial de autenticacion orientado a login.
- Redireccion de `/` segun sesion.
- Rutas protegidas para dashboard y modulos privados.
- Logout con limpieza de sesion.

### Pendientes prioritarios frontend
1. Mostrar conversaciones reales desde backend:
   - conversaciones + mensajes inbound/outbound,
   - customer asociado,
   - historial real por conversacion.
2. Limpiar datos mock/hardcoded en:
   - dashboard,
   - conversaciones,
   - productos,
   - clientes,
   - estadisticas.
3. Consolidar flujo auth completo:
   - validacion de token/sesion,
   - expiracion de sesion,
   - manejo de errores de autenticacion.
4. Conectar vistas con servicios API reales:
   - loading states,
   - empty states,
   - errores de red/backend.

### Prioridad recomendada siguiente sesion
1. Retomar frontend.
2. Completar limpieza de rutas/login.
3. Integrar conversaciones reales.
4. Remover mocks principales.
5. Luego retomar backend multi-provider IA.

## Entrada 2026-05-08 (sincronizacion catalogo categorias/productos)

### Implementado en frontend
- Modulo Categorias:
  - vista dedicada,
  - creacion,
  - listado,
  - cambio de estado activo/inactivo.
- Modulo Productos:
  - edicion real de producto con endpoint PATCH,
  - selector de categoria opcional,
  - soporte para quitar categoria ("Sin categoria"),
  - visualizacion de categoria inactiva asociada,
  - filtros combinados (categoria + busqueda + stock bajo),
  - accion de limpiar filtros.
- Imagen producto:
  - placeholder "proximamente",
  - preview por `imageUrl` existente,
  - lista la base para integrar Cloudinary despues.

### Estado de calidad tecnica
- Lint en verde.
- Typecheck (`tsc -b`) en verde.
- Build puede fallar por `spawn EPERM` de esbuild en entorno host (no por tipado).

### Pendientes siguientes (frontend)
1. Integracion de carga real de imagenes (Cloudinary).
2. Ajustes UX para flujo de catalogo conversacional (alineado con WhatsApp).
3. Cobertura de tests de componentes y servicios API.
4. Preparacion de interfaces para fase suppliers/proveedores.

## Entrada 2026-05-14 (fix auth text encoding/render)

### Correccion aplicada
- Se corrigieron textos con encoding dañado en pantallas de autenticacion.
- Login ya no muestra secuencias escapadas visibles (`\u00f3`, `\u00f1`, `\u00bf`) en UI.
- Register y GoogleAuthFailure quedaron alineadas con caracteres UTF-8 correctos.

### Alcance
- Solo cambios de texto/render en frontend auth.
- Sin cambios de logica de autenticacion ni endpoints.
