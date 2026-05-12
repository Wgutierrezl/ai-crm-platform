# Google OAuth Users/Frontend (Fase 1)

## Alcance
- Solo usuarios internos (`users`) del frontend.
- No aplica a `customers` ni WhatsApp en esta fase.
- Login email/password se mantiene activo.
- OAuth Google es metodo adicional, no reemplazo.

## Flujo implementado (Fase 1 actual)
1. Frontend envia al usuario a `GET /api/v1/auth/google/start`.
2. Backend genera `state` temporal one-time y redirige a Google.
3. Google devuelve callback a `GET /api/v1/auth/google/callback`.
4. Backend valida `state`, valida perfil OIDC (`openid email profile`), resuelve/vincula user.
5. Si el usuario Google ya existe (identidad o email interno): backend emite `auth_code` de autenticacion normal.
6. Si el usuario Google es nuevo y `email_verified=true`:
   - backend crea `oauth_registration_session` temporal one-time con TTL,
   - backend emite `auth_code` de tipo `registration_required`.
7. Frontend llama `POST /api/v1/auth/google/exchange` con `auth_code`.
8. Backend responde:
   - `status=authenticated` + JWT (existente), o
   - `status=registration_required` + `registrationToken` (nuevo).
9. Frontend navega a `/auth/google/complete-registration` (pantalla dedicada OAuth, no registro normal).
10. Frontend llama `POST /api/v1/auth/google/complete-registration` con datos obligatorios.
11. La pantalla solo solicita:
   - `companyName`
   - `identificationType` (`CC` | `NIT`)
   - `identificationNumber`
   y muestra email Google solo como informativo/readonly.
12. No solicita:
   - password
   - email editable
   - fullName obligatorio
13. Backend crea `company + user admin + oauth_identity`, consume token y emite JWT final.

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

## Endpoints actuales
- `GET /api/v1/auth/google/start`
- `GET /api/v1/auth/google/callback`
- `POST /api/v1/auth/google/exchange`
- `POST /api/v1/auth/google/complete-registration`

## Persistencia actual
Tabla: `oauth_identities`
- No guarda `access_token` ni `refresh_token`.
- Solo vinculo de identidad y perfil basico.
- Actualmente esta modelada para `users` (FK obligatoria a `users.id`).

Tabla: `oauth_registration_sessions`
- Sesion temporal de registro para usuario Google nuevo.
- Soporta TTL, estado y consumo one-time.

## Problema actual detectado
Cuando Google trae un usuario nuevo (`email_verified=true` y sin cuenta previa):
- el backend crea el usuario interno inmediatamente,
- usa datos tecnicos (`identificationType=GOOGLE`, `identificationNumber=GOOGLE-...`),
- no fuerza captura de datos obligatorios del negocio antes de emitir JWT final.

Esto produce alta friccion posterior en CRM y registros empresariales incompletos.

## Contratos de respuesta relevantes
- `POST /auth/google/exchange`:
  - existente: `{ status: "authenticated", accessToken, userId, companyId, role }`
  - nuevo: `{ status: "registration_required", registrationToken, email }`
- `POST /auth/google/complete-registration`:
  - `{ accessToken, userId, companyId, role }`

### Contrato sugerido de exchange
- Usuario existente:
  - `{ status: "authenticated", accessToken, userId, companyId, role }`
- Usuario nuevo:
  - `{ status: "registration_required", registrationToken, email, fullName, expiresAt }`

## Seguridad (OAuth Users)
- `state` y `registrationToken` con TTL corto y one-time use.
- No JWT en URL.
- No guardar access/refresh token Google.
- Revalidar `email_verified=true` en callback.
- No loguear tokens completos.
- Expirar y consumir sesion al completar registro.

## Restriccion de alcance
- Esta fase no implementa OAuth para `customers`/WhatsApp.
- Ver `docs/google-oauth-whatsapp-customers-roadmap.md` para fases posteriores.

## Regla de identificacion (users OAuth)
- `users.identificationType` solo puede quedar con valor de negocio (`CC` o `NIT`) en flujo OAuth de alta nueva.
- `users.identificationNumber` debe venir del formulario de completar registro.
- `provider_user_id/sub` de Google solo se guarda en `oauth_identities.provider_user_id`.
- No se debe guardar `GOOGLE` ni `GOOGLE-<sub>` en campos de identificacion de `users`.

## Nota legacy (dev/test)
- Si existen registros locales antiguos con:
  - `identificationType=GOOGLE`
  - `identificationNumber=GOOGLE-...`
  corresponden a datos legacy de pruebas previas.
- En esta iteracion no se crea migracion de limpieza productiva; la limpieza se recomienda manual en entorno local/test.
