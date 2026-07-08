import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  BedDouble,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  History,
  Search,
} from "lucide-react";

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
import { HOSPITAIS_CREDENCIADOS } from "@/lib/core-types";
import { formatDateTime, timeAgo } from "@/lib/formatters";
import { StatusBadge } from "@/lib/status-badge";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Painel Operacional — SIGCORE" }] }),
  component: PainelOperacional,
});

const MS_24H = 24 * 60 * 60 * 1000;

const MOTIVOS_RECUSA_FALLBACK: Record<string, string> = {
  SEM_LEITO_DISPONIVEL: "Sem leito disponível",
  SEM_PERFIL_ASSISTENCIAL: "Sem perfil assistencial",
  SEM_ESPECIALIDADE: "Sem especialidade",
  SEM_EQUIPE_DISPONIVEL: "Sem equipe disponível",
  SEM_RECURSO_DIAGNOSTICO_TERAPEUTICO: "Sem recurso diagnóstico/terapêutico",
  PACIENTE_INCOMPATIVEL: "Paciente incompatível com o serviço",
  NAO_ATENDE_TIPO_LEITO: "Não atende ao tipo de leito solicitado",
  OUTRO: "Outro",
};

function PainelOperacional() {
  const { solicitacoes } = useCore();
  const agora = Date.now();

  const emAndamento = solicitacoes.filter(
    (s) => !["RECUSADO", "CANCELADO_ABSORVIDO_SUS", "INTERNADO"].includes(s.status),
  );
  const triagensPendentes = solicitacoes.filter((s) =>
    ["AGUARDANDO_REGULACAO", "AGUARDANDO_VAGA_ZERO", "PARECER_EMITIDO"].includes(s.status),
  );
  const buscasMacro = solicitacoes.filter((s) => s.status === "BUSCA_MACRO_REGIONAL");
  const prazo24hVencido = buscasMacro.filter((s) => {
    if (!s.buscaIniciadaEm) return false;
    const temAceiteMacrorregional = s.aceitesHospitais.some(aceiteMacrorregional);
    return !temAceiteMacrorregional && agora - new Date(s.buscaIniciadaEm).getTime() >= MS_24H;
  });
  const aceitesPendentes = solicitacoes.filter(
    (s) => s.aceitesHospitais.length > 0 && !s.escolhaEnfermagem,
  );
  const judicializados = solicitacoes.filter((s) => Boolean(s.judicial));
  const registrosBusca = solicitacoes
    .flatMap((s) => (s.historicoContatos ?? []).map((contato) => ({ solicitacao: s, contato })))
    .sort(
      (a, b) =>
        new Date(b.contato.dataHoraContato).getTime() -
        new Date(a.contato.dataHoraContato).getTime(),
    );
  const repescagensPendentes = registrosBusca.filter(({ contato }) => repescagemPendente(contato));
  const ultimosAceites = solicitacoes
    .flatMap((s) => s.aceitesHospitais.map((aceite) => ({ solicitacao: s, aceite })))
    .sort((a, b) => new Date(b.aceite.aceitoEm).getTime() - new Date(a.aceite.aceitoEm).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              SIGCORE – Rede Credenciada
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Painel Operacional – Compra Excepcional de Leitos
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Página inicial da CORE para concentrar triagem, busca, pendências e histórico da
              compra excepcional de leitos da rede credenciada.
            </p>
          </div>
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <div className="font-medium">Plantão atual</div>
            <div className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR")}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ResumoItem label="Casos em andamento" value={emAndamento.length} />
          <ResumoItem label="Casos judicializados" value={judicializados.length} />
          <ResumoItem label="Buscas com 24h vencidas" value={prazo24hVencido.length} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AtencaoCard
          icon={FileText}
          title="Triagens pendentes"
          value={triagensPendentes.length}
          to="/regulador"
          tone="info"
        />
        <AtencaoCard
          icon={Search}
          title="Buscas macrorregionais"
          value={buscasMacro.length}
          to="/enfermeiro"
          tone="warning"
        />
        <AtencaoCard
          icon={Clock}
          title="Prazo de 24h vencido"
          value={prazo24hVencido.length}
          to="/enfermeiro"
          tone="danger"
        />
        <AtencaoCard
          icon={CheckCircle2}
          title="Aceites pendentes de seleção"
          value={aceitesPendentes.length}
          to="/enfermeiro"
          tone="success"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Casos em busca</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Macro</TableHead>
                  <TableHead>Tipo leito</TableHead>
                  <TableHead>Dias em busca</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ...buscasMacro,
                  ...solicitacoes.filter((s) => s.status === "BUSCA_ESTADUAL_EXPANDIDA"),
                ]
                  .slice(0, 8)
                  .map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                      <TableCell className="font-medium">{s.pacienteNome}</TableCell>
                      <TableCell className="text-xs">{s.macrorregiaoOrigem}</TableCell>
                      <TableCell className="text-xs">{s.parecer?.clinicaIndicada ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        {s.buscaIniciadaEm
                          ? Math.max(
                              0,
                              Math.floor(
                                (agora - new Date(s.buscaIniciadaEm).getTime()) / 86_400_000,
                              ),
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                {buscasMacro.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      Nenhum caso em busca no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registro de busca – respostas recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Horário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrosBusca.slice(0, 8).map(({ solicitacao, contato }) => (
                  <TableRow key={contato.id}>
                    <TableCell className="font-mono text-xs">{solicitacao.protocolo}</TableCell>
                    <TableCell className="text-xs">{contato.hospitalNome}</TableCell>
                    <TableCell className="text-xs">{contato.resultado}</TableCell>
                    <TableCell className="text-xs">{motivoRecusaLabel(contato)}</TableCell>
                    <TableCell className="text-xs">
                      {formatDateTime(contato.dataHoraContato)}
                    </TableCell>
                  </TableRow>
                ))}
                {registrosBusca.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      Nenhuma resposta registrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <PendenciaCard
          title="Repescagens pendentes"
          icon={AlertCircle}
          empty="Nenhuma repescagem pendente."
        >
          {repescagensPendentes.slice(0, 5).map(({ solicitacao, contato }) => (
            <LinhaPendencia
              key={contato.id}
              titulo={contato.hospitalNome}
              detalhe={`${solicitacao.pacienteNome} • ${motivoRecusaLabel(contato)}`}
              meta={
                repescagemEm(contato) ? formatDateTime(repescagemEm(contato)!) : "Sem data sugerida"
              }
            />
          ))}
        </PendenciaCard>

        <PendenciaCard
          title="Aguardando SEI"
          icon={FileText}
          empty="Nenhum processo aguardando SEI."
        >
          {solicitacoes
            .filter((s) => s.status === "INTERNADO" && !s.numeroSeiProcesso)
            .slice(0, 5)
            .map((s) => (
              <LinhaPendencia
                key={s.id}
                titulo={s.protocolo}
                detalhe={s.pacienteNome}
                meta={s.compra?.internacaoEm ? formatDateTime(s.compra.internacaoEm) : "Internado"}
              />
            ))}
        </PendenciaCard>

        <PendenciaCard
          title="Aguardando faturamento"
          icon={BedDouble}
          empty="Nenhum caso aguardando faturamento."
        >
          {solicitacoes
            .filter((s) => s.status === "INTERNADO" && !s.faturasEnviadasCompras)
            .slice(0, 5)
            .map((s) => (
              <LinhaPendencia
                key={s.id}
                titulo={s.protocolo}
                detalhe={hospitalNome(s.compra?.hospitalId) ?? s.pacienteNome}
                meta={s.compra?.internacaoEm ? `há ${timeAgo(s.compra.internacaoEm)}` : "—"}
              />
            ))}
        </PendenciaCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <HistoricoCard title="Últimos aceites">
          {ultimosAceites.map(({ solicitacao, aceite }) => (
            <LinhaPendencia
              key={`${solicitacao.id}-${aceite.hospitalId}-${aceite.aceitoEm}`}
              titulo={hospitalNome(aceite.hospitalId) ?? "Hospital"}
              detalhe={solicitacao.protocolo}
              meta={formatDateTime(aceite.aceitoEm)}
            />
          ))}
        </HistoricoCard>
        <HistoricoCard title="Últimas altas">
          <p className="text-sm text-muted-foreground">
            Indicador reservado para integração futura.
          </p>
        </HistoricoCard>
        <HistoricoCard title="Últimos encerramentos">
          {solicitacoes
            .filter((s) => ["RECUSADO", "CANCELADO_ABSORVIDO_SUS"].includes(s.status))
            .slice(0, 5)
            .map((s) => (
              <LinhaPendencia
                key={s.id}
                titulo={s.protocolo}
                detalhe={s.pacienteNome}
                meta={s.status}
              />
            ))}
        </HistoricoCard>
      </section>
    </div>
  );
}

function hospitalNome(id?: string) {
  return HOSPITAIS_CREDENCIADOS.find((h) => h.id === id)?.nome;
}

function aceiteMacrorregional(aceite: unknown) {
  if (!aceite || typeof aceite !== "object") return true;
  if (!("escopoBusca" in aceite)) return true;
  return aceite.escopoBusca !== "ESTADUAL";
}

function motivoRecusaLabel(contato: unknown) {
  if (!contato || typeof contato !== "object" || !("motivoRecusa" in contato)) return "—";
  const motivo = contato.motivoRecusa;
  if (typeof motivo !== "string") return "—";
  return MOTIVOS_RECUSA_FALLBACK[motivo] ?? motivo;
}

function repescagemPendente(contato: unknown) {
  if (!contato || typeof contato !== "object") return false;
  const reacionar = "reacionarHospital" in contato && Boolean(contato.reacionarHospital);
  const realizada = "repescagemRealizada" in contato && Boolean(contato.repescagemRealizada);
  return reacionar && !realizada;
}

function repescagemEm(contato: unknown) {
  if (!contato || typeof contato !== "object" || !("repescagemEm" in contato)) return undefined;
  return typeof contato.repescagemEm === "string" ? contato.repescagemEm : undefined;
}

function ResumoItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function AtencaoCard({
  icon: Icon,
  title,
  value,
  to,
  tone,
}: {
  icon: typeof FileText;
  title: string;
  value: number;
  to: string;
  tone: "info" | "warning" | "danger" | "success";
}) {
  const toneClass = {
    info: "bg-info/15 text-info",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-destructive/10 text-destructive",
    success: "bg-success/15 text-success",
  }[tone];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">solicitações</div>
          </div>
        </div>
        <div className="mt-3 font-medium">{title}</div>
        <Button asChild className="mt-3 w-full" size="sm" variant="outline">
          <Link to={to}>Abrir</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function PendenciaCard({
  title,
  icon: Icon,
  empty,
  children,
}: {
  title: string;
  icon: typeof AlertCircle;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasChildren ? children : <p className="text-sm text-muted-foreground">{empty}</p>}
      </CardContent>
    </Card>
  );
}

function HistoricoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function LinhaPendencia({
  titulo,
  detalhe,
  meta,
}: {
  titulo: string;
  detalhe: string;
  meta: string;
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="font-medium">{titulo}</div>
      <div className="text-xs text-muted-foreground">{detalhe}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{meta}</div>
    </div>
  );
}
