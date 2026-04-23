import { useState, type ChangeEvent } from "react";
import { Plus, Search, Grid, List, Edit } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table.tsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog.tsx";
import { Label } from "../components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx";
import { toast } from "sonner";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  available: boolean;
};

const mockProducts = [
  { id: 1, name: "Laptop Dell XPS 15", price: 4500000, stock: 12, available: true },
  { id: 2, name: "Mouse Logitech MX Master", price: 280000, stock: 45, available: true },
  { id: 3, name: "Teclado Mecánico Keychron", price: 350000, stock: 23, available: true },
  { id: 4, name: "Monitor LG 27 4K", price: 1200000, stock: 8, available: true },
  { id: 5, name: "Webcam Logitech C920", price: 420000, stock: 2, available: true },
  { id: 6, name: "Auriculares Sony WH-1000XM5", price: 980000, stock: 0, available: false },
];

export default function Products() {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStock, setFilterStock] = useState<"all" | "low">("all");
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    available: true,
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStock === "all" || (filterStock === "low" && product.stock < 10);
    return matchesSearch && matchesFilter;
  });

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        available: product.available,
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: "", price: "", stock: "", available: true });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? {
        ...p,
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        available: formData.available,
      } : p));
      toast.success("Producto actualizado exitosamente");
    } else {
      setProducts([...products, {
        id: products.length + 1,
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        available: formData.available,
      }]);
      toast.success("Producto creado exitosamente");
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Productos</h1>
          <p className="text-muted-foreground">Gestiona tu catálogo de productos</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Crear Producto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
          {viewMode === "table" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>${product.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={product.stock < 10 ? "text-[var(--warning)]" : ""}>
                        {product.stock} unidades
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.available ? "default" : "secondary"}>
                        {product.available ? "Disponible" : "No disponible"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(product)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-2xl text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                        ${product.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${product.stock < 10 ? "text-[var(--warning)]" : "text-muted-foreground"}`}>
                        Stock: {product.stock}
                      </span>
                      <Badge variant={product.available ? "default" : "secondary"}>
                        {product.available ? "Disponible" : "No disponible"}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOpenDialog(product)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Producto" : "Crear Producto"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Modifica la información del producto" : "Agrega un nuevo producto al catálogo"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del producto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Laptop Dell XPS 15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, price: e.target.value })}
                placeholder="4500000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="available">Estado</Label>
              <Select
                value={formData.available.toString()}
                onValueChange={(value: string) => setFormData({ ...formData, available: value === "true" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Disponible</SelectItem>
                  <SelectItem value="false">No disponible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
