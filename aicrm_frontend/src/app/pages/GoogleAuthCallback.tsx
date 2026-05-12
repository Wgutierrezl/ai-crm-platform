import { useEffect, useId, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { authService } from "../../api/services/auth.service";
import { logger } from "../../utils/logger/logger";
import { authStorage } from "../../utils/storage/authStorage";
import { Button } from "../components/ui/button";

type OAuthStatus = "loading" | "missing_code" | "success" | "error";

const processedCodes = new Set<string>();
const inFlightCodes = new Set<string>();
const GOOGLE_REGISTRATION_DRAFT_KEY = "google_oauth_registration_draft";

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<OAuthStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const instanceId = useId();
  const renderCountRef = useRef(0);
  const effectCountRef = useRef(0);
  const attemptCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;
    logger.info("[GoogleOAuth][FrontendSuccess] render", {
      instanceId,
      renderCount: renderCountRef.current,
      path: window.location.pathname,
      search: window.location.search,
    });
  });

  useEffect(() => {
    const stableInstanceId = instanceId;
    logger.info("[GoogleOAuth][FrontendSuccess] mount", {
      instanceId: stableInstanceId,
      path: window.location.pathname,
      search: window.location.search,
    });
    const run = async () => {
      effectCountRef.current += 1;
      const code = params.get("code");
      logger.info("[GoogleOAuth][FrontendSuccess] useEffect trigger", {
        instanceId: stableInstanceId,
        effectCount: effectCountRef.current,
        hasCode: Boolean(code),
        codeMasked: code ? `${code.slice(0, 4)}...${code.slice(-4)}` : "empty",
      });
      if (!code) {
        logger.warn("[GoogleOAuth][FrontendSuccess] missing code in query");
        setStatus("missing_code");
        return;
      }

      if (processedCodes.has(code)) {
        logger.warn("[GoogleOAuth][FrontendSuccess] skip duplicate already processed code", {
          instanceId: stableInstanceId,
          codeMasked: `${code.slice(0, 4)}...${code.slice(-4)}`,
        });
        return;
      }
      if (inFlightCodes.has(code)) {
        logger.warn("[GoogleOAuth][FrontendSuccess] skip duplicate in-flight code", {
          instanceId: stableInstanceId,
          codeMasked: `${code.slice(0, 4)}...${code.slice(-4)}`,
        });
        return;
      }

      inFlightCodes.add(code);
      attemptCountRef.current += 1;
      try {
        logger.info("[GoogleOAuth][FrontendSuccess] exchange attempt", {
          instanceId: stableInstanceId,
          exchangeAttempt: attemptCountRef.current,
          payload: { authCode: `${code.slice(0, 4)}...${code.slice(-4)}` },
        });
        const response = await authService.exchangeGoogleAuthCode(code);
        logger.info("[GoogleOAuth][FrontendSuccess] exchange response received", {
          instanceId: stableInstanceId,
          responseStatus: "success",
          responseBody: response,
        });
        processedCodes.add(code);

        if (response.status === "authenticated") {
          authStorage.setAuthData({
            token: response.accessToken,
            userId: response.userId,
            companyId: response.companyId,
            role: response.role,
          });
          setStatus("success");
          window.history.replaceState({}, document.title, window.location.pathname);
          logger.info("[GoogleOAuth][FrontendSuccess] navigation result", {
            instanceId: stableInstanceId,
            target: "/dashboard",
            reason: "authenticated",
          });
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 700);
          return;
        }

        if (response.status === "registration_required") {
          sessionStorage.setItem(
            GOOGLE_REGISTRATION_DRAFT_KEY,
            JSON.stringify({
              registrationToken: response.registrationToken,
              email: response.email ?? null,
            }),
          );
          window.history.replaceState({}, document.title, window.location.pathname);
          logger.info("[GoogleOAuth][FrontendSuccess] navigation result", {
            instanceId: stableInstanceId,
            target: "/auth/google/complete-registration",
            reason: "registration_required",
            registrationTokenMasked: response.registrationToken
              ? `${response.registrationToken.slice(0, 4)}...${response.registrationToken.slice(-4)}`
              : "empty",
          });
          navigate("/auth/google/complete-registration", {
            replace: true,
            state: {
              oauthRegistration: {
                registrationToken: response.registrationToken,
                email: response.email ?? null,
              },
            },
          });
          return;
        }
      } catch (error) {
        logger.error("[GoogleOAuth][FrontendSuccess] exchange error", {
          instanceId: stableInstanceId,
          responseStatus: "error",
          error,
        });
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "No fue posible completar el acceso con Google.",
        );
      } finally {
        inFlightCodes.delete(code);
      }
    };
    void run();
    return () => {
      logger.info("[GoogleOAuth][FrontendSuccess] unmount", {
        instanceId: stableInstanceId,
        renderCount: renderCountRef.current,
        effectCount: effectCountRef.current,
      });
    };
  }, [instanceId, navigate, params]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 text-center space-y-3">
        {status === "loading" && <p>Validando autenticación con Google...</p>}
        {status === "success" && <p>Acceso con Google validado. Redirigiendo...</p>}
        {status === "missing_code" && (
          <>
            <p>No recibimos el código de autorización.</p>
            <Button onClick={() => navigate("/login", { replace: true })}>Volver a login</Button>
          </>
        )}
        {status === "error" && (
          <>
            <p>No fue posible completar el acceso con Google.</p>
            {errorMessage ? <p className="text-sm text-muted-foreground">{errorMessage}</p> : null}
            <Button onClick={() => navigate("/login", { replace: true })}>Volver a login</Button>
          </>
        )}
      </div>
    </div>
  );
}
