import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  CLINICAS,
  GRAVIDADE_META,
  MACRORREGIOES,
  STATUS_META,
  type ClinicaMedica,
  type Gravidade,
  type Macrorregiao,
  type StatusSolicitacao,
} from "@/lib/core-types";
import { formatDateTime, timeAgo } from "@/lib/formatters";
import { StatusBadge } from "@/lib/status-badge";

export const Route = createFileRoute("/casos")({
  head: () => ({ meta: [{ title: "Casos — SIGCORE" }] }),
  component: CasosPage,
});

const TODOS = "todos";

function CasosPage() {
  const { solicitacoes } = useCore();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<string>(TODOS);
  const [periodo, setPeriodo] = useState("todos");
  const [macro, setMacro] = useState<string>(TODOS);
  const [tipoLeito, setTipoLeito] = useState<string>(TODOS);
  const [gravidade, setGravidade] = useState<string>(TODOS);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const limite = periodo === TODOS ? null : Date.now() - Number(periodo) * 86_400_000;

    return solicitacoes.filter((s) => {
      const documento = s.pacienteCpf || s.pacienteCns;
      const tipo = s.parecer?.clinicaIndicada ?? s.tipoLeito;
      if (termo) {
        const alvo = [s.protocolo, s.pacienteNome, documento, s.unidadeOrigem, s.municipioOrigem]
          .join(" ")
          .toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      if (status !== TODOS && s.status !== status) return false;
      if (limite && new Date(s.criadoEm).getTime() < limite) return false;
      if (macro !== TODOS && s.macrorregiaoOrigem !== macro) return false;
      if (tipoLeito !== TODOS && tipo !== tipoLeito) return false;
      if (gravidade !== TODOS && s.gravidade !== gravidade) return false;
      return true;
    });
  }, [busca, gravidade, macro, periodo, solicitacoes, status, tipoLeito]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lista de Casos</h1>
        <p className="text-sm text-muted-foreground">
          Lista mestre operacional com filtros por status, período, macrorregião, tipo de leito e
          prioridade clínica.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Input
            className="xl:col-span-2"
            placeholder="Buscar por código, nome, CPF/CNS ou origem"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os status</SelectItem>
              {(Object.keys(STATUS_META) as StatusSolicitacao[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger>
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todo o período</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={macro} onValueChange={setMacro}>
            <SelectTrigger>
              <SelectValue placeholder="Macrorregião" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as macros</SelectItem>
              {MACRORREGIOES.map((m: Macrorregiao) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipoLeito} onValueChange={setTipoLeito}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de leito" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os leitos</SelectItem>
              {CLINICAS.map((c: ClinicaMedica) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gravidade} onValueChange={setGravidade}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as prioridades</SelectItem>
              {(Object.keys(GRAVIDADE_META) as Gravidade[]).map((g) => (
                <SelectItem key={g} value={g}>
                  {GRAVIDADE_META[g].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Paciente / CPF ou CNS</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Tipo de leito</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status atual</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((s) => {
                const g = GRAVIDADE_META[s.gravidade];
                const documento = s.pacienteCpf || s.pacienteCns || "—";
                const tipo = s.parecer?.clinicaIndicada ?? s.tipoLeito ?? "—";
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                    <TableCell>
                      <div className="font-medium">{s.pacienteNome}</div>
                      <div className="text-xs text-muted-foreground">{documento}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {s.unidadeOrigem}
                      <div className="text-muted-foreground">
                        {s.municipioOrigem} • {s.macrorregiaoOrigem}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{tipo}</TableCell>
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
              {filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum caso encontrado com os filtros selecionados.
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
