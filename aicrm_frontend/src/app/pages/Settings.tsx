import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Save, User } from "lucide-react";
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
};

const initialForm: SettingsForm = {
  companyName: "",
  assistantName: "",
  assistantWelcomeMessage: "",
  assistantContext: "",
};

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        });
        setInitialLoadedForm({
          companyName: settings.companyName,
          assistantName: settings.assistantName ?? "",
          assistantWelcomeMessage: settings.assistantWelcomeMessage ?? "",
          assistantContext: settings.assistantContext ?? "",
        });
      } catch {
        setLoadError("No fue posible cargar la configuración de empresa.");
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
      form.assistantContext !== initialLoadedForm.assistantContext
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
      });

      setForm((prev) => ({
        ...prev,
        assistantName: updated.assistantName ?? "",
        assistantWelcomeMessage: updated.assistantWelcomeMessage ?? "",
        assistantContext: updated.assistantContext ?? "",
      }));
      setInitialLoadedForm((prev) => ({
        ...prev,
        assistantName: updated.assistantName ?? "",
        assistantWelcomeMessage: updated.assistantWelcomeMessage ?? "",
        assistantContext: updated.assistantContext ?? "",
      }));
      toast.success("Configuración del asistente guardada");
    } catch {
      toast.error("No fue posible guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    toast.success("Sesión cerrada correctamente");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          Configuración
        </h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Cargando configuración...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Personaliza cómo tu asistente atiende a tus clientes.
        </p>
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
              <CardDescription>
                Datos generales usados para contextualizar al asistente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la empresa</Label>
                <Input id="companyName" value={form.companyName} disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asistente Comercial</CardTitle>
              <CardDescription>
                Define nombre, bienvenida y contexto para respuestas más alineadas a tu negocio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assistantName">Nombre del asistente</Label>
                <Input
                  id="assistantName"
                  placeholder="Ej: Sofía"
                  value={form.assistantName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField("assistantName", e.target.value)
                  }
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
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    updateField("assistantContext", e.target.value)
                  }
                />
              </div>

              <Button onClick={handleSaveAssistant} disabled={saving || !hasChanges}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar configuración"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad de la Cuenta</CardTitle>
              <CardDescription>
                Información de sesión y salida segura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Sesión activa</p>
                    <p className="text-sm text-muted-foreground">
                      {authData
                        ? `Usuario ${authData.userId.slice(0, 8)} · Empresa ${authData.companyId.slice(0, 8)}`
                        : "Sin sesión activa"}
                    </p>
                  </div>
                </div>
              </div>

              <Button variant="destructive" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
