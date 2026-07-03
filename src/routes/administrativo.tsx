import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BedDouble,
  CheckCircle2,
  FileText,
  FolderPlus,
  Send,
} from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PerfilGate } from "@/components/perfil-gate";
import { useCore } from "@/lib/core-store";
import { HOSPITAIS_CREDENCIADOS, type Solicitacao } from "@/lib/core-types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { StatusBadge } from "@/lib/status-badge";

export const Route = createFileRoute("/administrativo")({
  head: () => ({ meta: [{ title: "Administrativo / SEI — CORE/MG" }] }),
  component: AdministrativoPage,
});

function AdministrativoPage() {
  const { solicitacoes } = useCore();

  const confirmados = useMemo(
    () => solicitacoes.filter((s) => s.status === "LEITO_CONFIRMADO_ENFERMAGEM"),
    [solicitacoes],
  );
  const seiIniciados = useMemo(
    () => solicitacoes.filter((s) => s.status === "PROCESSO_SEI_INICIADO"),
    [solicitacoes],
  );
  const comprados = useMemo(
    () => solicitacoes.filter((s) => s.status === "LEITO_COMPRADO"),
    [solicitacoes],
  );
  const internados = useMemo(
    () => solicitacoes.filter((s) => s.status === "INTERNADO"),
    [solicitacoes],
  );
  const pagamento = useMemo(
    () => solicitacoes.filter((s) => s.status === "PROCESSO_FINANCEIRO_EM_PAGAMENTO"),
    [solicitacoes],
  );

  const [seiAberta, setSeiAberta] = useState<Solicitacao | null>(null);
  const [compraAberta, setCompraAberta] = useState<Solicitacao | null>(null);
  const [faturaAberta, setFaturaAberta] = useState<Solicitacao | null>(null);

  return (
    <PerfilGate permitido={["ADMINISTRATIVO"]}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Setor de Compras / Contratos</h1>
          <p className="text-sm text-muted-foreground">
            Estruturação do processo SEI, empenho, internação e envio de faturas.
          </p>
        </div>

        {/* SEI pendente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aguardando abertura de Processo SEI</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Hospital escolhido</TableHead>
                  <TableHead>Termo</TableHead>
                  <TableHead>Confirmado em</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmados.map((s) => {
                  const h = HOSPITAIS_CREDENCIADOS.find(
                    (x) => x.id === s.escolhaEnfermagem?.hospitalId,
                  );
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                      <TableCell className="font-medium">{s.pacienteNome}</TableCell>
                      <TableCell className="text-xs">{h?.nome ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.autorizacao?.termoNumero}
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.escolhaEnfermagem && formatDateTime(s.escolhaEnfermagem.confirmadoEm)}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => setSeiAberta(s)}>
                          <FolderPlus className="h-4 w-4" /> Estruturar SEI
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {confirmados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum caso aguardando SEI.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* SEI aberto — registrar compra */}
        {seiIniciados.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Processos SEI abertos • Registrar empenho/compra
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>SEI</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seiIniciados.map((s) => {
                    const h = HOSPITAIS_CREDENCIADOS.find(
                      (x) => x.id === s.escolhaEnfermagem?.hospitalId,
                    );
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                        <TableCell className="font-mono text-xs">{s.numeroSeiProcesso}</TableCell>
                        <TableCell>{s.pacienteNome}</TableCell>
                        <TableCell className="text-xs">{h?.nome}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => setCompraAberta(s)}>
                            <BedDouble className="h-4 w-4" /> Registrar compra
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Compras — confirmar internação */}
        {comprados.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Compras registradas • Confirmar internação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Empenho</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Diária</TableHead>
                    <TableHead>Internação prevista</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comprados.map((s) => {
                    const h = HOSPITAIS_CREDENCIADOS.find((x) => x.id === s.compra?.hospitalId);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                        <TableCell className="font-mono text-xs">{s.compra?.empenho}</TableCell>
                        <TableCell className="text-xs">{h?.nome}</TableCell>
                        <TableCell>{formatCurrency(s.compra?.valorDiaria ?? 0)}</TableCell>
                        <TableCell className="text-xs">
                          {s.compra && formatDateTime(s.compra.internacaoEm)}
                        </TableCell>
                        <TableCell>
                          <ConfirmarInternacao id={s.id} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pós-internação — envio de faturas */}
        {internados.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Pós-internação • Encaminhar contas e faturas ao Setor de Compras
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>SEI</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {internados.map((s) => {
                    const h = HOSPITAIS_CREDENCIADOS.find((x) => x.id === s.compra?.hospitalId);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                        <TableCell>{s.pacienteNome}</TableCell>
                        <TableCell className="text-xs">{h?.nome}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.numeroSeiProcesso ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => setFaturaAberta(s)}>
                            <Send className="h-4 w-4" /> Encaminhar faturas
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Em pagamento */}
        {pagamento.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Em processo financeiro (auditoria e liquidação)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {pagamento.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border bg-card p-2"
                  >
                    <div>
                      <div className="font-medium">{s.protocolo} — {s.pacienteNome}</div>
                      <div className="text-xs text-muted-foreground">
                        SEI {s.numeroSeiProcesso ?? "—"} • enviado em{" "}
                        {s.envioFaturas && formatDateTime(s.envioFaturas.enviadoEm)}
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {seiAberta && <SeiDialog solicitacao={seiAberta} onClose={() => setSeiAberta(null)} />}
        {compraAberta && (
          <ComprarDialog solicitacao={compraAberta} onClose={() => setCompraAberta(null)} />
        )}
        {faturaAberta && (
          <FaturaDialog solicitacao={faturaAberta} onClose={() => setFaturaAberta(null)} />
        )}
      </div>
    </PerfilGate>
  );
}

function ConfirmarInternacao({ id }: { id: string }) {
  const { registrarInternacao } = useCore();
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => {
        try {
          registrarInternacao(id);
          toast.success("Internação confirmada.");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Erro");
        }
      }}
    >
      <CheckCircle2 className="h-4 w-4" /> Confirmar internação
    </Button>
  );
}

function SeiDialog({ solicitacao, onClose }: { solicitacao: Solicitacao; onClose: () => void }) {
  const { abrirProcessoSei } = useCore();
  const [numero, setNumero] = useState("");
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);

  const salvar = () => {
    if (numero.trim().length < 6) return toast.error("Informe o Nº do Processo SEI.");
    try {
      abrirProcessoSei(solicitacao.id, {
        numeroSeiProcesso: numero,
        checkLaudoPaciente: c1,
        checkTermoAcionamento: c2,
        checkTermoEsgotamentoSus: c3,
      });
      toast.success("Processo SEI aberto.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Estruturação SEI — {solicitacao.protocolo}</DialogTitle>
        </DialogHeader>

        <div>
          <Label className="text-xs font-medium">Número do Processo SEI</Label>
          <Input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Ex.: 1320.01.0001234/2026-56"
          />
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <div className="mb-1 text-xs font-medium">Checklist documental obrigatório</div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={c1} onCheckedChange={(v) => setC1(Boolean(v))} />
            <span>
              <FileText className="mr-1 inline h-3.5 w-3.5" /> Laudo do Paciente
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={c2} onCheckedChange={(v) => setC2(Boolean(v))} />
            <span>
              <FileText className="mr-1 inline h-3.5 w-3.5" /> Termo de Acionamento da Autoridade
              Sanitária
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={c3} onCheckedChange={(v) => setC3(Boolean(v))} />
            <span>
              <FileText className="mr-1 inline h-3.5 w-3.5" /> Termo de Esgotamento SUS
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!c1 || !c2 || !c3}>
            Abrir Processo SEI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ComprarDialog({
  solicitacao,
  onClose,
}: {
  solicitacao: Solicitacao;
  onClose: () => void;
}) {
  const { registrarCompra } = useCore();
  const hospitalPreEscolhido = solicitacao.escolhaEnfermagem?.hospitalId ?? "";
  const [hospitalId, setHospitalId] = useState<string>(hospitalPreEscolhido);
  const [valor, setValor] = useState("");
  const [empenho, setEmpenho] = useState("");
  const [internacao, setInternacao] = useState(new Date().toISOString().slice(0, 16));

  const salvar = () => {
    if (!hospitalId || !valor || !empenho) {
      toast.error("Preencha hospital, valor da diária e nº do empenho.");
      return;
    }
    try {
      registrarCompra(solicitacao.id, {
        hospitalId,
        valorDiaria: Number(valor),
        empenho,
        internacaoEm: new Date(internacao).toISOString(),
      });
      toast.success("Compra do leito registrada.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar compra — {solicitacao.protocolo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 rounded-md bg-muted/40 p-3 text-sm">
          <div>
            <strong>Paciente:</strong> {solicitacao.pacienteNome}
          </div>
          <div>
            <strong>SEI:</strong>{" "}
            <span className="font-mono">{solicitacao.numeroSeiProcesso}</span>
          </div>
          <div>
            <strong>Hospital confirmado pela Enfermagem:</strong>{" "}
            {HOSPITAIS_CREDENCIADOS.find((h) => h.id === hospitalPreEscolhido)?.nome ?? "—"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium">Valor da diária (R$)</Label>
            <Input
              type="number"
              min={0}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ex.: 4800"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Nº empenho / guia</Label>
            <Input value={empenho} onChange={(e) => setEmpenho(e.target.value)} placeholder="EMP-…" />
          </div>
        </div>
        <div>
          <Label className="text-xs font-medium">Data/hora da internação prevista</Label>
          <Input
            type="datetime-local"
            value={internacao}
            onChange={(e) => setInternacao(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar}>Registrar compra</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FaturaDialog({
  solicitacao,
  onClose,
}: {
  solicitacao: Solicitacao;
  onClose: () => void;
}) {
  const { enviarFaturasParaCompras } = useCore();
  const [obs, setObs] = useState("");

  const enviar = () => {
    if (obs.trim().length < 10) return toast.error("Descreva o conteúdo enviado (mín. 10 caracteres).");
    try {
      enviarFaturasParaCompras(solicitacao.id, obs);
      toast.success("Faturas encaminhadas para auditoria e liquidação.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Encaminhar faturas — {solicitacao.protocolo}</DialogTitle>
        </DialogHeader>
        <div className="rounded-md border border-info/30 bg-info/10 p-3 text-xs text-info">
          Ao encaminhar, o processo entra em auditoria e liquidação financeira.
        </div>
        <div>
          <Label className="text-xs font-medium">Observações / documentos anexos</Label>
          <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={enviar}>
            <Send className="h-4 w-4" /> Encaminhar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
