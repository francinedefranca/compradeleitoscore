import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HOSPITAIS_CREDENCIADOS } from "@/lib/core-types";

export const Route = createFileRoute("/prestadores")({
  head: () => ({ meta: [{ title: "Prestadores Credenciados — CORE/MG" }] }),
  component: PrestadoresPage,
});

function PrestadoresPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Prestadores Credenciados</h1>
        <p className="text-sm text-muted-foreground">
          Rede privada credenciada para compra extraordinária de leitos.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>CNES</TableHead>
                <TableHead>Município</TableHead>
                <TableHead>Macrorregião</TableHead>
                <TableHead>E-mail principal</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ativo?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HOSPITAIS_CREDENCIADOS.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <Building2 className="h-4 w-4 text-primary" /> {h.nome}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{h.cnes}</TableCell>
                  <TableCell>{h.municipio}</TableCell>
                  <TableCell>{h.macrorregiao}</TableCell>
                  <TableCell className="text-xs">{h.emailPrincipal}</TableCell>
                  <TableCell className="text-xs">{h.tipoPrestador}</TableCell>
                  <TableCell className="text-xs">{h.ativo ? "Sim" : "Não"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
