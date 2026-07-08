import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { History, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCore } from "@/lib/core-store";
import { PERFIS, type PerfilId } from "@/lib/core-types";
import { formatDateTime } from "@/lib/formatters";
import { StatusBadge } from "@/lib/status-badge";

export const Route = createFileRoute("/auditoria")({
  head: () => ({ meta: [{ title: "Log de Auditoria — CORE/MG" }] }),
  component: AuditoriaPage,
});

function AuditoriaPage() {
  const { auditoria, solicitacoes } = useCore();
  const [q, setQ] = useState("");
  const [perfil, setPerfil] = useState<string>("todos");

  const filtrado = useMemo(() => {
    const term = q.trim().toLowerCase();
    return auditoria.filter((r) => {
      if (perfil !== "todos" && r.perfil !== perfil) return false;
      if (!term) return true;
      const sol = solicitacoes.find((s) => s.id === r.solicitacaoId);
      return [r.usuarioNome, r.usuarioCpf, r.acao, r.detalhe, sol?.protocolo, sol?.pacienteNome]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [auditoria, solicitacoes, q, perfil]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log de Auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Registro imutável de todas as alterações. Inclui CPF, data, hora e ação.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por protocolo, paciente, usuário, CPF ou ação"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={perfil} onValueChange={setPerfil}>
          <SelectTrigger className="h-9 w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os perfis</SelectItem>
            {PERFIS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/hora</TableHead>
                <TableHead>Usuário (CPF)</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Protocolo</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Transição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrado.map((r) => {
                const sol = solicitacoes.find((s) => s.id === r.solicitacaoId);
                const p = PERFIS.find((x) => x.id === (r.perfil as PerfilId));
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{formatDateTime(r.emAt)}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{r.usuarioNome}</div>
                      <div className="text-xs text-muted-foreground">CPF {r.usuarioCpf}</div>
                    </TableCell>
                    <TableCell className="text-xs">{p?.nome}</TableCell>
                    <TableCell className="font-mono text-xs">{sol?.protocolo}</TableCell>
                    <TableCell>
                      <div className="text-sm">{r.acao}</div>
                      {r.detalhe && (
                        <div className="text-xs text-muted-foreground">{r.detalhe}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.statusDepois && (
                        <div className="flex flex-wrap items-center gap-1 text-xs">
                          {r.statusAntes && (
                            <>
                              <StatusBadge status={r.statusAntes} />
                              <span>→</span>
                            </>
                          )}
                          <StatusBadge status={r.statusDepois} />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtrado.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    <History className="mx-auto mb-2 h-8 w-8" />
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
