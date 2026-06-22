# aicrm_frontend

Panel de administración web del CRM, construido como Single Page Application (SPA) con React 18 y TypeScript. Permite a los operadores gestionar clientes, productos, pedidos, proveedores y conversaciones de WhatsApp, y configurar la empresa. Se conecta al backend exclusivamente a través de la API REST bajo JWT.

---

## Contenido

- [Stack tecnológico](#stack-tecnológico)
- [Páginas y funcionalidades](#páginas-y-funcionalidades)
- [Estructura de rutas](#estructura-de-rutas)
- [Flujo de autenticación JWT](#flujo-de-autenticación-jwt)
- [API layer](#api-layer)
- [Setup local](#setup-local)
- [Variables de entorno](#variables-de-entorno)
- [Limitaciones conocidas](#limitaciones-conocidas)

---

## Stack tecnológico

| Tecnología | Versión | Rol |
|------------|---------|-----|
| React | 18 | Framework de UI |
| TypeScript | 5 | Tipado estático |
| Vite | 5+ | Build tool y dev server |
| Tailwind CSS | 4 | Estilos utilitarios |
| Radix UI | — | Componentes accesibles (base para Shadcn-style) |
| React Router | v7 | Routing SPA (createBrowserRouter) |
| Recharts | — | Gráficos del dashboard |
| Sonner | — | Notificaciones toast |
| Axios | — | Cliente HTTP con interceptores |

---

## Páginas y funcionalidades

### Autenticación

- **Login** (`/login`) — Formulario de email/password. Llama a `POST /auth/login` y almacena el JWT en `localStorage`.
- **Register** (`/register`) — Creación de cuenta de operador con email/password.
- **Google OAuth** — Flujo completo: inicio desde `/login`, callback en `/login/google/callback`, página de resultado en `/auth/google/success`, manejo de error en `/auth/google/failure`, y completado de registro en `/auth/google/complete-registration`.

### Dashboard (`/dashboard`)

Métricas del negocio consumidas desde la API real: totales de clientes, productos, pedidos y conversaciones. Incluye gráficos de Recharts para visualizar tendencias.

### Products (`/products`)

CRUD completo de productos del catálogo:

- Listado con nombre, precio, stock e imagen.
- Creación y edición con soporte para subida de imagen a Cloudinary (`POST /products/with-image`, `PATCH /products/:id/with-image`).
- Visualización de proveedores asociados a cada producto.

### Categories (`/categories`)

- Listado de categorías con estado activo/inactivo.
- Creación de nuevas categorías.
- Cambio de estado (`PATCH /categories/:id/status`).

### Customers (`/customers`)

- Listado de clientes registrados.
- Creación de nuevos clientes.

### Conversations (`/conversations`)

- Listado de conversaciones de WhatsApp con información del cliente asociado.
- Detalle de cada conversación con el historial de mensajes completo (`GET /conversations/:id/messages`).

### Orders (`/orders` y `/orders/:id`)

- Listado de pedidos con estado y cliente.
- Detalle de pedido con líneas de productos (`OrderItem`).

### Suppliers (`/suppliers` y `/suppliers/:id`)

- Listado de proveedores con estado activo/inactivo.
- Creación y edición de proveedores.
- Cambio de estado.
- Detalle de proveedor con lista de productos asociados.

### Settings (`/settings`)

- Visualización y edición de la configuración de la empresa (nombre, datos de contacto).
- Subida de logo a Cloudinary.

---

## Estructura de rutas

| Path | Componente | Protegida (JWT) |
|------|------------|-----------------|
| `/login` | `LoginPage` | No |
| `/register` | `RegisterPage` | No |
| `/auth/google/success` | `GoogleAuthSuccessPage` | No |
| `/login/google/callback` | `GoogleCallbackPage` | No |
| `/auth/google/failure` | `GoogleAuthFailurePage` | No |
| `/auth/google/complete-registration` | `CompleteRegistrationPage` | No |
| `/dashboard` | `DashboardPage` | Sí |
| `/products` | `ProductsPage` | Sí |
| `/categories` | `CategoriesPage` | Sí |
| `/customers` | `CustomersPage` | Sí |
| `/conversations` | `ConversationsPage` | Sí |
| `/orders` | `OrdersPage` | Sí |
| `/orders/:id` | `OrderDetailPage` | Sí |
| `/suppliers` | `SuppliersPage` | Sí |
| `/suppliers/:id` | `SupplierDetailPage` | Sí |
| `/settings` | `SettingsPage` | Sí |

Las rutas protegidas están envueltas en un componente `ProtectedRoute` y un `Layout` compartido. Si el usuario no está autenticado, `ProtectedRoute` redirige a `/login`.

---

## Flujo de autenticación JWT

### Login con email/password

1. El usuario completa el formulario en `/login`.
2. El frontend llama a `POST /api/v1/auth/login` con `{ email, password }`.
3. El backend responde con `{ token, userId, companyId, role }`.
4. El frontend almacena los datos en `localStorage`:
   - `auth_token` — JWT para autenticar requests
   - `auth_userId` — ID del operador
   - `auth_companyId` — ID de la empresa
   - `auth_role` — rol del operador

### Login con Google OAuth

1. El usuario hace clic en "Iniciar con Google".
2. El frontend redirige al backend a la URL `VITE_GOOGLE_LOGIN_START_URL` (`/api/v1/auth/google/start`).
3. El backend redirige al consentimiento de Google.
4. Google redirige de vuelta al backend (`/api/v1/auth/google/callback`).
5. El backend redirige al frontend con el token en los query params (`/auth/google/success?token=...`).
6. La página `GoogleAuthSuccessPage` extrae el token y lo almacena en `localStorage`.

### Adjuntar el token en cada request

El archivo `src/api/client/apiClient.ts` configura un interceptor de Axios que lee `auth_token` de `localStorage` y lo adjunta automáticamente como `Authorization: Bearer <token>` en cada request saliente.

### ProtectedRoute

`ProtectedRoute` lee `auth_token` de `localStorage` antes de renderizar. Si no existe o es inválido, redirige a `/login`. Si existe, renderiza la ruta solicitada dentro del `Layout`.

---

## API layer

La capa de acceso a datos del frontend está organizada en dos niveles:

```
src/api/
├── client/
│   └── apiClient.ts        # Instancia Axios con baseURL y interceptor de Auth
└── services/
    ├── auth.service.ts
    ├── category.service.ts
    ├── company-settings.service.ts
    ├── conversation.service.ts
    ├── customer.service.ts
    ├── message.service.ts
    ├── order.service.ts
    ├── product.service.ts
    └── supplier.service.ts
```

Cada servicio importa `apiClient` y expone funciones tipadas que encapsulan los endpoints correspondientes del backend. Los componentes de React no acceden a Axios directamente — siempre pasan por el servicio correspondiente.

---

## Setup local

```bash
# Desde la raíz del monorepo
cd aicrm_frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales

# Iniciar dev server
npm run dev
# Disponible en http://localhost:5173

# Build de producción (genera dist/)
npm run build

# Preview del build de producción local
npm run preview
```

---

## Variables de entorno

| Variable | Obligatoria | Propósito | Ejemplo |
|----------|-------------|-----------|---------|
| `VITE_API_URL` | Sí | URL base de la API backend (sin barra final) | `http://localhost:3000/api/v1` |
| `VITE_GOOGLE_LOGIN_START_URL` | Sí | URL del backend para iniciar el flujo Google OAuth | `http://localhost:3000/api/v1/auth/google/start` |

---

## Limitaciones conocidas

- El Dockerfile del frontend corre en modo desarrollo con el Vite dev server. No hay Dockerfile de producción con nginx ni build optimizado para deploy.
- El archivo `.env` está commiteado al repositorio.
- No existe código de lazy loading de rutas — todas las páginas se cargan en el bundle inicial.
- No hay tests unitarios ni de integración en el frontend.
- El JWT se almacena en `localStorage`, lo cual lo expone a ataques XSS. Una alternativa más segura sería usar cookies `HttpOnly`.
