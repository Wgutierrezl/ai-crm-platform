import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2, Search, Image as ImageIcon } from "lucide-react";
import type { ProductDto } from "../../api/dtos/product.dto";
import type { SupplierDto } from "../../api/dtos/supplier.dto";
import { supplierService } from "../../api/services/supplier.service";
import { Button } from "../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Input } from "../components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx";
import { formatCurrency } from "../../utils/format/currency";

type ProductStatusFilter = "all" | "active" | "inactive";
const PRODUCTS_PER_PAGE = 5;

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState<SupplierDto | null>(null);
  const [supplierLoading, setSupplierLoading] = useState(true);
  const [supplierError, setSupplierError] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsSearch, setProductsSearch] = useState("");
  const [productsStatusFilter, setProductsStatusFilter] =
    useState<ProductStatusFilter>("all");
  const [productsPage, setProductsPage] = useState(1);

  useEffect(() => {
    const loadSupplier = async () => {
      if (!id) return;
      try {
        setSupplierLoading(true);
        setSupplierError(null);
        const data = await supplierService.getSupplierById(id);
        setSupplier(data);
      } catch {
        setSupplierError("No se pudo cargar el proveedor.");
      } finally {
        setSupplierLoading(false);
      }
    };

    void loadSupplier();
  }, [id]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!id) return;
      try {
        setProductsLoading(true);
        setProductsError(null);
        const data = await supplierService.getSupplierProducts(id);
        setProducts(data);
      } catch {
        setProducts([]);
        setProductsError("No se pudieron cargar los productos del proveedor.");
      } finally {
        setProductsLoading(false);
      }
    };

    void loadProducts();
  }, [id]);

  const filteredProducts = useMemo(() => {
    const term = productsSearch.trim().toLowerCase();

    return products.filter((product) => {
      const matchesStatus =
        productsStatusFilter === "all" ||
        (productsStatusFilter === "active" && product.isActive) ||
        (productsStatusFilter === "inactive" && !product.isActive);

      if (!matchesStatus) return false;
      if (!term) return true;

      const categoryName = product.category?.name ?? "";
      const fields = [product.name, product.sku ?? "", product.brand ?? "", categoryName];
      return fields.some((value) => value.toLowerCase().includes(term));
    });
  }, [products, productsSearch, productsStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (productsPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, productsPage]);

  useEffect(() => {
    setProductsPage(1);
  }, [productsSearch, productsStatusFilter]);

  useEffect(() => {
    if (productsPage > totalPages) {
      setProductsPage(totalPages);
    }
  }, [productsPage, totalPages]);

  if (supplierLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando proveedor...
        </div>
      </div>
    );
  }

  if (supplierError || !supplier) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/suppliers")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a proveedores
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {supplierError ?? "Proveedor no encontrado."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/suppliers")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a proveedores
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{supplier.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Detalle del proveedor
              </p>
            </div>
            <Badge variant={supplier.isActive ? "default" : "secondary"}>
              {supplier.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <p><span className="text-muted-foreground">Tipo documento:</span> {supplier.documentType ?? "No definido"}</p>
          <p><span className="text-muted-foreground">Numero documento:</span> {supplier.documentNumber ?? "No definido"}</p>
          <p><span className="text-muted-foreground">Contacto:</span> {supplier.contactName ?? "No definido"}</p>
          <p><span className="text-muted-foreground">Telefono:</span> {supplier.phone ?? "No definido"}</p>
          <p><span className="text-muted-foreground">Email:</span> {supplier.email ?? "No definido"}</p>
          <p><span className="text-muted-foreground">Ciudad:</span> {supplier.city ?? "No definida"}</p>
          <p className="md:col-span-2"><span className="text-muted-foreground">Direccion:</span> {supplier.address ?? "No definida"}</p>
          <p className="md:col-span-2"><span className="text-muted-foreground">Notas:</span> {supplier.notes ?? "Sin notas"}</p>
          <p><span className="text-muted-foreground">Creado:</span> {new Date(supplier.createdAt).toLocaleString("es-CO")}</p>
          <p><span className="text-muted-foreground">Actualizado:</span> {new Date(supplier.updatedAt).toLocaleString("es-CO")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle>Productos asociados</CardTitle>
              <Badge variant="outline">{products.length} producto{products.length === 1 ? "" : "s"} asociado</Badge>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Buscar por nombre, SKU, marca o categoria"
                  value={productsSearch}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setProductsSearch(event.target.value)
                  }
                />
              </div>
              <Select
                value={productsStatusFilter}
                onValueChange={(value: ProductStatusFilter) => setProductsStatusFilter(value)}
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
              {(productsSearch.trim().length > 0 || productsStatusFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setProductsSearch("");
                    setProductsStatusFilter("all");
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {productsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando productos...
            </div>
          ) : productsError ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-destructive">
              {productsError}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Este proveedor no tiene productos relacionados.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No hay productos que coincidan con los filtros aplicados.
            </div>
          ) : (
            paginatedProducts.map((product) => (
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

          {!productsLoading &&
            !productsError &&
            filteredProducts.length > 0 &&
            totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Página {productsPage} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={productsPage === 1}
                    onClick={() => setProductsPage((prev) => Math.max(1, prev - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={productsPage >= totalPages}
                    onClick={() => setProductsPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
