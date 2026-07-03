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
import { Clock, PercentCircle, BedDouble, Network } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCore } from "@/lib/core-store";
import {
  ESCOPOS_BUSCA,
  ESCOPO_BUSCA_LABEL,
  HOSPITAIS_CREDENCIADOS,
  type EscopoBusca,
} from "@/lib/core-types";
import { chaveSemana, enriquecerSolicitacao } from "@/lib/utils";

export const Route = createFileRoute("/gestao")({
  head: () => ({
    meta: [
      { title: "Dashboard de Gestão — CORE/MG" },
      {
        name: "description",
        content:
          "Indicadores semanais de recusa por região, tempo médio de resposta e distribuição de leitos por tipo.",
      },
    ],
  }),
  component: DashboardGestaoPage,
});

const CORES = ["#2b60d9", "#3aa1d9", "#3fb08b", "#d99a2b", "#a54cd9", "#e26363"];

*/ function DashboardGestaoPage() {
  const { solicitacoes } = useCore();

  // Enriquecemos as solicitações usando o util (dado limpo → dashboard).
  const enriquecidas = useMemo(
    () => solicitacoes.map(enriquecerSolicitacao),
    [solicitacoes],
  ); /* function DashboardGestaoPage() {
  return <div>Teste de carregamento</div>;
}

  // Estado global de filtro por semana (governança operacional).
  const semanas = useMemo(() => {
    const set = new Set<string>();
    enriquecidas.forEach((s) => set.add(chaveSemana(s.criadoEm)));
    return Array.from(set).sort().reverse();
  }, [enriquecidas]);

  const [semana, setSemana] = useState<string>("todas");
  // Filtro estratificado por escopo hierárquico (Macro-Origem / Próxima / Estadual).
  const [escopoFiltro, setEscopoFiltro] = useState<EscopoBusca | "todos">("todos");

  const filtradas = useMemo(() => {
    const porSemana =
      semana === "todas"
        ? enriquecidas
        : enriquecidas.filter((s) => chaveSemana(s.criadoEm) === semana);
    if (escopoFiltro === "todos") return porSemana;
    // Uma solicitação entra no recorte se o escopo atual bate OU se possui
    // qualquer histórico de contato no escopo escolhido.
    return porSemana.filter(
      (s) =>
        s.escopoBuscaAtual === escopoFiltro ||
        (s.historicoContatos ?? []).some((h) => h.escopoBusca === escopoFiltro),
    );
  }, [enriquecidas, semana, escopoFiltro]);

  // Performance de Rede: taxa de recusa calculada a partir dos registros manuais
  // de contato (funciona mesmo quando o hospital não tem login no sistema).
  const performanceRede = useMemo(() => {
    const contatos = filtradas
      .flatMap((s) => s.historicoContatos ?? [])
      .filter((h) => (escopoFiltro === "todos" ? true : h.escopoBusca === escopoFiltro));
    const total = contatos.length;
    const recusas = contatos.filter((c) => c.resultado === "RECUSA").length;
    const aceites = contatos.filter((c) => c.resultado === "ACEITE").length;
    const semResposta = contatos.filter((c) => c.resultado === "SEM_RESPOSTA").length;
    const taxaRecusa = total ? Math.round((recusas / total) * 1000) / 10 : 0;
    return { total, recusas, aceites, semResposta, taxaRecusa };
  }, [filtradas, escopoFiltro]);

  // 1) Taxa de recusa por região (origem)
  const recusaPorRegiao = useMemo(() => {
    const map = new Map<string, { total: number; recusa: number }>();
    filtradas.forEach((s) => {
      const r = s.regiaoOrigem ?? s.macrorregiaoOrigem;
      const cur = map.get(r) ?? { total: 0, recusa: 0 };
      cur.total += 1;
      if (s.status === "RECUSADO" || s.taxaAceiteRecusa === false) cur.recusa += 1;
      map.set(r, cur);
    });
    return Array.from(map.entries()).map(([regiao, v]) => ({
      regiao,
      taxa: v.total ? Math.round((v.recusa / v.total) * 1000) / 10 : 0,
      total: v.total,
    }));
  }, [filtradas]);

  // 2) Tempo médio de resposta (h) por região executora / origem
  const tempoMedioPorRegiao = useMemo(() => {
    const map = new Map<string, { soma: number; n: number }>();
    filtradas.forEach((s) => {
      if (s.tempoRespostaHoras == null) return;
      const hospital = HOSPITAIS_CREDENCIADOS.find(
        (h) => h.id === s.compra?.hospitalId || h.id === s.escolhaEnfermagem?.hospitalId,
      );
      const r = s.regiaoExecutora ?? hospital?.macrorregiao ?? s.regiaoOrigem ?? s.macrorregiaoOrigem;
      const cur = map.get(r) ?? { soma: 0, n: 0 };
      cur.soma += s.tempoRespostaHoras;
      cur.n += 1;
      map.set(r, cur);
    });
    return Array.from(map.entries()).map(([regiao, v]) => ({
      regiao,
      horas: Math.round((v.soma / v.n) * 100) / 100,
    }));
  }, [filtradas]);

  const tempoMedioGlobal = useMemo(() => {
    const arr = filtradas
      .map((s) => s.tempoRespostaHoras)
      .filter((n): n is number => typeof n === "number");
    if (!arr.length) return 0;
    return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
  }, [filtradas]);

  // 3) Distribuição de leitos por tipo (clínica)
  const distribuicaoTipo = useMemo(() => {
    const map = new Map<string, number>();
    filtradas.forEach((s) => {
      const tipo = s.tipoLeito ?? s.parecer?.clinicaIndicada;
      if (!tipo) return;
      map.set(tipo, (map.get(tipo) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([tipo, qtd]) => ({ tipo, qtd }));
  }, [filtradas]);

  const taxaRecusaGlobal = useMemo(() => {
    if (!filtradas.length) return 0;
    const recusas = filtradas.filter(
      (s) => s.status === "RECUSADO" || s.taxaAceiteRecusa === false,
    ).length;
    return Math.round((recusas / filtradas.length) * 1000) / 10;
  }, [filtradas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard de Gestão</h1>
          <p className="text-sm text-muted-foreground">
            Indicadores semanais: recusa por região, tempo de resposta e mix de leitos.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Select
            value={escopoFiltro}
            onValueChange={(v) => setEscopoFiltro(v as EscopoBusca | "todos")}
          >
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Escopo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os escopos</SelectItem>
              {ESCOPOS_BUSCA.map((e) => (
                <SelectItem key={e} value={e}>
                  {ESCOPO_BUSCA_LABEL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={semana} onValueChange={setSemana}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Semana" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as semanas</SelectItem>
              {semanas.map((w) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPI
          icon={PercentCircle}
          label="Taxa de recusa global"
          value={`${taxaRecusaGlobal}%`}
          hint={`${filtradas.length} casos no filtro`}
          tone="warning"
        />
        <KPI
          icon={Clock}
          label="Tempo médio até 1º aceite"
          value={`${tempoMedioGlobal} h`}
          hint="Aberta → aceite do prestador"
          tone="info"
        />
        <KPI
          icon={BedDouble}
          label="Tipos de leito distintos"
          value={String(distribuicaoTipo.length)}
          hint={`${distribuicaoTipo.reduce((a, b) => a + b.qtd, 0)} solicitações`}
          tone="primary"
        />
        <KPI
          icon={Network}
          label="Performance de Rede"
          value={`${performanceRede.taxaRecusa}% recusa`}
          hint={`${performanceRede.total} contatos • ${performanceRede.aceites} aceites • ${performanceRede.semResposta} sem resposta`}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de recusa por região</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {recusaPorRegiao.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recusaPorRegiao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="regiao" fontSize={11} />
                  <YAxis unit="%" fontSize={11} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="taxa" fill="#d99a2b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tempo médio de resposta (horas)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {tempoMedioPorRegiao.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tempoMedioPorRegiao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="regiao" fontSize={11} />
                  <YAxis unit="h" fontSize={11} />
                  <Tooltip formatter={(v: number) => `${v} h`} />
                  <Bar dataKey="horas" fill="#2b60d9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição de leitos por tipo</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {distribuicaoTipo.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribuicaoTipo}
                  dataKey="qtd"
                  nameKey="tipo"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={(e) => `${e.tipo}: ${e.qtd}`}
                >
                  {distribuicaoTipo.map((_, i) => (
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
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "info" | "warning";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
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

function Empty() {
  return (
    <div className="grid h-full place-items-center text-sm text-muted-foreground">
      Sem dados para a semana selecionada.
    </div>
  );
}
const calcularTaxaRecusa = (solicitacoes: Solicitacao[]) => {
  const totalContatos = solicitacoes.flatMap(s => s.historicoContatos).length;
  const totalRecusas = solicitacoes.flatMap(s => s.historicoContatos)
    .filter(c => c.resultado === 'Recusa').length;
  
  return totalContatos === 0 ? 0 : (totalRecusas / totalContatos) * 100;
};
