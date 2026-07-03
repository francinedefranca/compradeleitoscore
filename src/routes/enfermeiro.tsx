import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Radar,
  CheckCircle2,
  Timer,
  Globe2,
  Building2,
  AlertTriangle,
  Ban,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PerfilGate } from "@/components/perfil-gate";
import { useCore } from "@/lib/core-store";
import {
  CRITERIO_DESEMPATE_LABEL,
  HOSPITAIS_CREDENCIADOS,
  type CriterioDesempate,
  type Solicitacao,
} from "@/lib/core-types";
import { StatusBadge } from "@/lib/status-badge";
import { formatDateTime } from "@/lib/formatters";

export const Route = createFileRoute("/enfermeiro")({
  head: () => ({ meta: [{ title: "Enfermagem Navegadora — CORE/MG" }] }),
  component: EnfermeiroPage,
});

// Tempo (em segundos) para liberar expansão estadual.
const TEMPO_LIMITE_EXPANSAO_S = 45;

function EnfermeiroPage() {
  const { solicitacoes, iniciarBuscaMacro } = useCore();

  const fila = useMemo(
    () =>
      solicitacoes.filter((s) =>
        [
          "AUTORIZADO_AUTORIDADE",
          "BUSCA_MACRO_REGIONAL",
          "BUSCA_ESTADUAL_EXPANDIDA",
        ].includes(s.status),
      ),
    [solicitacoes],
  );

  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const selecionada = fila.find((s) => s.id === selecionadaId) ?? null;

  return (
    <PerfilGate permitido={["ENFERMEIRO"]}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enfermagem Navegadora</h1>
          <p className="text-sm text-muted-foreground">
            Busca ativa de leitos em hospitais credenciados após homologação da Autoridade Sanitária.
          </p>
        </div>

        <div className="rounded-md border border-info/30 bg-info/10 p-3 text-xs text-info">
          <strong>Aviso:</strong> valores tabelados por tipo de leito vigentes em Minas Gerais.
          Seleção focada na disponibilidade da vaga e adequação logística.
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fila de casos em busca</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Macrorregião</TableHead>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Aceites</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fila.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                    <TableCell className="font-medium">{s.pacienteNome}</TableCell>
                    <TableCell className="text-xs">{s.macrorregiaoOrigem}</TableCell>
                    <TableCell className="text-xs">{s.parecer?.clinicaIndicada}</TableCell>
                    <TableCell className="text-xs">{s.aceitesHospitais.length}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="flex gap-2">
                      {s.status === "AUTORIZADO_AUTORIDADE" ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            try {
                              iniciarBuscaMacro(s.id);
                              setSelecionadaId(s.id);
                              toast.success("Busca macrorregional iniciada.");
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Erro");
                            }
                          }}
                        >
                          <Radar className="h-4 w-4" /> Iniciar busca
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => setSelecionadaId(s.id)}>
                          <Search className="h-4 w-4" /> Abrir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {fila.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum caso aguardando busca.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selecionada && <PainelBusca solicitacao={selecionada} onClose={() => setSelecionadaId(null)} />}
      </div>
    </PerfilGate>
  );
}

function PainelBusca({ solicitacao, onClose }: { solicitacao: Solicitacao; onClose: () => void }) {
  const { registrarAceite, expandirParaEstadual, cancelarAbsorcaoSus } = useCore();

  const estadual = solicitacao.status === "BUSCA_ESTADUAL_EXPANDIDA";
  const hospitais = useMemo(
    () =>
      HOSPITAIS_CREDENCIADOS.filter((h) =>
        estadual ? true : h.macrorregiao === solicitacao.macrorregiaoOrigem,
      ),
    [estadual, solicitacao.macrorregiaoOrigem],
  );

  // Cronômetro
  const inicio = solicitacao.buscaIniciadaEm
    ? new Date(solicitacao.buscaIniciadaEm).getTime()
    : Date.now();
  const [decorridos, setDecorridos] = useState(() =>
    Math.max(0, Math.floor((Date.now() - inicio) / 1000)),
  );
  useEffect(() => {
    const t = setInterval(() => {
      setDecorridos(Math.max(0, Math.floor((Date.now() - inicio) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [inicio]);

  const podeExpandir = !estadual && decorridos >= TEMPO_LIMITE_EXPANSAO_S;
  const restante = Math.max(0, TEMPO_LIMITE_EXPANSAO_S - decorridos);

  const [aceitesDialogOpen, setAceitesDialogOpen] = useState(false);
  const [desempateOpen, setDesempateOpen] = useState(false);
  const [justificativa, setJustificativa] = useState("");

  const multiAceite = solicitacao.aceitesHospitais.length > 1;

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">
            {solicitacao.protocolo} • {solicitacao.pacienteNome}
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            Clínica indicada: {solicitacao.parecer?.clinicaIndicada} • Origem:{" "}
            {solicitacao.macrorregiaoOrigem}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-md border bg-muted/60 px-2 py-1 text-xs font-mono">
            <Timer className="h-3.5 w-3.5 text-primary" />
            {String(Math.floor(decorridos / 60)).padStart(2, "0")}:
            {String(decorridos % 60).padStart(2, "0")}
          </div>
          <StatusBadge status={solicitacao.status} />
          <Button size="sm" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={podeExpandir ? "default" : "outline"}
            disabled={!podeExpandir}
            onClick={() => {
              try {
                expandirParaEstadual(solicitacao.id);
                toast.success("Busca expandida para o nível estadual.");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Erro");
              }
            }}
          >
            <Globe2 className="h-4 w-4" />
            {estadual
              ? "Busca estadual ativa"
              : podeExpandir
                ? "Expandir Busca para Nível Estadual"
                : `Aguarde ${restante}s para expandir`}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAceitesDialogOpen(true)}>
            <Building2 className="h-4 w-4" /> Simular aceite de hospital
          </Button>
          {multiAceite && (
            <Button size="sm" variant="secondary" onClick={() => setDesempateOpen(true)}>
              <AlertTriangle className="h-4 w-4" /> Resolver desempate (
              {solicitacao.aceitesHospitais.length})
            </Button>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital credenciado</TableHead>
                <TableHead>Município</TableHead>
                <TableHead>Distância</TableHead>
                <TableHead>Estrutura</TableHead>
                <TableHead>Aceite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hospitais.map((h) => {
                const aceite = solicitacao.aceitesHospitais.find((a) => a.hospitalId === h.id);
                return (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.nome}</TableCell>
                    <TableCell className="text-xs">
                      {h.municipio} • {h.macrorregiao}
                    </TableCell>
                    <TableCell className="text-xs">{h.distanciaKmBH} km</TableCell>
                    <TableCell className="text-xs">{h.estruturaScore}/5</TableCell>
                    <TableCell className="text-xs">
                      {aceite ? (
                        <span className="rounded-full bg-success/15 px-2 py-0.5 text-success">
                          Aceito • {aceite.vagasDisponiveis} vaga(s)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
            <Ban className="h-4 w-4" /> Cancelar por absorção do SUS
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Justificativa (mín. 15 caracteres)"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
            />
            <Button
              variant="destructive"
              onClick={() => {
                try {
                  cancelarAbsorcaoSus(solicitacao.id, justificativa);
                  toast.success("Solicitação cancelada — absorvida pelo SUS.");
                  onClose();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Erro");
                }
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </CardContent>

      {aceitesDialogOpen && (
        <AceiteDialog
          solicitacao={solicitacao}
          hospitaisElegiveis={hospitais.filter(
            (h) => !solicitacao.aceitesHospitais.some((a) => a.hospitalId === h.id),
          )}
          onClose={() => setAceitesDialogOpen(false)}
          onAceite={(hospitalId, vagas) => {
            registrarAceite(solicitacao.id, hospitalId, vagas);
            toast.success("Aceite registrado.");
            setAceitesDialogOpen(false);
          }}
        />
      )}

      {desempateOpen && (
        <DesempateDialog
          solicitacao={solicitacao}
          onClose={() => setDesempateOpen(false)}
        />
      )}
    </Card>
  );
}

function AceiteDialog({
  hospitaisElegiveis,
  onClose,
  onAceite,
}: {
  solicitacao: Solicitacao;
  hospitaisElegiveis: typeof HOSPITAIS_CREDENCIADOS;
  onClose: () => void;
  onAceite: (hospitalId: string, vagas: number) => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Simular aceite recebido</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {hospitaisElegiveis.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todos os hospitais elegíveis já registraram aceite.
            </p>
          )}
          {hospitaisElegiveis.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded border p-2">
              <div>
                <div className="text-sm font-medium">{h.nome}</div>
                <div className="text-xs text-muted-foreground">
                  {h.municipio} • Estrutura {h.estruturaScore}/5 • {h.distanciaKmBH} km
                </div>
              </div>
              <Button size="sm" onClick={() => onAceite(h.id, 1)}>
                Registrar aceite
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DesempateDialog({
  solicitacao,
  onClose,
}: {
  solicitacao: Solicitacao;
  onClose: () => void;
}) {
  const { confirmarLeitoEnfermagem } = useCore();
  const clinica = solicitacao.parecer?.clinicaIndicada;
  const candidatos = HOSPITAIS_CREDENCIADOS.filter((h) =>
    solicitacao.aceitesHospitais.some((a) => a.hospitalId === h.id),
  );
  const [criterio, setCriterio] = useState<CriterioDesempate>("MENOR_DISTANCIA");
  const [hospitalId, setHospitalId] = useState<string>("");
  const [justif, setJustif] = useState("");

  const sugestao = useMemo(() => {
    if (candidatos.length === 0) return null;
    const list = [...candidatos];
    if (criterio === "MENOR_DISTANCIA") {
      list.sort((a, b) => a.distanciaKmBH - b.distanciaKmBH);
    } else if (criterio === "MELHOR_ESTRUTURA") {
      list.sort((a, b) => b.estruturaScore - a.estruturaScore);
    } else {
      list.sort((a, b) => {
        const aScore = clinica && a.clinicasDisponiveis.includes(clinica) ? 1 : 0;
        const bScore = clinica && b.clinicasDisponiveis.includes(clinica) ? 1 : 0;
        return bScore - aScore;
      });
    }
    return list[0]!;
  }, [candidatos, criterio, clinica]);

  const salvar = () => {
    const escolhido = hospitalId || sugestao?.id;
    if (!escolhido) return toast.error("Selecione um hospital.");
    if (justif.trim().length < 10) return toast.error("Justificativa obrigatória.");
    try {
      confirmarLeitoEnfermagem(solicitacao.id, {
        hospitalId: escolhido,
        criterioDesempateUtilizado: criterio,
        justificativa: justif,
        escopoBusca: solicitacao.status === "BUSCA_ESTADUAL_EXPANDIDA" ? "ESTADUAL" : "MACRO",
      });
      toast.success("Leito confirmado e enviado ao Administrativo.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Matriz de Desempate — {solicitacao.protocolo}</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border border-info/30 bg-info/10 p-3 text-xs text-info">
          Valores tabelados por tipo de leito vigentes em Minas Gerais. Seleção focada na
          disponibilidade da vaga e adequação logística.
        </div>

        <div>
          <Label className="mb-2 block text-xs font-medium">Critério de desempate</Label>
          <RadioGroup
            value={criterio}
            onValueChange={(v) => setCriterio(v as CriterioDesempate)}
            className="grid grid-cols-1 gap-2 md:grid-cols-3"
          >
            {(Object.keys(CRITERIO_DESEMPATE_LABEL) as CriterioDesempate[]).map((c) => (
              <label
                key={c}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted/50"
              >
                <RadioGroupItem value={c} id={c} />
                <span>{CRITERIO_DESEMPATE_LABEL[c]}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Candidatos com aceite</Label>
          <div className="space-y-1.5">
            {candidatos.map((h) => {
              const recomendado = sugestao?.id === h.id;
              return (
                <label
                  key={h.id}
                  className={`flex cursor-pointer items-center justify-between rounded border p-2 text-sm ${
                    (hospitalId || sugestao?.id) === h.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="hospital"
                      checked={(hospitalId || sugestao?.id) === h.id}
                      onChange={() => setHospitalId(h.id)}
                    />
                    <div>
                      <div className="font-medium">{h.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {h.municipio} • {h.distanciaKmBH} km • Estrutura {h.estruturaScore}/5
                      </div>
                    </div>
                  </div>
                  {recomendado && (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
                      Recomendado
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium">Justificativa da escolha</Label>
          <Textarea rows={3} value={justif} onChange={(e) => setJustif(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar}>
            <CheckCircle2 className="h-4 w-4" /> Confirmar leito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
