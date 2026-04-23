import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Label } from "../components/ui/label.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx";
import { Alert, AlertDescription } from "../components/ui/alert.tsx";
import { AlertCircle } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
    identificationType: "",
    identificationNumber: "",
    fullName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (formData.companyName && formData.email && formData.password && formData.identificationType && formData.identificationNumber) {
        navigate("/login");
      } else {
        setError("Por favor, completa todos los campos obligatorios");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4">
            <h1 className="text-3xl text-primary mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              CRM AI
            </h1>
          </div>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>
            Regístrate para empezar a vender con inteligencia artificial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de empresa *</Label>
              <Input
                id="companyName"
                placeholder="Mi Empresa S.A."
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="identificationType">Tipo de identificación *</Label>
              <Select
                value={formData.identificationType}
                onValueChange={(value) => setFormData({ ...formData, identificationType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nit">NIT</SelectItem>
                  <SelectItem value="cc">Cédula de Ciudadanía</SelectItem>
                  <SelectItem value="ce">Cédula de Extranjería</SelectItem>
                  <SelectItem value="passport">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identificationNumber">Número de identificación *</Label>
              <Input
                id="identificationNumber"
                placeholder="123456789"
                value={formData.identificationNumber}
                onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo (opcional)</Label>
              <Input
                id="fullName"
                placeholder="Juan Pérez"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Inicia sesión aquí
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
