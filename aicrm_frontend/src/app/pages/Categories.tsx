import { useEffect, useMemo, useState } from "react";
import { Plus, Tags, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { categoryService } from "../../api/services/category.service";
import type { CategoryDto } from "../../api/dtos/category.dto";
import { Button } from "../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Input } from "../components/ui/input.tsx";
import { Label } from "../components/ui/label.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Textarea } from "../components/ui/textarea.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog.tsx";

type CategoryFormState = {
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
};

const initialForm: CategoryFormState = {
  name: "",
  description: "",
  slug: "",
  isActive: true,
};

export default function Categories() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryFormState>(initialForm);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const activeCount = useMemo(
    () => categories.filter((category) => category.isActive).length,
    [categories],
  );

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch {
      toast.error("No se pudieron cargar las categorias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadCategories();
    });
  }, []);

  function openCreateDialog() {
    setFormData(initialForm);
    setIsDialogOpen(true);
  }

  async function handleCreateCategory() {
    if (!formData.name.trim()) {
      toast.error("El nombre de la categoria es obligatorio");
      return;
    }

    try {
      setSaving(true);
      const created = await categoryService.createCategory({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        slug: formData.slug.trim() || undefined,
        isActive: formData.isActive,
      });
      setCategories((prev) => [created, ...prev]);
      setIsDialogOpen(false);
      toast.success("Categoria creada exitosamente");
    } catch {
      toast.error("No se pudo crear la categoria");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCategory(category: CategoryDto) {
    try {
      setTogglingId(category.id);
      const updated = await categoryService.updateCategoryStatus(
        category.id,
        !category.isActive,
      );
      setCategories((prev) =>
        prev.map((item) => (item.id === category.id ? updated : item)),
      );
      toast.success(
        updated.isActive
          ? "Categoria activada correctamente"
          : "Categoria desactivada correctamente",
      );
    } catch {
      toast.error("No se pudo actualizar el estado de la categoria");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Categorias
          </h1>
          <p className="text-muted-foreground">
            Organiza tu catalogo para mejorar busquedas y respuestas del bot.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Crear Categoria
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total categorias</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl">{categories.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorias activas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl">{activeCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorias inactivas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl">{categories.length - activeCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de categorias</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando categorias...
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
              <Tags className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="font-medium">Aun no tienes categorias creadas.</p>
              <p className="text-sm text-muted-foreground">
                Crea una categoria para organizar mejor tus productos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-lg border p-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.description || "Sin descripcion"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      slug: {category.slug || "sin-slug"}
                    </p>
                  </div>
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={togglingId === category.id}
                    onClick={() => void handleToggleCategory(category)}
                  >
                    {togglingId === category.id
                      ? "Actualizando..."
                      : category.isActive
                        ? "Desactivar"
                        : "Activar"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear categoria</DialogTitle>
            <DialogDescription>
              Define una categoria para clasificar mejor tu catalogo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nombre</Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Ej: Portatiles"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Descripcion</Label>
              <Textarea
                id="category-description"
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Equipos portatiles para trabajo y estudio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-slug">Slug (opcional)</Label>
              <Input
                id="category-slug"
                value={formData.slug}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, slug: event.target.value }))
                }
                placeholder="portatiles"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory} disabled={saving}>
              {saving ? "Guardando..." : "Crear categoria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
