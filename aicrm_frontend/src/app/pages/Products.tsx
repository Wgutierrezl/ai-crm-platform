import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Plus,
  Search,
  Grid,
  List,
  Edit,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table.tsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog.tsx";
import { Label } from "../components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx";
import { Textarea } from "../components/ui/textarea.tsx";
import { toast } from "sonner";
import { productService } from "../../api/services/product.service";
import { categoryService } from "../../api/services/category.service";
import { logger } from "../../utils/logger/logger";
import type { ProductDto } from "../../api/dtos/product.dto";
import type { CategoryDto } from "../../api/dtos/category.dto";

type ProductView = ProductDto & { available?: boolean };

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  brand: string;
  sku: string;
  currency: string;
  minStock: string;
  imageUrl: string;
  isActive: boolean;
};

const initialFormState: ProductFormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "none",
  brand: "",
  sku: "",
  currency: "COP",
  minStock: "0",
  imageUrl: "",
  isActive: true,
};

export default function Products() {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStock, setFilterStock] = useState<"all" | "low">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [products, setProducts] = useState<ProductView[]>([]);
  const [activeCategories, setActiveCategories] = useState<CategoryDto[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryDto[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductView | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProductFormState>(initialFormState);

  const categoriesById = useMemo(() => {
    const map = new Map<string, CategoryDto>();
    for (const category of allCategories) map.set(category.id, category);
    return map;
  }, [allCategories]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const data = await productService.getProducts();
      setProducts(
        data.map((product) => ({
          ...product,
          available: product.stock > 0,
        })),
      );
      logger.info("Productos cargados correctamente");
    } catch (error) {
      logger.error("No se pudieron cargar productos", error);
      toast.error("No se pudieron cargar los productos");
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const [active, all] = await Promise.all([
        categoryService.getActiveCategories(),
        categoryService.getCategories(),
      ]);
      setActiveCategories(active);
      setAllCategories(all);
    } catch (error) {
      logger.error("No se pudieron cargar categorias", error);
      toast.warning("No se pudieron cargar las categorias");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void Promise.all([loadProducts(), loadCategories()]);
    });
  }, []);

  function resolveCategoryMeta(product: ProductView): {
    name: string;
    inactive: boolean;
  } {
    if (!product.categoryId) return { name: "Sin categoria", inactive: false };
    const category = categoriesById.get(product.categoryId);
    if (!category) return { name: "Categoria no disponible", inactive: true };
    return { name: category.name, inactive: !category.isActive };
  }

  const filteredProducts = products.filter((product) => {
    const term = searchQuery.toLowerCase();
    const categoryMeta = resolveCategoryMeta(product);
    const matchesSearch =
      product.name.toLowerCase().includes(term) ||
      (product.description ?? "").toLowerCase().includes(term) ||
      categoryMeta.name.toLowerCase().includes(term) ||
      (product.brand ?? "").toLowerCase().includes(term);

    const matchesStock =
      filterStock === "all" || (filterStock === "low" && product.stock < 10);

    const matchesCategory =
      filterCategory === "all"
        ? true
        : filterCategory === "none"
          ? !product.categoryId
          : product.categoryId === filterCategory;

    return matchesSearch && matchesStock && matchesCategory;
  });

  const hasActiveFilters =
    searchQuery.trim().length > 0 || filterStock !== "all" || filterCategory !== "all";

  function handleOpenDialog(product?: ProductView) {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description ?? "",
        price: product.price.toString(),
        stock: product.stock.toString(),
        categoryId: product.categoryId ?? "none",
        brand: product.brand ?? "",
        sku: product.sku ?? "",
        currency: product.currency ?? "COP",
        minStock: String(product.minStock ?? 0),
        imageUrl: product.imageUrl ?? "",
        isActive: product.isActive,
      });
    } else {
      setEditingProduct(null);
      setFormData(initialFormState);
    }
    setIsDialogOpen(true);
  }

  const selectableCategories = useMemo(() => {
    if (!editingProduct || !editingProduct.categoryId) return activeCategories;

    const assigned = allCategories.find((c) => c.id === editingProduct.categoryId);
    if (!assigned || assigned.isActive) return activeCategories;

    if (activeCategories.some((c) => c.id === assigned.id)) return activeCategories;
    return [assigned, ...activeCategories];
  }, [activeCategories, allCategories, editingProduct]);

  async function handleSave() {
    if (!formData.name.trim() || !formData.price || !formData.stock) {
      toast.error("Nombre, precio y stock son obligatorios");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: Number(formData.price),
        stock: Number(formData.stock),
        categoryId: formData.categoryId === "none" ? null : formData.categoryId,
        brand: formData.brand.trim() || null,
        sku: formData.sku.trim() || null,
        currency: formData.currency.trim() || "COP",
        minStock: Number(formData.minStock || "0"),
        imageUrl: formData.imageUrl.trim() || null,
        isActive: formData.isActive,
      };

      if (editingProduct) {
        const updated = await productService.updateProduct(editingProduct.id, payload);
        setProducts((prev) =>
          prev.map((product) =>
            product.id === updated.id
              ? { ...updated, available: updated.stock > 0 }
              : product,
          ),
        );
        toast.success("Producto actualizado exitosamente");
      } else {
        const created = await productService.createProduct({
          ...payload,
          categoryId: payload.categoryId ?? undefined,
          description: payload.description ?? undefined,
          brand: payload.brand ?? undefined,
          sku: payload.sku ?? undefined,
          imageUrl: payload.imageUrl ?? undefined,
        });

        setProducts((prev) => [{ ...created, available: created.stock > 0 }, ...prev]);
        toast.success("Producto creado exitosamente");
      }

      setIsDialogOpen(false);
      await loadCategories();
    } catch (error) {
      logger.error("Error al guardar producto", error);
      toast.error("No se pudo guardar el producto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Productos
          </h1>
          <p className="text-muted-foreground">Gestiona tu catalogo y organizalo por categorias</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Crear Producto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              <div className="relative flex-1 min-w-[230px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, marca, descripcion o categoria..."
                  value={searchQuery}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(event.target.value)
                  }
                  className="pl-10"
                />
              </div>

              <Select value={filterStock} onValueChange={(value: "all" | "low") => setFilterStock(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="low">Stock bajo (&lt;10)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorias</SelectItem>
                  <SelectItem value="none">Sin categoria</SelectItem>
                  {activeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStock("all");
                    setFilterCategory("all");
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("table")}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingProducts ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando productos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
              <p className="font-medium">No se encontraron productos con los filtros seleccionados.</p>
              <p className="text-sm text-muted-foreground">
                Ajusta la busqueda o limpia los filtros para ver mas resultados.
              </p>
            </div>
          ) : viewMode === "table" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const categoryMeta = resolveCategoryMeta(product);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div>{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.description || "Sin descripcion"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={categoryMeta.inactive ? "secondary" : "outline"}>
                          {categoryMeta.name}
                          {categoryMeta.inactive ? " (Inactiva)" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell>${product.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={product.stock < 10 ? "text-[var(--warning)]" : ""}>
                          {product.stock} unidades
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.imageUrl ? (
                          <span className="text-xs text-muted-foreground">Preview disponible</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Proximamente</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(product)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const categoryMeta = resolveCategoryMeta(product);
                return (
                  <Card key={product.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-28 border rounded-md flex items-center justify-center overflow-hidden bg-muted/30">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-xs text-muted-foreground space-y-1">
                            <ImageIcon className="w-5 h-5 mx-auto" />
                            <p>Imagen del producto - proximamente</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-2xl text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                          ${product.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{product.currency}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${product.stock < 10 ? "text-[var(--warning)]" : "text-muted-foreground"}`}>
                          Stock: {product.stock}
                        </span>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <Badge variant={categoryMeta.inactive ? "secondary" : "outline"}>
                        {categoryMeta.name}
                        {categoryMeta.inactive ? " (Inactiva)" : ""}
                      </Badge>
                      <Button variant="outline" className="w-full" onClick={() => handleOpenDialog(product)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Producto" : "Crear Producto"}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Modifica la informacion del producto"
                : "Agrega un nuevo producto al catalogo"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nombre del producto</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Ej: Laptop Dell XPS 15"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descripcion</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Descripcion comercial del producto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, price: event.target.value }))
                  }
                  placeholder="4500000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, stock: event.target.value }))
                  }
                  placeholder="12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, brand: event.target.value }))
                  }
                  placeholder="Ej: Lenovo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, sku: event.target.value }))
                  }
                  placeholder="SKU-LAP-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, currency: event.target.value }))
                  }
                  placeholder="COP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-stock">Stock minimo</Label>
                <Input
                  id="min-stock"
                  type="number"
                  value={formData.minStock}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, minStock: event.target.value }))
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria (opcional)</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value: string) =>
                    setFormData((prev) => ({ ...prev, categoryId: value }))
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecciona una categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoria</SelectItem>
                    {selectableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                        {!category.isActive ? " (Inactiva actual)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!loadingCategories && activeCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Aun no tienes categorias activas. Puedes crear una en el modulo de categorias.
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="image-url">Imagen del producto (proximamente)</Label>
                <Input
                  id="image-url"
                  value={formData.imageUrl}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, imageUrl: event.target.value }))
                  }
                  placeholder="Carga de imagenes en implementacion"
                />
                <div className="h-24 border rounded-md flex items-center justify-center bg-muted/30 overflow-hidden">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview producto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xs text-muted-foreground text-center">
                      Imagen del producto - proximamente
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="active">Estado</Label>
                <Select
                  value={formData.isActive ? "true" : "false"}
                  onValueChange={(value: string) =>
                    setFormData((prev) => ({ ...prev, isActive: value === "true" }))
                  }
                >
                  <SelectTrigger id="active">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
