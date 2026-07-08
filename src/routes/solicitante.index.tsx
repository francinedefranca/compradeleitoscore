import { Link, createFileRoute } from "@tanstack/react-router";
import { FileText, Plus, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCore } from "@/lib/core-store";
import { GRAVIDADE_META } from "@/lib/core-types";
import { formatDateTime, timeAgo } from "@/lib/formatters";
import { StatusBadge } from "@/lib/status-badge";
import { PerfilGate } from "@/components/perfil-gate";

export const Route = createFileRoute("/solicitante/")({
  head: () => ({ meta: [{ title: "Casos cadastrados — CORE/MG" }] }),
  component: CasosCadastrados,
});

function CasosCadastrados() {
  const { solicitacoes } = useCore();

  return (
    <PerfilGate
      permitido={[
        "REGULADOR",
        "AUTORIDADE",
        "ENFERMEIRO",
        "ADMINISTRATIVO",
        "ADMINISTRATIVO_CORE",
        "GESTAO",
      ]}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Casos cadastrados</h1>
            <p className="text-sm text-muted-foreground">
              Casos de compra excepcional visíveis aos operadores, para acompanhamento conforme a
              fase de atuação.
            </p>
          </div>
          <Button asChild>
            <Link to="/solicitante/nova">
              <Plus className="h-4 w-4" /> Cadastrar caso
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Diagnóstico / CID</TableHead>
                  <TableHead>Gravidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aberta em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoes.map((s) => {
                  const g = GRAVIDADE_META[s.gravidade];
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                      <TableCell>
                        <div className="font-medium">{s.pacienteNome}</div>
                        <div className="text-xs text-muted-foreground">
                          CPF/CNS {s.pacienteCpf || s.pacienteCns || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{s.diagnosticoPrincipal}</div>
                        <div className="text-xs text-muted-foreground">CID {s.cid}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${g.classe}`}>
                          {g.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(s.criadoEm)}
                        <div>há {timeAgo(s.criadoEm)}</div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {solicitacoes.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      <FileText className="mx-auto mb-2 h-8 w-8" />
                      Nenhum caso cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 rounded-md border border-info/30 bg-info/10 p-3 text-xs text-info">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Fluxo interno: o cadastro é feito pelo médico regulador, autoridade sanitária ou apoio
            CORE após identificação da hipótese de compra excepcional.
          </span>
        </div>
      </div>
    </PerfilGate>
  );
}
