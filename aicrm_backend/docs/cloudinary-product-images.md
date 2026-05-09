# Cloudinary Product Images Integration

## Variables de entorno requeridas
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER_PRODUCTS` (opcional, default `products`)

## Variable opcional
- `CLOUDINARY_UPLOAD_PRESET`
  - Solo aplica si en el futuro haces carga directa desde navegador con unsigned upload.
  - En este backend actual no es obligatoria porque el upload es firmado desde servidor.

## Arquitectura aplicada
- Nuevo puerto hexagonal:
  - `src/domain/ports/image-storage.port.ts`
- Adaptador Cloudinary:
  - `src/infrastructure/external-services/cloudinary/cloudinary-image-storage.service.ts`
- Wiring DI:
  - `ImageStoragePort -> CloudinaryImageStorageService` en `AppModule`.

## Endpoints nuevos (sin romper endpoints existentes)
- `POST /api/v1/products/with-image`
  - `multipart/form-data`
  - `image` opcional
- `PATCH /api/v1/products/:id/with-image`
  - `multipart/form-data`
  - `image` opcional

Los endpoints anteriores JSON (`POST /products`, `PATCH /products/:id`) siguen funcionando.

## Validaciones de archivo
- Tipos permitidos: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`, `image/avif`.
- Tamaño máximo: 5 MB.

## Prueba rápida backend (Postman)
1. Autenticarte y obtener JWT.
2. Crear producto con `POST /api/v1/products/with-image` en `form-data`:
   - campos: `name`, `price`, `stock`, etc.
   - archivo: `image`
3. Verificar que la respuesta incluya `imageUrl` (URL segura HTTPS).
4. Editar con `PATCH /api/v1/products/:id/with-image`:
   - enviar solo campos que cambian
   - opcionalmente un nuevo `image`

## Prueba frontend
1. Ir a modulo Productos.
2. Crear producto con archivo en "Imagen del producto".
3. Ver preview local antes de guardar.
4. Guardar y validar thumbnail en grid/tabla.
5. Editar producto sin cambiar imagen y confirmar que se conserva.
6. Editar producto cambiando imagen y confirmar nueva URL.

## Bot WhatsApp
- Se reforzo `CRM_GET_PRODUCTS` para priorizar lista interactiva de categorias activas.
- Si no hay categorias activas, usa fallback a lista de productos.
- Las respuestas de productos ahora incluyen `Imagen: <url>` cuando existe `imageUrl`.
- Se acepta input interactivo (`list_reply`/`button_reply`) y se prioriza `interactiveReplyId` para mantener el contexto de seleccion.
- La seleccion `product:<id>` y `category:<id>` se resuelve de forma deterministica desde backend.

## Limitaciones actuales
- Aun no esta implementado envio nativo de mensaje tipo imagen de WhatsApp (`type: image`).
- El envio de imagen + caption real por Meta sigue pendiente; hoy se usa texto + URL segura como fallback.
- Paginacion conversacional de catalogo: pendiente.
