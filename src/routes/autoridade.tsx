import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck, PenLine, ShieldCheck } from "lucide-react";

import { PerfilGate } from "@/components/perfil-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  USUARIOS_MOCK,
  type ClinicaMedica,
  type Solicitacao,
} from "@/lib/core-types";
import { formatDateTime } from "@/lib/formatters";
import { StatusBadge } from "@/lib/status-badge";

export const Route = createFileRoute("/autoridade")({
  head: () => ({ meta: [{ title: "Avaliação Sanitária — CORE/MG" }] }),
  component: AutoridadePage,
});

type Decisao = "COMPRA_LEITOS" | "VAGA_ZERO" | "LEITO_EXTRA" | "INDEFERIR";

const DECISAO_LABEL: Record<Decisao, string> = {
  COMPRA_LEITOS: "Compra excepcional de leitos",
  VAGA_ZERO: "Direcionar para Vaga Zero",
  LEITO_EXTRA: "Direcionar para Leito Extra SUS",
  INDEFERIR: "Indeferir compra excepcional",
};

function AutoridadePage() {
  const { solicitacoes, usuarioAtual } = useCore();
  const autoridade = usuarioAtual.perfil === "AUTORIDADE";
  const [aberta, setAberta] = useState<Solicitacao | null>(null);
  const [triagemAberta, setTriagemAberta] = useState<Solicitacao | null>(null);

  const fila = useMemo(
    () =>
      solicitacoes.filter((s) =>
        ["AGUARDANDO_REGULACAO", "AGUARDANDO_VAGA_ZERO", "PARECER_EMITIDO"].includes(s.status),
      ),
    [solicitacoes],
  );

  return (
    <PerfilGate permitido={["AUTORIDADE", "ENFERMEIRO"]}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Triagem / Avaliação Sanitária</h1>
          <p className="text-sm text-muted-foreground">
            A autoridade sanitária registra o parecer técnico e a decisão. A enfermagem registra
            contatos e observações operacionais da triagem, sem substituir o parecer sanitário.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Gravidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fila.map((s) => {
                  const g = GRAVIDADE_META[s.gravidade];
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                      <TableCell className="font-medium">{s.pacienteNome}</TableCell>
                      <TableCell className="text-xs">
                        {s.pacienteCpf || s.pacienteCns || "—"}
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
                      <TableCell>
                        {autoridade ? (
                          <Button size="sm" onClick={() => setAberta(s)}>
                            <PenLine className="h-4 w-4" /> Parecer técnico
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => setTriagemAberta(s)}>
                            <ClipboardCheck className="h-4 w-4" /> Contato/triagem
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {fila.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Nenhum caso aguardando decisão da autoridade sanitária.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {aberta && <AvaliarDialog solicitacao={aberta} onClose={() => setAberta(null)} />}
        {triagemAberta && (
          <TriagemEnfermagemDialog
            solicitacao={triagemAberta}
            onClose={() => setTriagemAberta(null)}
          />
        )}
      </div>
    </PerfilGate>
  );
}

function AvaliarDialog({
  solicitacao,
  onClose,
}: {
  solicitacao: Solicitacao;
  onClose: () => void;
}) {
  const { decidirAutoridade } = useCore();
  const [decisao, setDecisao] = useState<Decisao>("COMPRA_LEITOS");
  const [clinica, setClinica] = useState<ClinicaMedica>(
    solicitacao.parecer?.clinicaIndicada ?? "UTI Adulto",
  );
  const [obs, setObs] = useState("");
  const cadastrador = USUARIOS_MOCK.find((u) => u.id === solicitacao.solicitanteId);
  const gravidade = GRAVIDADE_META[solicitacao.gravidade];

  const salvar = () => {
    if (obs.trim().length < 20) {
      toast.error("Descreva a fundamentação da decisão sanitária (mín. 20 caracteres).");
      return;
    }
    try {
      decidirAutoridade(solicitacao.id, { decisao, observacoes: obs, clinicaIndicada: clinica });
      toast.success("Decisão da autoridade sanitária registrada.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Avaliação Sanitária — {solicitacao.protocolo}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 rounded-md border bg-card p-4 text-sm md:grid-cols-2">
          <CampoRotulado label="Cadastrado por" valor={cadastrador?.nome ?? "—"} />
          <CampoRotulado label="Unidade solicitante/origem" valor={solicitacao.unidadeOrigem} />
          <CampoRotulado label="CNES da unidade" valor={solicitacao.cnesUnidadeOrigem ?? "—"} />
          <CampoRotulado
            label="Município / macro"
            valor={`${solicitacao.municipioOrigem} • ${solicitacao.macrorregiaoOrigem}`}
          />
          <CampoRotulado label="Paciente" valor={solicitacao.pacienteNome} />
          <CampoRotulado
            label="CPF/CNS"
            valor={solicitacao.pacienteCpf || solicitacao.pacienteCns || "—"}
          />
          <CampoRotulado label="Gravidade" valor={gravidade.label} />
          <CampoRotulado
            label="Diagnóstico / CID"
            valor={`${solicitacao.diagnosticoPrincipal} (${solicitacao.cid})`}
          />
          <CampoRotulado
            label="Sinais vitais"
            valor={`PA ${solicitacao.sinaisVitais.pa || "—"}; FC ${solicitacao.sinaisVitais.fc || "—"}; FR ${solicitacao.sinaisVitais.fr || "—"}; SpO2 ${solicitacao.sinaisVitais.spo2 || "—"}; T ${solicitacao.sinaisVitais.temp || "—"}`}
          />
          <CampoRotulado label="Descrição clínica trazida" valor={solicitacao.justificativa} />
          <CampoRotulado
            label="Triagem/contato da enfermagem"
            valor={solicitacao.triagemEnfermagem?.observacoes ?? "Ainda não registrado"}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">Decisão da autoridade sanitária</Label>
            <Select value={decisao} onValueChange={(v) => setDecisao(v as Decisao)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DECISAO_LABEL) as Decisao[]).map((d) => (
                  <SelectItem key={d} value={d}>
                    {DECISAO_LABEL[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium">Tipo de leito, se houver compra</Label>
            <Select value={clinica} onValueChange={(v) => setClinica(v as ClinicaMedica)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLINICAS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium">Fundamentação / observações</Label>
          <Textarea rows={4} value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>

        <div className="rounded-md border border-info/30 bg-info/10 p-3 text-xs text-info">
          Para compra excepcional, a decisão gera autorização para a enfermagem iniciar a busca na
          rede credenciada. Para Vaga Zero ou Leito Extra SUS, o caso sai deste fluxo operacional.
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar}>
            <ShieldCheck className="h-4 w-4" /> Registrar decisão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TriagemEnfermagemDialog({
  solicitacao,
  onClose,
}: {
  solicitacao: Solicitacao;
  onClose: () => void;
}) {
  const { registrarTriagemEnfermagem } = useCore();
  const [contatoOrigem, setContatoOrigem] = useState(
    solicitacao.triagemEnfermagem?.contatoOrigem ?? "",
  );
  const [observacoes, setObservacoes] = useState(solicitacao.triagemEnfermagem?.observacoes ?? "");

  const salvar = () => {
    try {
      registrarTriagemEnfermagem(solicitacao.id, { contatoOrigem, observacoes });
      toast.success("Triagem de enfermagem registrada.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Triagem de enfermagem — {solicitacao.protocolo}</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border bg-card p-3 text-sm">
          <div className="font-medium">{solicitacao.pacienteNome}</div>
          <div className="text-xs text-muted-foreground">
            {solicitacao.unidadeOrigem} • {solicitacao.macrorregiaoOrigem} • {solicitacao.cid}
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium">Contato realizado pela enfermagem</Label>
          <Textarea
            rows={2}
            value={contatoOrigem}
            onChange={(e) => setContatoOrigem(e.target.value)}
            placeholder="Ex.: contato telefônico/e-mail com unidade de origem para complementar laudo, exames ou dados operacionais."
          />
        </div>
        <div>
          <Label className="text-xs font-medium">Observações da triagem de enfermagem</Label>
          <Textarea
            rows={4}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Registre informações objetivas do contato, pendências documentais e encaminhamentos operacionais."
          />
        </div>

        <div className="rounded-md border border-info/30 bg-info/10 p-3 text-xs text-info">
          Este registro é operacional. O parecer técnico e a decisão de compra, vaga zero, leito
          extra ou indeferimento continuam sendo exclusivos da autoridade sanitária.
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar}>
            <ClipboardCheck className="h-4 w-4" /> Registrar triagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CampoRotulado({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{valor}</div>
    </div>
  );
}
