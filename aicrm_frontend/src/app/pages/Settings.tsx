import { useState, type ChangeEvent } from "react";
import { Save, Plus, Trash2, User } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Label } from "../components/ui/label.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Textarea } from "../components/ui/textarea.tsx";
import { toast } from "sonner";

const mockUsers = [
  { id: 1, name: "Juan Pérez", email: "juan.perez@miempresa.com", role: "admin" },
  { id: 2, name: "Ana García", email: "ana.garcia@miempresa.com", role: "agent" },
  { id: 3, name: "Carlos López", email: "carlos.lopez@miempresa.com", role: "agent" },
];

export default function Settings() {
  const [companyData, setCompanyData] = useState({
    name: "Mi Empresa S.A.",
    primaryColor: "#0EA5A4",
  });

  const [salesPrompt, setSalesPrompt] = useState(
    "Actúa como un asistente de ventas profesional y amigable. Ayuda a los clientes a encontrar productos, responde sus preguntas y facilita la creación de órdenes."
  );

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleSaveCompany = () => {
    toast.success("Configuración de empresa guardada");
  };

  const handleSavePrompt = () => {
    toast.success("Configuración de prompts guardada");
  };

  const handleChangePassword = () => {
    if (password.new !== password.confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    toast.success("Contraseña actualizada exitosamente");
    setPassword({ current: "", new: "", confirm: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Configuración
        </h1>
        <p className="text-muted-foreground">Gestiona la configuración de tu empresa</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="prompts">Prompts IA</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>
                Configura los datos básicos de tu empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input
                  id="companyName"
                  value={companyData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setCompanyData({ ...companyData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryColor">Color Primario</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={companyData.primaryColor}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setCompanyData({ ...companyData, primaryColor: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={companyData.primaryColor}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setCompanyData({ ...companyData, primaryColor: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo de la Empresa</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Arrastra tu logo aquí o haz clic para seleccionar
                  </p>
                  <Button variant="outline" className="mt-4">
                    Seleccionar Archivo
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveCompany}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuarios Internos</CardTitle>
                  <CardDescription>
                    Gestiona los usuarios de tu equipo
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Invitar Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "Admin" : "Agente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Prompts de Ventas</CardTitle>
              <CardDescription>
                Personaliza cómo la IA interactúa con tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salesPrompt">Prompt del Bot de Ventas</Label>
                <Textarea
                  id="salesPrompt"
                  value={salesPrompt}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSalesPrompt(e.target.value)}
                  rows={6}
                  placeholder="Define cómo debe comportarse el bot de ventas..."
                />
                <p className="text-xs text-muted-foreground">
                  Este prompt define el comportamiento y personalidad del asistente IA
                </p>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium mb-2">Acciones Disponibles</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• GET_PRODUCTS - Consultar catálogo de productos</li>
                  <li>• CREATE_CUSTOMER - Crear nuevo cliente</li>
                  <li>• CREATE_ORDER - Generar orden de compra</li>
                </ul>
              </div>

              <Button onClick={handleSavePrompt}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad de la Cuenta</CardTitle>
              <CardDescription>
                Gestiona la seguridad de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Sesión Activa</p>
                    <p className="text-sm text-muted-foreground">
                      Token JWT válido hasta: 2026-04-23 14:30
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={password.current}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPassword({ ...password, current: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={password.new}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword({ ...password, new: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={password.confirm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPassword({ ...password, confirm: e.target.value })
                  }
                />
              </div>

              <Button onClick={handleChangePassword}>
                <Save className="w-4 h-4 mr-2" />
                Cambiar Contraseña
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
