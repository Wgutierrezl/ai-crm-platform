import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { authService } from "../../api/services/auth.service";
import { logger } from "../../utils/logger/logger";
import { Button } from "../components/ui/button";

type OAuthStatus = "loading" | "missing_code" | "success" | "error";

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<OAuthStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    logger.info("[GoogleOAuth][FrontendSuccess] page entered", {
      path: window.location.pathname,
      search: window.location.search,
    });
    const run = async () => {
      const code = params.get("code");
      logger.info("[GoogleOAuth][FrontendSuccess] query parsed", {
        hasCode: Boolean(code),
        codeMasked: code ? `${code.slice(0, 4)}...${code.slice(-4)}` : "empty",
      });
      if (!code) {
        logger.warn("[GoogleOAuth][FrontendSuccess] missing code in query");
        setStatus("missing_code");
        return;
      }
      try {
        logger.info("[GoogleOAuth][FrontendSuccess] sending exchange request", {
          payloadShape: ["authCode", "code"],
        });
        await authService.exchangeGoogleAuthCode(code);
        setStatus("success");
        logger.info("[GoogleOAuth][FrontendSuccess] exchange successful");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 700);
      } catch (error) {
        logger.error("[GoogleOAuth][FrontendSuccess] exchange error", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "No fue posible completar el acceso con Google.",
        );
      }
    };
    void run();
  }, [navigate, params]);

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
