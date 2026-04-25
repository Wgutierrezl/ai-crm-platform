# 🚀 PLAN DE INTEGRACIÓN API FRONTEND-BACKEND

## 📊 ANÁLISIS BACKEND

### Endpoints Disponibles

```
┌─ AUTH ────────────────────────────────────────┐
│ POST   /auth/register                          │
│ POST   /auth/login       → { token, userId,   │
│                             companyId, role } │
└────────────────────────────────────────────────┘

┌─ PRODUCTS ────────────────────────────────────┐
│ POST   /products         → Crear producto      │
│ GET    /products         → Listar productos    │
└────────────────────────────────────────────────┘

┌─ CONVERSATIONS ───────────────────────────────┐
│ POST   /conversations    → Crear conversación  │
│ GET    /conversations    → Listar conversaciones
└────────────────────────────────────────────────┘

┌─ MESSAGES ────────────────────────────────────┐
│ POST   /messages         → Mensaje manual      │
│ POST   /messages/incoming → Con procesamiento IA
└────────────────────────────────────────────────┘

┌─ ORDERS ──────────────────────────────────────┐
│ POST   /orders           → Crear orden         │
│ GET    /orders           → Listar órdenes      │
└────────────────────────────────────────────────┘
```

### Respuestas del Backend

**Login Response:**
```typescript
{
  accessToken: string;        // JWT con sub, email, companyId, role
  userId: string;             // UUID del usuario
  companyId: string;          // UUID de la empresa (multi-tenant)
  role: string;               // 'admin', etc.
}
```

**Productos Response:**
```typescript
{
  id: string;                 // UUID
  name: string;               // "Laptop Pro 14"
  price: number;              // 4999.99
  stock: number;              // 50
  companyId: string;          // UUID
}
```

**Conversación Response:**
```typescript
{
  id: string;                 // UUID
  customerId: string;         // UUID del cliente
  companyId: string;          // UUID (del JWT automáticamente)
  createdAt: Date;
}
```

**Message Response:**
```typescript
{
  id: string;                 // UUID
  conversationId: string;     // UUID
  companyId: string;          
  content: string;            // "Hola, quiero comprar..."
  role: 'customer' | 'agent' | 'bot';
  createdAt: Date;
}
```

**Order Response:**
```typescript
{
  id: string;                 // UUID
  customerId: string;         // UUID
  companyId: string;          
  status: 'pending' | 'paid' | 'cancelled';
  total: number;              // 100000
  createdAt: Date;
}
```

---

## 📁 ANÁLISIS FRONTEND

### Mock Data Identificado

| Página | Mock Data | Tipo | Operaciones |
|--------|-----------|------|-------------|
| **Login.tsx** | None (mock logic) | setTimeout 500ms | - |
| **Products.tsx** | mockProducts (6 items) | Array local | CRUD local |
| **Conversaciones.tsx** | mockConversations (inferido) | Array local | Lectura |
| **Orders.tsx** | mockOrders (inferido) | Array local | Lectura |
| **Dashboard.tsx** | KPI cards + Charts | Números hardcodeados | Lectura |

### Problema Actual
- ❌ Sin API client (Axios no instalado)
- ❌ Sin persistencia de sesión (localStorage)
- ❌ Sin autenticación real
- ❌ Sin servicios/capas de abstracción
- ❌ Lógica API mezclada potencialmente con UI

---

## 🏗️ ARQUITECTURA PROPUESTA

### Árbol de Directorios

```
src/
├── api/                              # Capa de consumo de APIs
│   ├── client/
│   │   └── apiClient.ts              # Cliente Axios base + interceptores
│   │
│   ├── services/                     # Servicios por dominio
│   │   ├── auth.service.ts           # login(), register(), logout()
│   │   ├── product.service.ts        # getProducts(), createProduct()
│   │   ├── customer.service.ts       # getCustomers(), createCustomer()
│   │   ├── conversation.service.ts   # getConversations(), createConversation()
│   │   ├── message.service.ts        # sendMessage(), processIncomingMessage()
│   │   └── order.service.ts          # getOrders(), createOrder()
│   │
│   ├── dtos/                         # Objetos de Transferencia de Datos
│   │   ├── auth.dto.ts               # LoginDto, RegisterDto, LoginResponseDto
│   │   ├── product.dto.ts            # ProductDto, CreateProductDto
│   │   ├── customer.dto.ts           # CustomerDto, CreateCustomerDto
│   │   ├── conversation.dto.ts       # ConversationDto, CreateConversationDto
│   │   ├── message.dto.ts            # MessageDto, CreateMessageDto, MessageResponseDto
│   │   └── order.dto.ts              # OrderDto, CreateOrderDto, OrderItemDto
│   │
│   └── interfaces/                   # Tipos e interfaces comunes
│       ├── api-response.interface.ts # ApiResponse<T>, ApiError
│       └── common.interface.ts       # Tipos compartidos
│
├── utils/
│   ├── storage/
│   │   └── authStorage.ts            # setAuthData(), getAuthData(), clearAuthData()
│   │
│   └── logger/
│       └── logger.ts                 # log(), error(), warn(), info()
│
├── .env                              # VITE_API_URL=http://localhost:3000
├── .env.example                      # Template
│
└── [existing structure]
```

---

## 🔐 FLUJO DE AUTENTICACIÓN

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                                │
├─────────────────────────────────────────────────────────────┤

1. Usuario entra en Login.tsx
   └─> form.email, form.password

2. handleSubmit() llama auth.service.login(email, password)
   └─> POST /auth/login { email, password }

3. Backend responde:
   ✓ { accessToken, userId, companyId, role }
   ✗ 401 Unauthorized → mostrar error

4. Si SUCCESS:
   └─> authStorage.setAuthData({
         token: accessToken,
         userId,
         companyId
       })
   └─> Guardado en localStorage
   └─> navigate("/") → Dashboard

5. En HEADER de todas las requests:
   Authorization: Bearer <accessToken>
   └─> apiClient interceptor agrega automáticamente
   └─> Backend extrae companyId desde JWT

6. En LOGOUT:
   └─> authStorage.clearAuthData()
   └─> localStorage limpio
   └─> navigate("/login")
```

---

## 🔁 CICLO DE VIDA: PRODUCTOS

```
┌─────────────────────────────────────────────────────────────┐
│            PRODUCTS PAGE LIFECYCLE                           │
├─────────────────────────────────────────────────────────────┤

1. Product.tsx monta
   └─> useEffect(() => {
         product.service.getProducts()
       }, [])

2. productService.getProducts()
   └─> GET /products
   └─> Header: Authorization: Bearer token (automático)
   └─> Backend filtra por companyId (desde JWT)
   └─> Retorna: Product[]

3. setProducts([...responseData])
   └─> Renderizar tabla/grid

4. Usuario crea producto
   └─> form: name, price, stock
   └─> product.service.createProduct(formData)
   └─> POST /products { name, price, stock }
   └─> Backend agrega companyId (desde JWT)
   └─> Retorna: { id, name, price, stock, companyId }

5. Actualizar lista: 
   └─> setProducts([...products, nuevoProducto])
   └─> Toast: "Producto creado"

6. Si error:
   └─> logger.error(error)
   └─> Toast.error(error.message)
   └─> Opcional: mantener mockProducts como fallback
```

---

## 📋 FASE DE IMPLEMENTACIÓN

### Fase 1: Setup Base (30 min)
```bash
npm install axios                    # Instalar cliente HTTP

# Crear archivos
.env
.env.example
src/utils/logger/logger.ts
src/utils/storage/authStorage.ts
```

### Fase 2: Cliente HTTP (20 min)
```typescript
// src/api/client/apiClient.ts
- Configurar baseURL
- Request interceptor: agregar JWT
- Response interceptor: loguear
- Error interceptor: 401 handling
```

### Fase 3: DTOs e Interfaces (20 min)
```typescript
// src/api/dtos/*.ts
// src/api/interfaces/*.ts
- Mapear estructuras del backend
- Tipos TypeScript para autocomplete
```

### Fase 4: Servicios (45 min)
```typescript
// src/api/services/*.ts
- auth: login, register, logout
- product: getProducts, createProduct
- customer: getCustomers, createCustomer
- conversation: getConversations, createConversation
- message: sendMessage, processIncomingMessage
- order: getOrders, createOrder
```

### Fase 5: Integración Progresiva (1 hora)
```typescript
// Por página, reemplazar mock con API

// 1. Login.tsx
- Reemplazar setTimeout con auth.service.login()
- Guardar token en localStorage
- Redirigir a Dashboard

// 2. Products.tsx
- Reemplazar mockProducts con product.service.getProducts()
- useEffect para cargar al montar

// 3. Conversations.tsx, Orders.tsx, etc.
- Aplicar patrón similar
```

### Fase 6: Refinamiento (30 min)
- Estados de carga (loading spinners)
- Validaciones mejoradas
- Toast/alert messages
- Manejo de errores consistente

**Tiempo total: ~2.5-3 horas**

---

## 🎯 PUNTOS CRÍTICOS

### 1. Multi-tenant (IMPORTANTE)
```
✅ Frontend NO envía companyId en payload
✅ Backend extrae companyId del JWT automáticamente
✅ Todos los datos están automáticamente filtrados por empresa
✅ authStorage.setAuthData() guarda companyId para referencias locales

Mal ❌
POST /products { name, price, stock, companyId } // No!

Bien ✅
POST /products { name, price, stock }           // Backend agrega companyId
```

### 2. Autenticación
```
Login Response:
{ 
  accessToken: "eyJhbGc...",    // JWT con companyId adentro
  userId: "uuid-123",
  companyId: "uuid-empresa",
  role: "admin"
}

Guardar en localStorage:
localStorage.setItem('token', accessToken)
localStorage.setItem('userId', userId)
localStorage.setItem('companyId', companyId)

Usar en requests:
Authorization: Bearer <accessToken>
// apiClient interceptor lo hace automáticamente
```

### 3. Persistencia de Sesión
```
En App.tsx o Layout.tsx:
useEffect(() => {
  const token = authStorage.getAuthData().token
  if (token) {
    // Token válido en localStorage
    // Frontend ya tiene sesión
    // apiClient lo agregará automáticamente a requests
  } else {
    // Sin token → redirect a /login
  }
}, [])
```

### 4. No Romper Mock Data
```
Opción 1 (Recomendado): Gradual
- Mantener mockProducts como fallback
- Agregar try/catch y usar mock si API falla
- Facilita testing sin backend

Opción 2: Completo replacement
- Si backend está siempre disponible
- Eliminar mocks directamente
- Menos código
```

### 5. Logger Centralizado
```
Todos los errores → logger.error()
Requests importantes → logger.log()
Debugging → console.log solo en logger

Ventaja: Un solo lugar para ver qué pasó
```

---

## 📊 MAPEO PÁGINAS → SERVICIOS

```
Login.tsx
  └─> auth.service.login()
  └─> authStorage.setAuthData()

Register.tsx
  └─> auth.service.register()
  └─> auth.service.login()

Dashboard.tsx
  └─> product.service.getProducts()
  └─> order.service.getOrders()
  └─> conversation.service.getConversations()

Products.tsx
  └─> product.service.getProducts()
  └─> product.service.createProduct()

Customers.tsx
  └─> customer.service.getCustomers()
  └─> customer.service.createCustomer()

Conversations.tsx
  └─> conversation.service.getConversations()
  └─> conversation.service.createConversation()
  └─> message.service.sendMessage()

OrderDetail.tsx
  └─> order.service.getOrders()
  └─> message.service.processIncomingMessage()

Orders.tsx
  └─> order.service.getOrders()
  └─> order.service.createOrder()

Settings.tsx
  └─> (futuro) user.service, company.service
```

---

## ✅ CHECKLIST FINAL

- [ ] Axios instalado
- [ ] .env con VITE_API_URL configurado
- [ ] apiClient.ts con interceptores funcionando
- [ ] authStorage.ts funcional (localStorage)
- [ ] logger.ts centralizado
- [ ] Todos los DTOs definidos
- [ ] Todos los servicios implementados
- [ ] Login.tsx integrando auth.service
- [ ] Products.tsx integrando product.service
- [ ] Conversaciones, Órdenes, etc. integrando servicios
- [ ] localStorage persistiendo token correctamente
- [ ] Token agregado automáticamente en requests
- [ ] Manejo de errores y loading states
- [ ] Tests manuales con backend en http://localhost:3000

---

## 🚀 LISTO PARA IMPLEMENTAR

Este plan evita simplificaciones, mantiene separación de concerns clara, y permite:
✅ Escalabilidad futura
✅ Testing desacoplado
✅ Reuso de servicios
✅ Mantenibilidad
✅ Debugging centralizado

**¿Procedo con la implementación? Confirma y comenzamos con Fase 1.**
