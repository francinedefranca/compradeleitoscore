import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Stethoscope, Truck, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { PerfilGate } from "@/components/perfil-gate";
import { RegistroTentativaContato } from "@/components/registro-tentativa-contato";
import { useCore } from "@/lib/core-store";
import {
  CLINICAS,
  ESCOPOS_BUSCA,
  ESCOPO_BUSCA_LABEL,
  GRAVIDADE_META,
  STATUS_TRANSFERENCIA_LABEL,
  STATUS_TRANSFERENCIA_ORDEM,
  type ClinicaMedica,
  type EscopoBusca,
  type Solicitacao,
  type StatusTransferencia,
} from "@/lib/core-types";
import { formatDateTime, timeAgo } from "@/lib/formatters";
import { StatusBadge } from "@/lib/status-badge";

export const Route = createFileRoute("/regulador")({
  head: () => ({ meta: [{ title: "Fila de Regulação — CORE/MG" }] }),
  component: ReguladorPage,
});

function ReguladorPage() {
  const { solicitacoes } = useCore();
  const [aberta, setAberta] = useState<Solicitacao | null>(null);

  const fila = useMemo(
    () =>
      solicitacoes
        .filter(
          (s) => s.status === "AGUARDANDO_REGULACAO" || s.status === "AGUARDANDO_VAGA_ZERO",
        )
        .sort(
          (a, b) => GRAVIDADE_META[b.gravidade].peso - GRAVIDADE_META[a.gravidade].peso,
        ),
    [solicitacoes],
  );

  return (
    <PerfilGate permitido={["REGULADOR"]}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fila de Regulação</h1>
          <p className="text-sm text-muted-foreground">
            Solicitações pendentes ordenadas por gravidade clínica.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gravidade</TableHead>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Diagnóstico</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Espera</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fila.map((s) => {
                  const g = GRAVIDADE_META[s.gravidade];
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${g.classe}`}>
                          {g.label}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                      <TableCell>
                        <div className="font-medium">{s.pacienteNome}</div>
                        <div className="text-xs text-muted-foreground">CPF {s.pacienteCpf}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{s.diagnosticoPrincipal}</div>
                        <div className="text-xs text-muted-foreground">CID {s.cid}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.unidadeOrigem}
                        <div className="text-muted-foreground">{s.macrorregiaoOrigem}</div>
                      </TableCell>
                      <TableCell><StatusBadge status={s.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">há {timeAgo(s.criadoEm)}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => setAberta(s)}>
                          <Stethoscope className="h-4 w-4" /> Regular
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {fila.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma solicitação pendente na fila.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {aberta && <RegularDialog solicitacao={aberta} onClose={() => setAberta(null)} />}
      </div>
    </PerfilGate>
  );
}

function RegularDialog({
  solicitacao,
  onClose,
}: {
  solicitacao: Solicitacao;
  onClose: () => void;
}) {
  const { emitirParecer, recusar } = useCore();
  const [vagaZero, setVagaZero] = useState(solicitacao.status === "AGUARDANDO_VAGA_ZERO");
  const [vagaZeroDetalhe, setVagaZeroDetalhe] = useState("");
  const [parecerTecnico, setParecerTecnico] = useState("");
  const [clinica, setClinica] = useState<ClinicaMedica>("UTI Adulto");
  const [motivoRecusa, setMotivoRecusa] = useState("");

  const registrarVagaZero = () => {
    try {
      emitirParecer(
        solicitacao.id,
        {
          vagaZeroTentada: false,
          vagaZeroDetalhe,
          parecerTecnico: "Aguardando tentativa de Vaga Zero.",
          clinicaIndicada: clinica,
          checkTermoEsgotamentoSus: false,
        },
        "AGUARDANDO_VAGA_ZERO",
      );
      toast.success("Status atualizado: Aguardando Vaga Zero");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  const emitir = () => {
    if (!parecerTecnico.trim() || parecerTecnico.length < 30) {
      toast.error("Parecer técnico deve descrever o esgotamento de leitos SUS (mín. 30 caracteres).");
      return;
    }
    try {
      emitirParecer(
        solicitacao.id,
        {
          vagaZeroTentada: vagaZero,
          vagaZeroDetalhe,
          parecerTecnico,
          clinicaIndicada: clinica,
          checkTermoEsgotamentoSus: true,
        },
        "PARECER_EMITIDO",
      );
      toast.success("Parecer técnico emitido. Encaminhado à Autoridade Sanitária.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  const recusarSol = () => {
    if (!motivoRecusa.trim()) return toast.error("Informe o motivo da recusa.");
    try {
      recusar(solicitacao.id, motivoRecusa);
      toast.success("Solicitação recusada.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Regulação — {solicitacao.protocolo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 rounded-md bg-muted/40 p-3 text-sm">
          <div><strong>Paciente:</strong> {solicitacao.pacienteNome} • CPF {solicitacao.pacienteCpf}</div>
          <div><strong>Diagnóstico:</strong> {solicitacao.diagnosticoPrincipal} ({solicitacao.cid})</div>
          <div><strong>Origem:</strong> {solicitacao.unidadeOrigem} • {solicitacao.macrorregiaoOrigem}</div>
          <div className="text-xs text-muted-foreground">
            Justificativa do solicitante: {solicitacao.justificativa}
          </div>
        </div>

        <div className="space-y-3 border-t pt-3">
          <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/15 p-3">
            <Checkbox
              id="vagazero"
              checked={vagaZero}
              onCheckedChange={(c) => setVagaZero(Boolean(c))}
            />
            <div className="min-w-0">
              <Label htmlFor="vagazero" className="text-sm font-medium">
                Tentativa de Vaga Zero realizada no SUS sem sucesso?
              </Label>
              <Textarea
                rows={2}
                className="mt-2"
                placeholder="Descreva centrais/unidades acionadas e horários…"
                value={vagaZeroDetalhe}
                onChange={(e) => setVagaZeroDetalhe(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Clínica indicada</Label>
            <Select value={clinica} onValueChange={(v) => setClinica(v as ClinicaMedica)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLINICAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium">
              Parecer técnico do Regulador (esgotamento de leitos públicos e indicação)
            </Label>
            <Textarea
              rows={4}
              placeholder="Ex.: Esgotados os leitos SUS da macrorregião…"
              value={parecerTecnico}
              onChange={(e) => setParecerTecnico(e.target.value)}
            />
          </div>

          <BuscaTransferenciaControls solicitacao={solicitacao} />

          <RegistroTentativaContato solicitacao={solicitacao} />

          <div className="rounded-md border p-3">
            <div className="mb-1 text-xs font-medium text-destructive">Recusar solicitação</div>
            <div className="flex gap-2">
              <Input
                placeholder="Motivo da recusa"
                value={motivoRecusa}
                onChange={(e) => setMotivoRecusa(e.target.value)}
              />
              <Button variant="destructive" onClick={recusarSol}>Recusar</Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          {solicitacao.status === "AGUARDANDO_REGULACAO" && !vagaZero && (
            <Button variant="secondary" onClick={registrarVagaZero}>
              <AlertTriangle className="h-4 w-4" /> Registrar Vaga Zero
            </Button>
          )}
          <Button onClick={emitir} disabled={!vagaZero}>Emitir Parecer Técnico</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Substitui o antigo status genérico "Em Busca" por um dropdown hierárquico
 * (Macro-Origem → Macro-Próxima → Estadual) e expõe o Status de Transferência
 * do paciente (Aguardando Transporte → Em Trânsito → Admitido no Destino).
 */
function BuscaTransferenciaControls({ solicitacao }: { solicitacao: Solicitacao }) {
  const { atualizarEscopoBusca, atualizarStatusTransferencia } = useCore();
  const escopoAtual: EscopoBusca = solicitacao.escopoBuscaAtual ?? "MACRO_ORIGEM";
  const transferenciaAtual: StatusTransferencia =
    solicitacao.statusTransferencia ?? "AGUARDANDO_TRANSPORTE";

  return (
    <div className="grid gap-3 rounded-md border bg-muted/30 p-3 md:grid-cols-2">
      <div>
        <Label className="mb-1 flex items-center gap-1.5 text-xs font-medium">
          <Search className="h-3.5 w-3.5" /> Escopo de busca (hierárquico)
        </Label>
        <Select
          value={escopoAtual}
          onValueChange={(v) => {
            try {
              atualizarEscopoBusca(solicitacao.id, v as EscopoBusca);
              toast.success("Escopo de busca atualizado.");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Erro");
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ESCOPOS_BUSCA.map((e) => (
              <SelectItem key={e} value={e}>
                {ESCOPO_BUSCA_LABEL[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="mb-1 flex items-center gap-1.5 text-xs font-medium">
          <Truck className="h-3.5 w-3.5" /> Status de Transferência
        </Label>
        <Select
          value={transferenciaAtual}
          onValueChange={(v) => {
            try {
              atualizarStatusTransferencia(solicitacao.id, v as StatusTransferencia);
              toast.success("Status de transferência atualizado.");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Erro");
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_TRANSFERENCIA_ORDEM.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_TRANSFERENCIA_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
  }
// Dentro do seu mapeamento de solicitações:
const escopoSugerido = calcularEscopoSugerido(new Date(solicitacao.dataSolicitacao));
const precisaAlerta = solicitacao.escopoBuscaAtual === 'Macro-Origem' && escopoSugerido !== 'Macro-Origem';

return (
 <div className={`card ${precisaAlerta ? 'border-red-500 bg-red-50' : ''}`}>
  {precisaAlerta && (
    <div className="p-2">
      <span className="text-red-600 font-bold text-xs">
        Alerta: Tempo de espera excedido (Sugerido: {escopoSugerido})
      </span>
    </div>
  )}
  {/* ... resto do seu card ... */}
</div>
