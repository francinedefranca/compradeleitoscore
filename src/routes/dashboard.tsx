import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Activity,
  BedDouble,
  Clock,
  DollarSign,
  Building2,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCore } from "@/lib/core-store";
import { CLINICAS, HOSPITAIS_CREDENCIADOS, MOTIVO_RECUSA_LABEL } from "@/lib/core-types";
import { formatCurrency } from "@/lib/formatters";
import { StatusBadge } from "@/lib/status-badge";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel Gerencial — CORE/MG" },
      {
        name: "description",
        content:
          "Indicadores em tempo real da compra de leitos hospitalares: gasto por macrorregião, tempo médio de resposta e ranking de prestadores.",
      },
    ],
  }),
  component: DashboardPage,
});

const CORES = ["#2b60d9", "#3aa1d9", "#3fb08b", "#d99a2b", "#a54cd9"];

function DashboardPage() {
  const { solicitacoes } = useCore();
  const [periodo, setPeriodo] = useState("30");
  const [prestador, setPrestador] = useState("todos");
  const [clinica, setClinica] = useState("todas");

  const filtradas = useMemo(() => {
    const limite = Date.now() - Number(periodo) * 86400_000;
    return solicitacoes.filter((s) => {
      if (new Date(s.criadoEm).getTime() < limite) return false;
      if (prestador !== "todos" && s.compra?.hospitalId !== prestador) return false;
      if (clinica !== "todas" && s.parecer?.clinicaIndicada !== clinica) return false;
      return true;
    });
  }, [solicitacoes, periodo, prestador, clinica]);

  const compradas = filtradas.filter((s) => s.compra);
  const totalGasto = compradas.reduce((acc, s) => acc + (s.compra?.valorDiaria ?? 0), 0);
  const tempoMedio = useMemo(() => {
    const internadas = filtradas.filter((s) => s.compra?.internacaoEm);
    if (internadas.length === 0) return 0;
    const soma = internadas.reduce((acc, s) => {
      const a = new Date(s.criadoEm).getTime();
      const b = new Date(s.compra!.internacaoEm).getTime();
      return acc + (b - a) / 3600_000;
    }, 0);
    return soma / internadas.length;
  }, [filtradas]);

  const porMacro = useMemo(() => {
    const m = new Map<string, number>();
    compradas.forEach((s) => {
      const h = HOSPITAIS_CREDENCIADOS.find((x) => x.id === s.compra?.hospitalId);
      if (!h) return;
      m.set(h.macrorregiao, (m.get(h.macrorregiao) ?? 0) + 1);
    });
    return Array.from(m.entries()).map(([macro, qtd]) => ({ macro, qtd }));
  }, [compradas]);

  const rankingHospitais = useMemo(() => {
    const m = new Map<string, { nome: string; qtd: number; valor: number }>();
    compradas.forEach((s) => {
      if (!s.compra) return;
      const h = HOSPITAIS_CREDENCIADOS.find((x) => x.id === s.compra!.hospitalId);
      if (!h) return;
      const cur = m.get(h.id) ?? { nome: h.nome, qtd: 0, valor: 0 };
      cur.qtd += 1;
      cur.valor += s.compra.valorDiaria;
      m.set(h.id, cur);
    });
    return Array.from(m.values()).sort((a, b) => b.qtd - a.qtd);
  }, [compradas]);

  const pendentes = filtradas.filter((s) => s.status !== "INTERNADO" && s.status !== "RECUSADO");
  const recusas = filtradas.flatMap((s) =>
    (s.historicoContatos ?? []).filter((c) => c.resultado === "RECUSA"),
  );
  const repescagensPendentes = filtradas.flatMap((s) =>
    (s.historicoContatos ?? []).filter((c) => c.reacionarHospital && !c.repescagemRealizada),
  );
  const motivosRecusa = Array.from(
    recusas.reduce((acc, c) => {
      const motivo = c.motivoRecusa ?? "OUTRO";
      acc.set(motivo, (acc.get(motivo) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  ).map(([motivo, qtd]) => ({
    motivo: MOTIVO_RECUSA_LABEL[motivo as keyof typeof MOTIVO_RECUSA_LABEL],
    qtd,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel Gerencial</h1>
          <p className="text-sm text-muted-foreground">
            Indicadores em tempo real da compra extraordinária de leitos hospitalares.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={prestador} onValueChange={setPrestador}>
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder="Prestador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os prestadores</SelectItem>
              {HOSPITAIS_CREDENCIADOS.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={clinica} onValueChange={setClinica}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Clínica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as clínicas</SelectItem>
              {CLINICAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPI
          icon={BedDouble}
          label="Leitos comprados"
          value={String(compradas.length)}
          hint={`${pendentes.length} em processo`}
          tone="primary"
        />
        <KPI
          icon={DollarSign}
          label="Valor total (diária)"
          value={formatCurrency(totalGasto)}
          hint={`${compradas.length} compras`}
          tone="success"
        />
        <KPI
          icon={Clock}
          label="Tempo médio até internação"
          value={`${tempoMedio.toFixed(1)} h`}
          hint="Solicitação → internação"
          tone="info"
        />
        <KPI
          icon={ShieldAlert}
          label="Pendentes de regulação"
          value={String(filtradas.filter((s) => s.status === "AGUARDANDO_REGULACAO").length)}
          hint="Fila do Regulador"
          tone="warning"
        />
        <KPI
          icon={RefreshCw}
          label="Repescagens pendentes"
          value={String(repescagensPendentes.length)}
          hint={`${recusas.length} recusas registradas`}
          tone="info"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leitos comprados por macrorregião</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {porMacro.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porMacro}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="macro" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="qtd" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por prestador</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {rankingHospitais.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rankingHospitais}
                    dataKey="qtd"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(e) => `${e.qtd}`}
                  >
                    {rankingHospitais.map((_, i) => (
                      <Cell key={i} fill={CORES[i % CORES.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Motivos de recusa da rede credenciada</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {motivosRecusa.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={motivosRecusa} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="motivo" fontSize={11} width={120} />
                <Tooltip />
                <Bar dataKey="qtd" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de hospitais acionados</CardTitle>
        </CardHeader>
        <CardContent>
          {rankingHospitais.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma compra registrada no período.
            </p>
          ) : (
            <div className="divide-y">
              {rankingHospitais.map((h, i) => (
                <div key={h.nome} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{h.nome}</div>
                      <div className="text-xs text-muted-foreground">{h.qtd} internação(ões)</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{formatCurrency(h.valor)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Solicitações em andamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pendentes.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma solicitação em processo.
              </p>
            )}
            {pendentes.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{s.protocolo}</span>
                    <span className="truncate text-sm font-medium">{s.pacienteNome}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {s.unidadeOrigem} • {s.macrorregiaoOrigem}
                    <Activity className="ml-2 h-3 w-3" />
                    {s.diagnosticoPrincipal}
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof BedDouble;
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "success" | "info" | "warning";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
    warning: "bg-warning/20 text-warning-foreground",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${toneClasses}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="truncate text-xl font-bold">{value}</div>
          <div className="truncate text-[11px] text-muted-foreground">{hint}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-full place-items-center text-sm text-muted-foreground">
      Sem dados no período selecionado.
    </div>
  );
}
