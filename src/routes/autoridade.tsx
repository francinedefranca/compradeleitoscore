import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Lock, PenLine } from "lucide-react";

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
import { GRAVIDADE_META, USUARIOS_MOCK, type Solicitacao } from "@/lib/core-types";
import { formatDateTime } from "@/lib/formatters";

export const Route = createFileRoute("/autoridade")({
  head: () => ({ meta: [{ title: "Homologação — Autoridade Sanitária" }] }),
  component: AutoridadePage,
});

function AutoridadePage() {
  const { solicitacoes, usuarioAtual } = useCore();
  const [aberta, setAberta] = useState<Solicitacao | null>(null);

  const fila = useMemo(
    () => solicitacoes.filter((s) => s.status === "PARECER_EMITIDO"),
    [solicitacoes],
  );

  return (
    <PerfilGate permitido={["AUTORIDADE"]}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Homologação de Compra Extraordinária
          </h1>
          <p className="text-sm text-muted-foreground">
            Assinatura eletrônica do Termo de Acionamento pela Autoridade Sanitária.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Clínica indicada</TableHead>
                  <TableHead>Parecer emitido por</TableHead>
                  <TableHead>Data do parecer</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fila.map((s) => {
                  const regulador = USUARIOS_MOCK.find((u) => u.id === s.parecer?.reguladorId);
                  const conflito = s.parecer?.reguladorId === usuarioAtual.id;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                      <TableCell className="font-medium">{s.pacienteNome}</TableCell>
                      <TableCell>{s.parecer?.clinicaIndicada}</TableCell>
                      <TableCell>
                        {regulador?.nome}
                        <div className="text-xs text-muted-foreground">CPF {regulador?.cpf}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.parecer && formatDateTime(s.parecer.emitidoEm)}
                      </TableCell>
                      <TableCell>
                        {conflito ? (
                          <div className="flex items-center gap-1 text-xs font-medium text-destructive">
                            <Lock className="h-3 w-3" /> Bloqueado (autor do parecer)
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => setAberta(s)}>
                            <PenLine className="h-4 w-4" /> Homologar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {fila.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Nenhum parecer aguardando homologação.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {aberta && <HomologarDialog solicitacao={aberta} onClose={() => setAberta(null)} />}
      </div>
    </PerfilGate>
  );
}

function HomologarDialog({
  solicitacao,
  onClose,
}: {
  solicitacao: Solicitacao;
  onClose: () => void;
}) {
  const { autorizarCompra } = useCore();
  const [obs, setObs] = useState("");
  const regulador = USUARIOS_MOCK.find((u) => u.id === solicitacao.parecer?.reguladorId);
  const cadastrador = USUARIOS_MOCK.find((u) => u.id === solicitacao.solicitanteId);
  const gravidade = GRAVIDADE_META[solicitacao.gravidade];

  const assinar = () => {
    try {
      autorizarCompra(solicitacao.id, { observacoes: obs });
      toast.success("Termo de Acionamento assinado digitalmente.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Termo de Acionamento — {solicitacao.protocolo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 rounded-md border bg-card p-4 text-sm">
          <section>
            <h3 className="mb-2 text-sm font-semibold">Dados do cadastro e da origem</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <CampoRotulado label="Cadastrado por" valor={cadastrador?.nome ?? "—"} />
              <CampoRotulado label="Unidade solicitante/origem" valor={solicitacao.unidadeOrigem} />
              <CampoRotulado label="CNES da unidade" valor={solicitacao.cnesUnidadeOrigem ?? "—"} />
              <CampoRotulado label="Município de origem" valor={solicitacao.municipioOrigem} />
              <CampoRotulado label="Macrorregião PDR" valor={solicitacao.macrorregiaoOrigem} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">
              Dados do paciente cadastrados no fluxo interno
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <CampoRotulado label="Paciente" valor={solicitacao.pacienteNome} />
              <CampoRotulado label="CPF" valor={solicitacao.pacienteCpf} />
              <CampoRotulado label="CNS" valor={solicitacao.pacienteCns} />
              <CampoRotulado label="Nascimento" valor={solicitacao.pacienteNascimento} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">Dados clínico-regulatórios</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <CampoRotulado label="Gravidade" valor={gravidade.label} />
              <CampoRotulado label="Diagnóstico" valor={solicitacao.diagnosticoPrincipal} />
              <CampoRotulado label="CID" valor={solicitacao.cid} />
              <CampoRotulado
                label="Tipo de leito indicado"
                valor={solicitacao.parecer?.clinicaIndicada ?? "—"}
              />
              <CampoRotulado
                label="Sinais vitais"
                valor={`PA ${solicitacao.sinaisVitais.pa}; FC ${solicitacao.sinaisVitais.fc}; FR ${solicitacao.sinaisVitais.fr}; SpO2 ${solicitacao.sinaisVitais.spo2}; T ${solicitacao.sinaisVitais.temp}`}
              />
              <CampoRotulado
                label="Justificativa da hipótese de compra"
                valor={solicitacao.justificativa}
              />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">Parecer do médico regulador</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <CampoRotulado
                label="Parecer técnico"
                valor={solicitacao.parecer?.parecerTecnico ?? "—"}
              />
              <CampoRotulado
                label="Vaga Zero / esgotamento SUS"
                valor={solicitacao.parecer?.vagaZeroDetalhe || "—"}
              />
              <CampoRotulado
                label="Regulador"
                valor={`${regulador?.nome ?? "—"} • CPF ${regulador?.cpf ?? "—"}`}
              />
              <CampoRotulado
                label="Data do parecer"
                valor={solicitacao.parecer ? formatDateTime(solicitacao.parecer.emitidoEm) : "—"}
              />
            </div>
          </section>
        </div>

        <div>
          <Label className="text-xs font-medium">Observações da Autoridade Sanitária</Label>
          <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>

        <div className="rounded-md border border-info/30 bg-info/10 p-3 text-xs text-info">
          Ao clicar em "Assinar", será gerado o Termo de Acionamento com carimbo digital contendo
          seu CPF, data e hora.
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={assinar}>
            <ShieldCheck className="h-4 w-4" /> Assinar Termo de Acionamento
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
