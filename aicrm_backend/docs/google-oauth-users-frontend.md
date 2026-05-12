# Google OAuth Users/Frontend (Fase 1)

## Alcance
- Solo usuarios internos (`users`) del frontend.
- No aplica a `customers` ni WhatsApp en esta fase.
- Login email/password se mantiene activo.
- OAuth Google es metodo adicional, no reemplazo.

## Flujo implementado
1. Frontend envia al usuario a `GET /api/v1/auth/google/start`.
2. Backend genera `state` temporal one-time y redirige a Google.
3. Google devuelve callback a `GET /api/v1/auth/google/callback`.
4. Backend valida `state`, valida perfil OIDC (`openid email profile`), resuelve/vincula user.
5. Backend emite `auth_code` temporal one-time y redirige a frontend success URL.
6. Frontend llama `POST /api/v1/auth/google/exchange` con `auth_code`.
7. Backend responde JWT propio (igual contrato de login normal).

## Estado validado (2026-05-12)
- OAuth frontend operativo end-to-end para acceso de usuarios internos.
- Se corrige incompatibilidad de payload en exchange:
  - frontend podia enviar `authCode`,
  - backend esperaba `code`,
  - backend ahora acepta ambos (`authCode` o `code`) por compatibilidad.
- Se agregan logs controlados de trazabilidad:
  - `[GoogleOAuth][Start]`
  - `[GoogleOAuth][Callback]`
  - `[GoogleOAuth][Exchange]`
  - `[GoogleOAuth][FrontendStart]`
  - `[GoogleOAuth][FrontendSuccess]`
  - `[GoogleOAuth][FrontendFailure]`

## Endpoints
- `GET /api/v1/auth/google/start`
- `GET /api/v1/auth/google/callback`
- `POST /api/v1/auth/google/exchange`

## Persistencia
Tabla nueva: `oauth_identities`
- No guarda `access_token` ni `refresh_token`.
- Solo vinculo de identidad y perfil basico.

## Reglas de vinculacion
- Si existe `(provider, provider_user_id)`: login directo con user vinculado.
- Si no existe y `email_verified=true`:
  - si existe user por email, vincula identidad.
  - si no existe user, crea empresa + user admin basico y vincula.
- Si `email_verified=false`: se rechaza.

## Seguridad
- `state` temporal con TTL (`OAUTH_STATE_TTL_MINUTES`) y consumo one-time.
- `auth_code` temporal one-time para evitar exponer JWT en URL.
- No se exponen secretos/tokens completos en logs.

## Variables requeridas
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_CALLBACK_URL`
- `GOOGLE_OAUTH_SUCCESS_REDIRECT_URL`
- `GOOGLE_OAUTH_FAILURE_REDIRECT_URL`
- `GOOGLE_OAUTH_STATE_SECRET`
- `OAUTH_STATE_TTL_MINUTES`

## Scopes usados (fase actual)
- `openid`
- `email`
- `profile`

## Limitaciones actuales conocidas
1. Para usuario Google nuevo aun no existe flujo guiado de "completar registro" en frontend.
2. El registro Google no solicita en el mismo paso:
   - nombre de empresa,
   - tipo de identificacion real (`NIT`/`CC`),
   - numero de identificacion.
3. El tipo de identificacion queda tecnico (`GOOGLE`) en creacion automatica inicial.
4. UX de errores OAuth aun puede mejorar.

## Pendientes priorizados (siguiente fase OAuth Users)
1. Implementar respuesta `registration_required` para usuario Google nuevo.
2. Crear pantalla frontend de completar registro con:
   - nombre de empresa,
   - tipo de identificacion (`NIT`/`CC`),
   - numero de identificacion.
3. Emitir JWT solo al completar registro requerido.
4. Mantener login normal email/password como fallback.

## Siguiente fase (no implementada)
- OAuth Google para `customers` via WhatsApp como opcion adicional de onboarding:
  - link seguro con state/token temporal,
  - vinculacion por `companyId/customerId/conversationId/wa_id`,
  - onboarding manual como fallback.
