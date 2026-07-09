import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BedDouble, CheckCircle2, FileText, FolderPlus, Send } from "lucide-react";

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

function hospitalDoCaso(s: Solicitacao) {
  return HOSPITAIS_CREDENCIADOS.find(
    (h) => h.id === (s.compra?.hospitalId ?? s.escolhaEnfermagem?.hospitalId),
  );
}

function AdministrativoPage() {
  const { solicitacoes, usuarioAtual } = useCore();
  const somenteLeitura = usuarioAtual.perfil === "GESTAO";
  const isCore = usuarioAtual.perfil === "ADMINISTRATIVO_CORE";
  const isCompras = usuarioAtual.perfil === "ADMINISTRATIVO";

  const aguardandoInternacao = useMemo(
    () => solicitacoes.filter((s) => s.status === "LEITO_CONFIRMADO_ENFERMAGEM"),
    [solicitacoes],
  );
  const aguardandoSei = useMemo(
    () => solicitacoes.filter((s) => s.status === "INTERNADO"),
    [solicitacoes],
  );
  const seiIniciados = useMemo(
    () => solicitacoes.filter((s) => s.status === "PROCESSO_SEI_INICIADO"),
    [solicitacoes],
  );
  const faturamentoRegistrado = useMemo(
    () => solicitacoes.filter((s) => s.status === "LEITO_COMPRADO"),
    [solicitacoes],
  );
  const pagamento = useMemo(
    () => solicitacoes.filter((s) => s.status === "PROCESSO_FINANCEIRO_EM_PAGAMENTO"),
    [solicitacoes],
  );

  // CORE administra tudo até enviar; Compras vê apenas o pacote recebido.
  const mostrarBlocosCore = !isCompras;
  const mostrarBlocoCompras = !isCore;

  const [seiAberta, setSeiAberta] = useState<Solicitacao | null>(null);
  const [compraAberta, setCompraAberta] = useState<Solicitacao | null>(null);
  const [faturaAberta, setFaturaAberta] = useState<Solicitacao | null>(null);


  return (
    <PerfilGate permitido={["ADMINISTRATIVO", "ADMINISTRATIVO_CORE", "GESTAO"]}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isCompras ? "Setor de Compras / Pagamentos" : "Administrativo CORE / SEI"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isCompras
              ? "Pacotes documentais recebidos do Administrativo CORE para liquidação e pagamento."
              : "O Administrativo CORE confirma internação, acompanha as buscas, recebe as faturas dos hospitais e envia o pacote documental completo (laudo, termo de acionamento, termo de esgotamento SUS e decisão judicial, quando houver) para o Setor de Compras."}
            {somenteLeitura && " Gestão acessa esta tela em modo de visualização."}
          </p>
        </div>


        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aguardando confirmação de internação</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Hospital escolhido</TableHead>
                  <TableHead>Termo</TableHead>
                  <TableHead>Leito confirmado em</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aguardandoInternacao.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                    <TableCell className="font-medium">{s.pacienteNome}</TableCell>
                    <TableCell className="text-xs">{hospitalDoCaso(s)?.nome ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {s.autorizacao?.termoNumero}
                    </TableCell>
                    <TableCell className="text-xs">
                      {s.escolhaEnfermagem && formatDateTime(s.escolhaEnfermagem.confirmadoEm)}
                    </TableCell>
                    <TableCell>
                      {somenteLeitura ? (
                        <span className="text-xs text-muted-foreground">Somente leitura</span>
                      ) : (
                        <ConfirmarInternacao id={s.id} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {aguardandoInternacao.length === 0 && <LinhaVazia colSpan={6} />}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pacientes internados • Aguardando SEI</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Processo judicial</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aguardandoSei.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                    <TableCell>{s.pacienteNome}</TableCell>
                    <TableCell className="text-xs">{hospitalDoCaso(s)?.nome}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {s.judicial?.numeroProcesso ?? "—"}
                    </TableCell>
                    <TableCell>
                      {somenteLeitura ? (
                        <span className="text-xs text-muted-foreground">Somente leitura</span>
                      ) : (
                        <Button size="sm" onClick={() => setSeiAberta(s)}>
                          <FolderPlus className="h-4 w-4" /> Estruturar SEI
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {aguardandoSei.length === 0 && <LinhaVazia colSpan={5} />}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {seiIniciados.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Processos SEI abertos • Registrar faturamento
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
                  {seiIniciados.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                      <TableCell className="font-mono text-xs">{s.numeroSeiProcesso}</TableCell>
                      <TableCell>{s.pacienteNome}</TableCell>
                      <TableCell className="text-xs">{hospitalDoCaso(s)?.nome}</TableCell>
                      <TableCell>
                        {somenteLeitura ? (
                          <span className="text-xs text-muted-foreground">Somente leitura</span>
                        ) : (
                          <Button size="sm" onClick={() => setCompraAberta(s)}>
                            <BedDouble className="h-4 w-4" /> Registrar faturamento
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {faturamentoRegistrado.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Faturamento registrado • Encaminhar contas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Empenho</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Diárias</TableHead>
                    <TableHead>Valor previsto</TableHead>
                    <TableHead>OPME</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faturamentoRegistrado.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                      <TableCell className="font-mono text-xs">{s.compra?.empenho}</TableCell>
                      <TableCell className="text-xs">{hospitalDoCaso(s)?.nome}</TableCell>
                      <TableCell>{s.compra?.diariasCobradas ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(s.compra?.valorPrevistoHospital ?? 0)}</TableCell>
                      <TableCell>{s.compra?.houveOpme ? "Sim" : "Não"}</TableCell>
                      <TableCell>
                        {somenteLeitura ? (
                          <span className="text-xs text-muted-foreground">Somente leitura</span>
                        ) : (
                          <Button size="sm" onClick={() => setFaturaAberta(s)}>
                            <Send className="h-4 w-4" /> Encaminhar faturas
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {pagamento.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Em processo financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {pagamento.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border bg-card p-2"
                  >
                    <div>
                      <div className="font-medium">
                        {s.protocolo} — {s.pacienteNome}
                      </div>
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

function LinhaVazia({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-6 text-center text-sm text-muted-foreground">
        Nenhum caso nesta etapa.
      </TableCell>
    </TableRow>
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
          toast.success("Internação confirmada. Agora o SEI pode ser aberto.");
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
  const [c4, setC4] = useState(false);
  const exigeDecisaoJudicial = Boolean(solicitacao.judicial?.numeroProcesso);

  const salvar = () => {
    if (numero.trim().length < 6) return toast.error("Informe o Nº do Processo SEI.");
    try {
      abrirProcessoSei(solicitacao.id, {
        numeroSeiProcesso: numero,
        checkLaudoPaciente: c1,
        checkTermoAcionamento: c2,
        checkTermoEsgotamentoSus: c3,
        checkDecisaoJudicial: exigeDecisaoJudicial ? c4 : undefined,
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
          <CheckItem checked={c1} onChange={setC1} label="Laudo do Paciente" />
          <CheckItem
            checked={c2}
            onChange={setC2}
            label="Termo de Acionamento da Autoridade Sanitária"
          />
          <CheckItem checked={c3} onChange={setC3} label="Termo de Esgotamento SUS" />
          {exigeDecisaoJudicial && (
            <CheckItem
              checked={c4}
              onChange={setC4}
              label={`Decisão judicial anexada ao SEI — processo ${solicitacao.judicial?.numeroProcesso}`}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!c1 || !c2 || !c3 || (exigeDecisaoJudicial && !c4)}>
            Abrir Processo SEI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckItem({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      <span>
        <FileText className="mr-1 inline h-3.5 w-3.5" /> {label}
      </span>
    </label>
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
  const [diarias, setDiarias] = useState("1");
  const [valorPrevisto, setValorPrevisto] = useState("");
  const [empenho, setEmpenho] = useState("");
  const [internacao, setInternacao] = useState(new Date().toISOString().slice(0, 16));
  const [houveOpme, setHouveOpme] = useState(false);
  const [descricaoOpme, setDescricaoOpme] = useState("");
  const [outrosGastos, setOutrosGastos] = useState("");

  const salvar = () => {
    if (!hospitalId || !valor || !diarias || !valorPrevisto || !empenho) {
      toast.error("Preencha hospital, diária, dias cobrados, valor previsto e nº do empenho.");
      return;
    }
    try {
      registrarCompra(solicitacao.id, {
        hospitalId,
        valorDiaria: Number(valor),
        diariasCobradas: Number(diarias),
        valorPrevistoHospital: Number(valorPrevisto),
        empenho,
        internacaoEm: new Date(internacao).toISOString(),
        houveOpme,
        descricaoOpme: descricaoOpme || undefined,
        outrosGastos: outrosGastos || undefined,
      });
      toast.success("Dados de faturamento/compra registrados.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar faturamento/compra — {solicitacao.protocolo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 rounded-md bg-muted/40 p-3 text-sm">
          <div>
            <strong>Paciente:</strong> {solicitacao.pacienteNome}
          </div>
          <div>
            <strong>SEI:</strong> <span className="font-mono">{solicitacao.numeroSeiProcesso}</span>
          </div>
          <div>
            <strong>Hospital confirmado:</strong>{" "}
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
            <Label className="text-xs font-medium">Dias de diária cobrados</Label>
            <Input
              type="number"
              min={1}
              value={diarias}
              onChange={(e) => setDiarias(e.target.value)}
              placeholder="Ex.: 3"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Valor previsto pelo hospital (R$)</Label>
            <Input
              type="number"
              min={0}
              value={valorPrevisto}
              onChange={(e) => setValorPrevisto(e.target.value)}
              placeholder="Ex.: 14400"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Nº empenho / guia</Label>
            <Input
              value={empenho}
              onChange={(e) => setEmpenho(e.target.value)}
              placeholder="EMP-…"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs font-medium">Data/hora da internação confirmada</Label>
          <Input
            type="datetime-local"
            value={internacao}
            onChange={(e) => setInternacao(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={houveOpme} onCheckedChange={(v) => setHouveOpme(Boolean(v))} />
          Houve necessidade de OPME durante a internação
        </label>
        {houveOpme && (
          <div>
            <Label className="text-xs font-medium">Descrição da OPME</Label>
            <Textarea
              rows={2}
              value={descricaoOpme}
              onChange={(e) => setDescricaoOpme(e.target.value)}
            />
          </div>
        )}
        <div>
          <Label className="text-xs font-medium">Outros gastos relevantes</Label>
          <Textarea
            rows={2}
            value={outrosGastos}
            onChange={(e) => setOutrosGastos(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar}>Registrar faturamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FaturaDialog({ solicitacao, onClose }: { solicitacao: Solicitacao; onClose: () => void }) {
  const { enviarFaturasParaCompras } = useCore();
  const [obs, setObs] = useState("");

  const enviar = () => {
    if (obs.trim().length < 10)
      return toast.error("Descreva o conteúdo enviado (mín. 10 caracteres).");
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
