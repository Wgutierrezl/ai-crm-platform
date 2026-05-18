import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Plus, Search, Loader2, Truck, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { supplierService } from "../../api/services/supplier.service";
import type {
  CreateSupplierRequest,
  SupplierDto,
  UpdateSupplierRequest,
} from "../../api/dtos/supplier.dto";
import type { ProductDto } from "../../api/dtos/product.dto";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx";
import { formatCurrency } from "../../utils/format/currency";

type SupplierFormState = {
  name: string;
  documentType: string;
  documentNumber: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  isActive: boolean;
};

const initialForm: SupplierFormState = {
  name: "",
  documentType: "",
  documentNumber: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  notes: "",
  isActive: true,
};

type StatusFilter = "all" | "active" | "inactive";
type ProductStatusFilter = "all" | "active" | "inactive";
const PRODUCTS_PER_PAGE = 5;

export default function Suppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierDto | null>(null);
  const [isProductsDialogOpen, setIsProductsDialogOpen] = useState(false);
  const [selectedSupplierForProducts, setSelectedSupplierForProducts] =
    useState<SupplierDto | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<ProductDto[]>([]);
  const [loadingSupplierProducts, setLoadingSupplierProducts] = useState(false);
  const [supplierProductsError, setSupplierProductsError] = useState<string | null>(null);
  const [productsModalSearch, setProductsModalSearch] = useState("");
  const [productsModalStatusFilter, setProductsModalStatusFilter] =
    useState<ProductStatusFilter>("all");
  const [productsModalPage, setProductsModalPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [formData, setFormData] = useState<SupplierFormState>(initialForm);

  const activeCount = useMemo(
    () => suppliers.filter((supplier) => supplier.isActive).length,
    [suppliers],
  );

  const filteredSuppliers = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && supplier.isActive) ||
        (statusFilter === "inactive" && !supplier.isActive);

      if (!matchesStatus) return false;
      if (!term) return true;

      const fields = [
        supplier.name,
        supplier.contactName ?? "",
        supplier.city ?? "",
        supplier.documentNumber ?? "",
        supplier.email ?? "",
      ];

      return fields.some((value) => value.toLowerCase().includes(term));
    });
  }, [suppliers, searchQuery, statusFilter]);

  const filteredSupplierProducts = useMemo(() => {
    const term = productsModalSearch.trim().toLowerCase();

    return supplierProducts.filter((product) => {
      const matchesStatus =
        productsModalStatusFilter === "all" ||
        (productsModalStatusFilter === "active" && product.isActive) ||
        (productsModalStatusFilter === "inactive" && !product.isActive);

      if (!matchesStatus) return false;
      if (!term) return true;

      const categoryName = product.category?.name ?? "";
      const fields = [
        product.name,
        product.sku ?? "",
        product.brand ?? "",
        categoryName,
      ];

      return fields.some((value) => value.toLowerCase().includes(term));
    });
  }, [supplierProducts, productsModalSearch, productsModalStatusFilter]);

  const totalSupplierProductsPages = Math.max(
    1,
    Math.ceil(filteredSupplierProducts.length / PRODUCTS_PER_PAGE),
  );

  const paginatedSupplierProducts = useMemo(() => {
    const start = (productsModalPage - 1) * PRODUCTS_PER_PAGE;
    return filteredSupplierProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredSupplierProducts, productsModalPage]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch {
      toast.error("No se pudieron cargar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadSuppliers();
    });
  }, []);

  const openCreateDialog = () => {
    setEditingSupplier(null);
    setFormData(initialForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (supplier: SupplierDto) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      documentType: supplier.documentType ?? "",
      documentNumber: supplier.documentNumber ?? "",
      contactName: supplier.contactName ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      city: supplier.city ?? "",
      notes: supplier.notes ?? "",
      isActive: supplier.isActive,
    });
    setIsDialogOpen(true);
  };

  const isValidEmail = (email: string): boolean => {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const buildCreatePayload = (): CreateSupplierRequest => ({
    name: formData.name.trim(),
    documentType: formData.documentType.trim() || undefined,
    documentNumber: formData.documentNumber.trim() || undefined,
    contactName: formData.contactName.trim() || undefined,
    phone: formData.phone.trim() || undefined,
    email: formData.email.trim() || undefined,
    address: formData.address.trim() || undefined,
    city: formData.city.trim() || undefined,
    notes: formData.notes.trim() || undefined,
    isActive: formData.isActive,
  });

  const buildUpdatePayload = (): UpdateSupplierRequest => ({
    ...buildCreatePayload(),
  });

  const handleSaveSupplier = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre del proveedor es obligatorio");
      return;
    }
    if (!isValidEmail(formData.email)) {
      toast.error("El email no tiene un formato valido");
      return;
    }

    try {
      setSaving(true);
      if (editingSupplier) {
        const updated = await supplierService.updateSupplier(
          editingSupplier.id,
          buildUpdatePayload(),
        );
        setSuppliers((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        toast.success("Proveedor actualizado correctamente");
      } else {
        const created = await supplierService.createSupplier(buildCreatePayload());
        setSuppliers((prev) => [created, ...prev]);
        toast.success("Proveedor creado correctamente");
      }

      setIsDialogOpen(false);
    } catch {
      toast.error("No se pudo guardar el proveedor");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSupplierStatus = async (supplier: SupplierDto) => {
    const nextStatus = !supplier.isActive;
    const actionLabel = nextStatus ? "activar" : "desactivar";

    if (!nextStatus) {
      const confirmed = window.confirm(
        `¿Seguro que quieres desactivar a "${supplier.name}"?`,
      );
      if (!confirmed) return;
    }

    try {
      setTogglingId(supplier.id);
      const updated = await supplierService.updateSupplierStatus(
        supplier.id,
        nextStatus,
      );
      setSuppliers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(`Proveedor ${actionLabel}do correctamente`);
    } catch {
      toast.error(`No se pudo ${actionLabel} el proveedor`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleViewSupplierProducts = async (supplier: SupplierDto) => {
    try {
      setSelectedSupplierForProducts(supplier);
      setIsProductsDialogOpen(true);
      setProductsModalSearch("");
      setProductsModalStatusFilter("all");
      setProductsModalPage(1);
      setSupplierProductsError(null);
      setLoadingSupplierProducts(true);
      const products = await supplierService.getSupplierProducts(supplier.id);
      setSupplierProducts(products);
    } catch {
      setSupplierProductsError("No se pudieron cargar los productos del proveedor.");
      toast.error("No se pudieron cargar los productos del proveedor");
      setSupplierProducts([]);
    } finally {
      setLoadingSupplierProducts(false);
    }
  };

  useEffect(() => {
    setProductsModalPage(1);
  }, [productsModalSearch, productsModalStatusFilter, isProductsDialogOpen]);

  useEffect(() => {
    if (productsModalPage > totalSupplierProductsPages) {
      setProductsModalPage(totalSupplierProductsPages);
    }
  }, [productsModalPage, totalSupplierProductsPages]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Proveedores
          </h1>
          <p className="text-muted-foreground">
            Gestiona proveedores y su estado comercial dentro de tu empresa.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo proveedor
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total proveedores</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl">{suppliers.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl">{activeCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inactivos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl">{suppliers.length - activeCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Listado de proveedores</CardTitle>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Buscar por nombre, contacto, ciudad, documento o email"
                  value={searchQuery}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(event.target.value)
                  }
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value: StatusFilter) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando proveedores...
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
              <Truck className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="font-medium">
                {suppliers.length === 0
                  ? "Aun no tienes proveedores registrados."
                  : "No hay proveedores para el filtro aplicado."}
              </p>
              <p className="text-sm text-muted-foreground">
                {suppliers.length === 0
                  ? "Crea tu primer proveedor para comenzar."
                  : "Prueba con otro texto o cambia el estado."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="rounded-lg border p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Contacto: {supplier.contactName || "No definido"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Documento:{" "}
                        {supplier.documentType || supplier.documentNumber
                          ? `${supplier.documentType ?? "Doc"} ${supplier.documentNumber ?? ""}`.trim()
                          : "No definido"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ciudad: {supplier.city || "No definida"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Email: {supplier.email || "No definido"}
                      </p>
                    </div>
                    <Badge variant={supplier.isActive ? "default" : "secondary"}>
                      {supplier.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/suppliers/${supplier.id}`)}
                    >
                      Ver detalle
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(supplier)}>
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleViewSupplierProducts(supplier)}
                    >
                      Ver productos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={togglingId === supplier.id}
                      onClick={() => void handleToggleSupplierStatus(supplier)}
                    >
                      {togglingId === supplier.id
                        ? "Actualizando..."
                        : supplier.isActive
                          ? "Desactivar"
                          : "Activar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Editar proveedor" : "Nuevo proveedor"}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? "Actualiza la informacion comercial del proveedor."
                : "Registra un proveedor para tu catalogo de compra."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supplier-name">Nombre *</Label>
                <Input
                  id="supplier-name"
                  value={formData.name}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Ej: Distribuciones Andinas SAS"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-document-type">Tipo de documento</Label>
                <Input
                  id="supplier-document-type"
                  value={formData.documentType}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, documentType: event.target.value }))
                  }
                  placeholder="Ej: NIT"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-document-number">Numero documento</Label>
                <Input
                  id="supplier-document-number"
                  value={formData.documentNumber}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, documentNumber: event.target.value }))
                  }
                  placeholder="Ej: 900123456-7"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-contact-name">Nombre contacto</Label>
                <Input
                  id="supplier-contact-name"
                  value={formData.contactName}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, contactName: event.target.value }))
                  }
                  placeholder="Ej: Laura Perez"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-phone">Telefono</Label>
                <Input
                  id="supplier-phone"
                  value={formData.phone}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder="Ej: +57 3001234567"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supplier-email">Email</Label>
                <Input
                  id="supplier-email"
                  type="email"
                  value={formData.email}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="Ej: compras@andinas.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supplier-address">Direccion</Label>
                <Input
                  id="supplier-address"
                  value={formData.address}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, address: event.target.value }))
                  }
                  placeholder="Ej: Calle 80 # 10-20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-city">Ciudad</Label>
                <Input
                  id="supplier-city"
                  value={formData.city}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, city: event.target.value }))
                  }
                  placeholder="Ej: Bogota"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-status">Estado</Label>
                <Select
                  value={formData.isActive ? "true" : "false"}
                  onValueChange={(value: string) =>
                    setFormData((prev) => ({ ...prev, isActive: value === "true" }))
                  }
                >
                  <SelectTrigger id="supplier-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supplier-notes">Notas</Label>
                <Textarea
                  id="supplier-notes"
                  value={formData.notes}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Ej: Proveedor principal"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSupplier} disabled={saving}>
              {saving ? "Guardando..." : editingSupplier ? "Guardar cambios" : "Crear proveedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductsDialogOpen} onOpenChange={setIsProductsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Productos de {selectedSupplierForProducts?.name ?? "proveedor"}
            </DialogTitle>
            <DialogDescription>
              Lista de productos actualmente asociados a este proveedor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Badge variant="outline">
                {supplierProducts.length} producto{supplierProducts.length === 1 ? "" : "s"} asociado
              </Badge>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Buscar por nombre, SKU, marca o categoria"
                    value={productsModalSearch}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setProductsModalSearch(event.target.value)
                    }
                  />
                </div>
                <Select
                  value={productsModalStatusFilter}
                  onValueChange={(value: ProductStatusFilter) =>
                    setProductsModalStatusFilter(value)
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
                {(productsModalSearch.trim().length > 0 ||
                  productsModalStatusFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setProductsModalSearch("");
                      setProductsModalStatusFilter("all");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>

            {loadingSupplierProducts ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando productos...
              </div>
            ) : supplierProductsError ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-destructive">
                {supplierProductsError}
              </div>
            ) : supplierProducts.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Este proveedor no tiene productos relacionados.
              </div>
            ) : filteredSupplierProducts.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No hay productos que coincidan con los filtros aplicados.
              </div>
            ) : (
              paginatedSupplierProducts.map((product) => (
                <div key={product.id} className="rounded-lg border p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Precio: {formatCurrency(product.price, product.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
                      <p className="text-sm text-muted-foreground">
                        Categoria: {product.category?.name ?? "Sin categoria"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Marca: {product.brand ?? "No definida"} · SKU: {product.sku ?? "No definido"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Proveedor: {product.supplier?.name ?? "Sin proveedor"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      <div className="h-16 w-16 border rounded-md flex items-center justify-center bg-muted/30 overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {!loadingSupplierProducts &&
              !supplierProductsError &&
              filteredSupplierProducts.length > 0 &&
              totalSupplierProductsPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Página {productsModalPage} de {totalSupplierProductsPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={productsModalPage === 1}
                      onClick={() => setProductsModalPage((prev) => Math.max(1, prev - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={productsModalPage >= totalSupplierProductsPages}
                      onClick={() =>
                        setProductsModalPage((prev) =>
                          Math.min(totalSupplierProductsPages, prev + 1),
                        )
                      }
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
