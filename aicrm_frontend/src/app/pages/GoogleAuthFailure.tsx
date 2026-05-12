import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { logger } from "../../utils/logger/logger";

export default function GoogleAuthFailure() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reason = params.get("reason");
  useEffect(() => {
    logger.warn("[GoogleOAuth][FrontendFailure] page entered", {
      path: window.location.pathname,
      reason,
    });
  }, [reason]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 text-center space-y-3">
        <p>No fue posible iniciar sesión con Google.</p>
        {reason ? (
          <p className="text-sm text-muted-foreground">Detalle: {reason}</p>
        ) : null}
        <Button onClick={() => navigate("/login", { replace: true })}>Volver a login</Button>
      </div>
    </div>
  );
}
