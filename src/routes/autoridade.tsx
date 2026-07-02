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
import { USUARIOS_MOCK, type Solicitacao } from "@/lib/core-types";
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
          <h1 className="text-2xl font-bold tracking-tight">Homologação de Compra Extraordinária</h1>
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
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
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

        <div className="space-y-3 rounded-md border bg-card p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Paciente</div>
            <div className="font-medium">{solicitacao.pacienteNome} • CPF {solicitacao.pacienteCpf}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Clínica indicada</div>
            <div className="font-medium">{solicitacao.parecer?.clinicaIndicada}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Parecer técnico</div>
            <div>{solicitacao.parecer?.parecerTecnico}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Vaga Zero</div>
            <div>{solicitacao.parecer?.vagaZeroDetalhe || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Emitido por</div>
            <div>{regulador?.nome} • CPF {regulador?.cpf}</div>
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium">Observações da Autoridade Sanitária</Label>
          <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>

        <div className="rounded-md border border-info/30 bg-info/10 p-3 text-xs text-info">
          Ao clicar em "Assinar", será gerado o Termo de Acionamento com carimbo digital
          contendo seu CPF, data e hora.
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={assinar}>
            <ShieldCheck className="h-4 w-4" /> Assinar Termo de Acionamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
