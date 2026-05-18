import { useEffect, useState, type ChangeEvent } from "react";
import { Loader2, MessageSquare, Search, ShoppingCart } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Card, CardContent, CardHeader } from "../components/ui/card.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table.tsx";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { customerService } from "../../api/services/customer.service";
import { logger } from "../../utils/logger/logger";
import type { CustomerDto } from "../../api/dtos/customer.dto";

type CustomerView = CustomerDto & {
  identification: string;
};

export default function Customers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerView[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);

        const data = await customerService.getCustomers();
        const mapped: CustomerView[] = data.map((customer) => ({
          ...customer,
          identification: `${customer.identificationType ?? "CC"} ${
            customer.identificationNumber ?? "N/A"
          }`,
        }));

        setCustomers(mapped);
      } catch (error) {
        logger.warn("No se pudieron cargar clientes desde API", error);
        setErrorMessage("No se pudieron cargar los clientes.");
        toast.error("No se pudieron cargar los clientes");
      } finally {
        setLoading(false);
      }
    };

    queueMicrotask(() => {
      void loadCustomers();
    });
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const term = searchQuery.toLowerCase();

    return (
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      customer.phone.toLowerCase().includes(term) ||
      customer.identification.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Clientes
          </h1>
          <p className="text-muted-foreground">Gestiona tu base de clientes</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, telefono o identificacion..."
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando clientes...
            </div>
          ) : errorMessage ? (
            <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
              <p className="font-medium">No fue posible cargar clientes.</p>
              <p className="text-sm text-muted-foreground">
                Verifica tu conexion o vuelve a intentar en unos segundos.
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
              <p className="font-medium">
                {customers.length === 0
                  ? "Aun no tienes clientes registrados."
                  : "No se encontraron clientes con la busqueda actual."}
              </p>
              <p className="text-sm text-muted-foreground">
                {customers.length === 0
                  ? "Los clientes apareceran aqui cuando existan en el backend."
                  : "Prueba con otro nombre, correo, telefono o identificacion."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Identificacion</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.identification}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/conversations")}
                          title="Ver conversaciones"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/orders")}
                          title="Crear orden"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
