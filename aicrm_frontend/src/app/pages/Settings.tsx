import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ImageUp, Save, User } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Label } from "../components/ui/label.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx";
import { Textarea } from "../components/ui/textarea.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { authService } from "../../api/services/auth.service";
import { companySettingsService } from "../../api/services/company-settings.service";
import { authStorage } from "../../utils/storage/authStorage";

type SettingsForm = {
  companyName: string;
  assistantName: string;
  assistantWelcomeMessage: string;
  assistantContext: string;
  logoUrl: string;
};

const initialForm: SettingsForm = {
  companyName: "",
  assistantName: "",
  assistantWelcomeMessage: "",
  assistantContext: "",
  logoUrl: "",
};

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<SettingsForm>(initialForm);
  const [initialLoadedForm, setInitialLoadedForm] = useState<SettingsForm>(initialForm);
  const authData = authStorage.getAuthData();

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const settings = await companySettingsService.getSettings();
        setForm({
          companyName: settings.companyName,
          assistantName: settings.assistantName ?? "",
          assistantWelcomeMessage: settings.assistantWelcomeMessage ?? "",
          assistantContext: settings.assistantContext ?? "",
          logoUrl: settings.logoUrl ?? "",
        });
        setInitialLoadedForm({
          companyName: settings.companyName,
          assistantName: settings.assistantName ?? "",
          assistantWelcomeMessage: settings.assistantWelcomeMessage ?? "",
          assistantContext: settings.assistantContext ?? "",
          logoUrl: settings.logoUrl ?? "",
        });
      } catch {
        setLoadError("No fue posible cargar la configuracion de empresa.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const hasChanges = useMemo(() => {
    return (
      form.assistantName !== initialLoadedForm.assistantName ||
      form.assistantWelcomeMessage !== initialLoadedForm.assistantWelcomeMessage ||
      form.assistantContext !== initialLoadedForm.assistantContext ||
      form.logoUrl !== initialLoadedForm.logoUrl
    );
  }, [form, initialLoadedForm]);

  const updateField = (field: keyof SettingsForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAssistant = async () => {
    setSaving(true);
    try {
      const updated = await companySettingsService.updateSettings({
        assistantName: form.assistantName.trim() || null,
        assistantWelcomeMessage: form.assistantWelcomeMessage.trim() || null,
        assistantContext: form.assistantContext.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
      });

      setForm((prev) => ({
        ...prev,
        assistantName: updated.assistantName ?? "",
        assistantWelcomeMessage: updated.assistantWelcomeMessage ?? "",
        assistantContext: updated.assistantContext ?? "",
        logoUrl: updated.logoUrl ?? "",
      }));
      setInitialLoadedForm((prev) => ({
        ...prev,
        assistantName: updated.assistantName ?? "",
        assistantWelcomeMessage: updated.assistantWelcomeMessage ?? "",
        assistantContext: updated.assistantContext ?? "",
        logoUrl: updated.logoUrl ?? "",
      }));
      toast.success("Configuracion del asistente guardada");
    } catch {
      toast.error("No fue posible guardar la configuracion");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "image/svg+xml",
    ];

    if (!allowed.includes(file.type)) {
      toast.error("Formato de logo no permitido. Usa JPG, PNG, WEBP, GIF, AVIF o SVG.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El logo supera el tamano maximo de 5 MB.");
      return;
    }

    setUploadingLogo(true);
    try {
      const updated = await companySettingsService.uploadCompanyLogo(file);
      setForm((prev) => ({ ...prev, logoUrl: updated.logoUrl ?? "" }));
      setInitialLoadedForm((prev) => ({ ...prev, logoUrl: updated.logoUrl ?? "" }));
      toast.success("Logo corporativo actualizado");
    } catch {
      toast.error("No fue posible subir el logo corporativo");
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  };

  const handleLogout = () => {
    authService.logout();
    toast.success("Sesion cerrada correctamente");
    navigate("/login");
  };

  const companyInitials = (form.companyName || "CRM")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          Configuracion
        </h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Cargando configuracion...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Configuracion
        </h1>
        <p className="text-muted-foreground">Personaliza como tu asistente atiende a tus clientes.</p>
      </div>

      {loadError ? (
        <Card className="border-destructive/40">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{loadError}</p>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="assistant" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assistant">Asistente</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="assistant" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Perfil de la Empresa</CardTitle>
              <CardDescription>Datos generales usados para contextualizar al asistente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la empresa</Label>
                <Input id="companyName" value={form.companyName} disabled />
              </div>

              <div className="space-y-3">
                <Label htmlFor="companyLogo">Logo corporativo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo empresa" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-xs text-muted-foreground text-center px-1">
                        {companyInitials || "LOGO"}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <Input
                      id="companyLogo"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
                      onChange={handleLogoInputChange}
                      disabled={uploadingLogo}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recomendado: PNG o SVG horizontal. Maximo 5 MB.
                    </p>
                    {uploadingLogo ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ImageUp className="w-3 h-3" /> Subiendo logo...
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asistente Comercial</CardTitle>
              <CardDescription>
                Define nombre, bienvenida y contexto para respuestas mas alineadas a tu negocio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assistantName">Nombre del asistente</Label>
                <Input
                  id="assistantName"
                  placeholder="Ej: Sofia"
                  value={form.assistantName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("assistantName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assistantWelcomeMessage">Mensaje de bienvenida</Label>
                <Textarea
                  id="assistantWelcomeMessage"
                  rows={4}
                  placeholder="Ej: Hola {{customerName}}, soy {{assistantName}}. Te ayudo con tu compra."
                  value={form.assistantWelcomeMessage}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    updateField("assistantWelcomeMessage", e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Puedes usar placeholders: {"{{customerName}}"}, {"{{assistantName}}"}, {"{{companyName}}"}.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assistantContext">Contexto de la empresa e instrucciones comerciales</Label>
                <Textarea
                  id="assistantContext"
                  rows={6}
                  placeholder="Ej: Somos una tienda B2B. Prioriza respuestas claras, tono cercano y enfoque en cierre comercial."
                  value={form.assistantContext}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateField("assistantContext", e.target.value)}
                />
              </div>

              <Button onClick={handleSaveAssistant} disabled={saving || !hasChanges}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar configuracion"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad de la Cuenta</CardTitle>
              <CardDescription>Informacion de sesion y salida segura.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Sesion activa</p>
                    <p className="text-sm text-muted-foreground">
                      {authData
                        ? `Usuario ${authData.userId.slice(0, 8)} · Empresa ${authData.companyId.slice(0, 8)}`
                        : "Sin sesion activa"}
                    </p>
                  </div>
                </div>
              </div>

              <Button variant="destructive" onClick={handleLogout}>
                Cerrar sesion
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
