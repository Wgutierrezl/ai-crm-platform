import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import type { AxiosError } from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle } from "lucide-react";
import { logger } from "../../utils/logger/logger";
import { authService } from "../../api/services/auth.service";
import { authStorage } from "../../utils/storage/authStorage";

const GOOGLE_REGISTRATION_DRAFT_KEY = "google_oauth_registration_draft";

type RegistrationDraft = {
  registrationToken: string;
  email: string | null;
};

export default function GoogleCompleteRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const [companyName, setCompanyName] = useState("");
  const [identificationType, setIdentificationType] = useState<"CC" | "NIT" | "">("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const draft = useMemo<RegistrationDraft | null>(() => {
    const locationDraft = (location.state as { oauthRegistration?: RegistrationDraft } | null)
      ?.oauthRegistration;
    if (locationDraft?.registrationToken) {
      return locationDraft;
    }
    const stored = sessionStorage.getItem(GOOGLE_REGISTRATION_DRAFT_KEY);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as RegistrationDraft;
      if (!parsed?.registrationToken) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [location.state]);

  useEffect(() => {
    logger.info("[GoogleOAuth][FrontendCompleteRegistration] mount", {
      hasDraft: Boolean(draft),
      hasSession: authStorage.hasSession(),
      path: window.location.pathname,
    });
    if (authStorage.hasSession()) {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (!draft) {
      navigate("/login", { replace: true });
    }
  }, [draft, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!draft) {
      navigate("/login", { replace: true });
      return;
    }
    if (!companyName.trim() || !identificationType || !identificationNumber.trim()) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const authData = await authService.completeGoogleRegistration({
        registrationToken: draft.registrationToken,
        companyName: companyName.trim(),
        identificationType,
        identificationNumber: identificationNumber.trim(),
      });
      authStorage.setAuthData({
        token: authData.accessToken,
        userId: authData.userId,
        companyId: authData.companyId,
        role: authData.role,
      });
      sessionStorage.removeItem(GOOGLE_REGISTRATION_DRAFT_KEY);
      logger.info("[GoogleOAuth][FrontendCompleteRegistration] navigation result", {
        target: "/dashboard",
        userId: authData.userId,
      });
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string | string[] }>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message;
      const parsedMessage = Array.isArray(message) ? message.join(", ") : message;
      const finalMessage = parsedMessage || "No fue posible completar el registro con Google.";
      logger.error("[GoogleOAuth][FrontendCompleteRegistration] submit error", {
        status,
        message: finalMessage,
        error: err,
      });
      setError(finalMessage);
      if (status === 401) {
        sessionStorage.removeItem(GOOGLE_REGISTRATION_DRAFT_KEY);
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Completa tu registro con Google</CardTitle>
          <CardDescription>
            Solo necesitamos los datos de tu empresa para activar tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label>Email de Google</Label>
              <Input value={draft?.email ?? "No disponible"} readOnly disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de empresa *</Label>
              <Input
                id="companyName"
                placeholder="Mi Empresa S.A.S"
                value={companyName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de identificación *</Label>
              <Select
                value={identificationType}
                onValueChange={(value: "CC" | "NIT") => setIdentificationType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NIT">NIT</SelectItem>
                  <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identificationNumber">Número de identificación *</Label>
              <Input
                id="identificationNumber"
                placeholder="901234567"
                value={identificationNumber}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setIdentificationNumber(e.target.value)
                }
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !draft}>
              {loading ? "Completando registro..." : "Finalizar registro"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/login", { replace: true })}
            >
              Volver a login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

