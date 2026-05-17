# AI CRM Frontend

## Descripcion
Este frontend corresponde a la interfaz web del proyecto AI CRM. Su objetivo es ofrecer una experiencia visual para la gestion comercial de empresas que usan el CRM, incluyendo autenticacion, dashboard, productos, clientes, conversaciones, ordenes y configuracion.

La base visual del frontend parte de un prototipo ya definido en Figma. La implementacion actual toma ese prototipo como referencia de estructura, navegacion y estilo para construir una primera version funcional dentro de React + TypeScript + Vite.

## Objetivo del frontend
- Representar visualmente el flujo del CRM definido en el prototipo de Figma.
- Servir como base funcional para conectar la interfaz con el backend NestJS del proyecto.
- Preparar una estructura reutilizable de componentes y paginas para evolucionar desde un prototipo visual hacia una aplicacion real.

## Alcance actual
El frontend actualmente cubre una primera capa funcional de presentacion con las siguientes vistas:

- Login
- Registro
- Dashboard
- Productos
- Clientes
- Conversaciones
- Ordenes
- Detalle de orden
- Proveedores
- Configuracion

Adicionalmente, se implemento una base de componentes UI reutilizables para sostener el sistema visual del proyecto.

## Base de diseno
- El frontend nace a partir de un prototipo dado desde Figma.
- La implementacion actual respeta la idea general del flujo y la composicion visual del prototipo.
- Todavia hay partes del proyecto que funcionan con datos simulados para representar el comportamiento esperado antes de conectar completamente con backend.

## Stack tecnico
- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS 4
- Sonner
- Radix UI
- Recharts

## Estructura general
- src/app/components: componentes de layout, KPIs y piezas reutilizables.
- src/app/components/ui: componentes base de interfaz reutilizables.
- src/app/pages: vistas principales del sistema.
- src/styles: estilos globales, tema y configuracion visual.
- src/routes.tsx: definicion central de rutas.
- src/lib: utilidades compartidas.

## Estado actual
En este momento el frontend se encuentra en fase de prototipo funcional. Eso significa que:

- La navegacion principal ya existe.
- La interfaz ya compila correctamente.
- El sistema visual base ya esta montado.
- La mayor parte del contenido mostrado todavia usa datos quemados o simulados.
- Aun no se ha completado la integracion real con los endpoints del backend.

## Flujo de autenticacion (actualizado)
- La app ya no entra directo al dashboard por defecto.
- Comportamiento actual:
  - Si no hay sesion valida: `/` redirige a `/login`.
  - Si hay sesion valida: `/` redirige a `/dashboard`.
- Rutas protegidas (`/dashboard`, `/products`, `/customers`, `/conversations`, `/orders`, `/settings`) requieren sesion activa.
- Rutas protegidas (`/dashboard`, `/products`, `/customers`, `/conversations`, `/orders`, `/suppliers`, `/settings`) requieren sesion activa.
  - Rutas publicas (`/login`, `/register`) redirigen a `/dashboard` si ya existe sesion.

## Causa raiz corregida
- El router inicial montaba `Layout` en `/` con `Dashboard` como `index`, sin guard de autenticacion.
- Eso permitia visualizar pantallas protegidas sin validar JWT/sesion.

## Manejo de sesion/token
- El login consume backend (`POST /auth/login` sobre base `/api/v1`) y guarda:
  - `auth_token`
  - `auth_userId`
  - `auth_companyId`
  - `auth_role` (opcional)
- `apiClient` inyecta `Authorization: Bearer <token>` via interceptor.
- En `401`, se limpia sesion automaticamente.
- Logout limpia storage y redirige a `/login`.

## Integracion esperada con backend
La siguiente etapa del frontend consiste en conectarse al backend del AI CRM para dejar de depender de mocks locales. Para eso sera necesario:

- instalar Axios como cliente HTTP
- centralizar configuracion de base URL, headers y manejo de token
- crear funciones o servicios para consumir los endpoints existentes
- definir interfaces TypeScript para request y response
- reemplazar los datos quemados por datos reales provenientes del backend

## Proximo enfoque de desarrollo
Las siguientes prioridades del frontend son:

1. Eliminar datos simulados en paginas y componentes.
2. Instalar Axios y preparar la capa de consumo HTTP.
3. Implementar servicios para autenticacion, productos, conversaciones, mensajes y ordenes.
4. Crear interfaces TypeScript para representar contratos de entrada y salida.
5. Conectar formularios y tablas con datos reales del backend.

## Roadmap siguiente sesion (frontend)
1. Mantener login como entrada principal.
2. Validar rutas protegidas y redirecciones por sesion.
3. Integrar vista de conversaciones con datos reales (`Conversation` + `messages`).
4. Mostrar historial inbound/outbound real del bot y usuario.
5. Retirar mocks del flujo principal (mantenerlos solo como fixtures opcionales).
6. Endurecer manejo de errores de API y sesion expirada.

## Notas
Este frontend no debe verse como una version final de producto, sino como la base de una implementacion progresiva que parte desde un diseño de Figma ya definido y evoluciona hacia una aplicacion integrada con backend real.

## Actualizacion 2026-05-08 (fase catalogo + sincronizacion backend)

### Estado actual del frontend
- Integracion real con categorias de backend completada.
- Nueva vista de categorias activa en navegacion:
  - crear,
  - listar,
  - activar/desactivar.
- Vista de productos sincronizada con backend:
  - crear producto con categoria opcional,
  - editar producto por endpoint real,
  - cambiar/quitar categoria,
  - mostrar categoria activa/inactiva en listado.
- Filtros en productos:
  - por categoria,
  - por texto,
  - por stock bajo,
  - combinables + limpieza rapida.
- Campo de imagen preparado visualmente (placeholder + preview por URL).

### Endpoints backend consumidos por frontend (catalogo)
- `GET /products`
- `POST /products`
- `PATCH /products/:id`
- `GET /categories`
- `GET /categories/active`
- `POST /categories`
- `PATCH /categories/:id/status`
- `GET /categories/:id/products`

## Actualizacion 2026-05-17 (suppliers frontend fase 1)

### Estado actual del modulo proveedores
- Pantalla `Suppliers` implementada y conectada a backend real.
- Ruta protegida habilitada:
  - `/suppliers`
- Navegacion lateral actualizada con acceso `Proveedores`.

### Endpoints backend consumidos (suppliers)
- `GET /suppliers`
- `POST /suppliers`
- `GET /suppliers/:id`
- `PATCH /suppliers/:id`
- `PATCH /suppliers/:id/status`

### Alcance implementado
- Listado de proveedores.
- Busqueda por nombre/contacto/ciudad/documento/email.
- Filtro por estado (todos/activos/inactivos).
- Creacion y edicion de proveedor.
- Activar/desactivar proveedor.

## Actualizacion 2026-05-17 (relacion producto -> proveedor)

### Regla aplicada
- Un proveedor puede tener muchos productos.
- Un producto puede tener un solo proveedor o ninguno.

### Cambios frontend aplicados
- `Products`:
  - selector de proveedor en crear/editar (opcional, `Sin proveedor`).
  - render de proveedor asociado en listado.
  - filtro por proveedor.
- `Suppliers`:
  - accion `Ver productos` por proveedor.
  - modal con productos relacionados consumiendo endpoint backend.

### Endpoints usados para la relacion
- `GET /suppliers`
- `GET /suppliers/:id/products`
- `POST /products` (con `supplierId` opcional)
- `PATCH /products/:id` (con `supplierId` opcional/null)
- `POST /products/with-image` (con `supplierId` opcional)
- `PATCH /products/:id/with-image` (con `supplierId` opcional/null)

### Pendientes siguientes del modulo
1. Relacion producto-proveedor.
2. Ver productos relacionados por proveedor.
3. Vista detalle individual de proveedor (si se requiere).
4. Tests de UI y servicio API.

### Proximos pasos frontend (prioridad)
1. UX de catalogo mas orientada a operacion comercial.
2. Integracion de carga real de imagenes (Cloudinary).
3. Mejor manejo de estados de edicion y validaciones por campo.
4. Preparar UI para detalle enriquecido de producto (uso futuro en WhatsApp).
5. Acompanar la fase de pruebas unitarias/E2E.
