import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Plus, Stethoscope } from "lucide-react";

import { PerfilGate } from "@/components/perfil-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export const Route = createFileRoute("/regulador")({
  head: () => ({ meta: [{ title: "Médico Regulador — SIGCORE" }] }),
  component: ReguladorPage,
});

function ReguladorPage() {
  const { solicitacoes, usuarioAtual } = useCore();

  const meusCasos = useMemo(
    () => solicitacoes.filter((s) => s.solicitanteId === usuarioAtual.id),
    [solicitacoes, usuarioAtual.id],
  );

  return (
    <PerfilGate permitido={["REGULADOR"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Médico Regulador</h1>
            <p className="text-sm text-muted-foreground">
              Cadastro da descrição clínica e acompanhamento dos casos inseridos por você. A decisão
              sanitária é realizada pela Autoridade Sanitária.
            </p>
          </div>
          <Button asChild>
            <Link to="/solicitante/nova">
              <Plus className="h-4 w-4" /> Cadastrar caso
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Casos cadastrados por mim</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Paciente / CPF ou CNS</TableHead>
                  <TableHead>Diagnóstico</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meusCasos.map((s) => {
                  const g = GRAVIDADE_META[s.gravidade];
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                      <TableCell>
                        <div className="font-medium">{s.pacienteNome}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.pacienteCpf || s.pacienteCns || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{s.diagnosticoPrincipal}</div>
                        <div className="text-xs text-muted-foreground">CID {s.cid}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.unidadeOrigem}
                        <div className="text-muted-foreground">{s.macrorregiaoOrigem}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${g.classe}`}>
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
                {meusCasos.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      <Stethoscope className="mx-auto mb-2 h-8 w-8" />
                      Nenhum caso cadastrado por você.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PerfilGate>
  );
}
