# AI Multi-Provider Roadmap

## Estado Actual (2026-05-08)
- Arquitectura multi-provider de IA implementada en backend.
- Provider primario actual de pruebas: **Groq**.
- Provider soportado/premium y fallback por configuracion: **OpenAI**.
- Provider local futuro (no configurado ni probado en esta fase): **Ollama**.

## Por que se implemento
- Las pruebas conversacionales quedaron limitadas por cuota OpenAI API (`429 insufficient_quota`).
- Se requirio continuidad operativa sin bloquear WhatsApp, onboarding ni tools CRM.
- ChatGPT Plus no cubre creditos de API backend.

## Implementacion realizada
- Se mantuvo el contrato `AIService` para no romper capas superiores.
- Se agrego una capa de providers bajo `infrastructure/ai/providers`.
- Se habilito seleccion por entorno:
  - `AI_PROVIDER_PRIMARY`
  - `AI_PROVIDER_FALLBACK`
  - `AI_PROVIDER_TIMEOUT_MS`
  - `AI_PROVIDER_MAX_RETRIES`
  - `AI_JSON_STRICT`
- Se implemento fallback tecnico controlado:
  - aplica para timeout, 429, 5xx, provider no disponible,
  - no aplica por error de negocio.
- Se mantiene salida canonica unica:
  - `reply`
  - `action?`
- Se agrego validacion/normalizacion minima de JSON y logs por provider.

## Estrategia vigente de providers
1. **Groq**
   - principal para pruebas conversacionales actuales.
   - objetivo: velocidad/costo y continuidad de validacion.
2. **OpenAI**
   - premium y fallback configurable.
   - objetivo: estabilidad y compatibilidad operativa.
3. **Ollama** (fase posterior)
   - local/offline.
   - se evaluara despues de cerrar fase actual con Groq/OpenAI.

## Alcance fuera de esta fase
- No se realizara configuracion operativa de Ollama en esta etapa.
- No se modificara onboarding conversacional en esta etapa.
- No se modificaran tools de productos en esta etapa (solo roadmap de mejora).

## Roadmap tecnico actualizado

### Fase 1 (completada)
1. Implementar multi-provider manteniendo arquitectura hexagonal.
2. Integrar Groq como alternativo principal.
3. Mantener OpenAI soportado como premium/fallback.
4. Incorporar validacion JSON y fallback tecnico.

### Fase 2 (prioridad backend)
1. Evolucionar modelo de productos con **categorias**.
2. Evaluar y crear migracion para tabla de categorias y relacion con productos.
3. Implementar tools de categorias y mejora de tools de productos:
   - busqueda por categoria,
   - listado por categoria,
   - destacados por categoria,
   - stock por categoria,
   - filtros combinados (precio/categoria/nombre).
4. Mantener aislamiento multi-tenant estricto por `companyId`.

### Fase 3 (UX canal WhatsApp)
1. Mejorar presentacion de catalogo en WhatsApp.
2. Evaluar listas interactivas para productos.
3. Aplicar enfoque de listas para categorias.
4. Mantener respuestas cortas, claras y adaptadas al canal.

### Fase 4 (imagenes de productos)
1. Integrar proveedor externo de imagenes (ej. Cloudinary).
2. Permitir carga de fotos y asociacion por URL segura.
3. Mantener desacople via adaptador en `infrastructure/external-services` (o modulo equivalente).
4. Evitar dependencia fuerte de un proveedor unico de imagenes.

### Fase 5 (frontend sincronizado)
1. Ajustar formularios de productos para categoria.
2. Ajustar listados para visualizar categoria.
3. Crear/ajustar vistas de administracion de categorias.
4. Preparar UI para imagenes de productos.
5. Sincronizar UI con cambios backend de forma incremental.

### Fase 6 (modulo proveedores - posterior)
1. Implementar modulo de proveedores.
2. Permitir crear/editar/listar proveedores desde frontend.
3. Asociar productos a proveedor.
4. Evaluar migracion futura de `suppliers` + relacion producto-proveedor.
5. Mantener soporte multi-tenant por `companyId`.

## Riesgos y decisiones pendientes
- Definir nivel de tolerancia a inconsistencias JSON por modelo en Groq.
- Definir politica de timeouts/retries por entorno (dev/staging/prod).
- Validar capacidad local real antes de habilitar Ollama en pruebas funcionales.
- Confirmar modelo de categorias (1 producto -> 1 categoria vs N categorias).
- Definir contrato UX de listas interactivas WhatsApp sin romper fallback de texto plano.
