import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PenLine, ShieldCheck } from "lucide-react";

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
 main
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
  const { solicitacoes } = useCore();
  const [aberta, setAberta] = useState<Solicitacao | null>(null);

  const fila = useMemo(
    () =>
      solicitacoes.filter((s) =>
        ["AGUARDANDO_REGULACAO", "AGUARDANDO_VAGA_ZERO", "PARECER_EMITIDO"].includes(s.status),
      ),
    [solicitacoes],
  );

  return (
    <PerfilGate permitido={["AUTORIDADE"]}>
      <div className="space-y-4">
        <div>
 main
          <p className="text-sm text-muted-foreground">
            A autoridade sanitária avalia os dados clínicos cadastrados e decide se o desfecho é
            compra excepcional, Vaga Zero, Leito Extra SUS ou indeferimento.
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
                        <Button size="sm" onClick={() => setAberta(s)}>
                          <PenLine className="h-4 w-4" /> Avaliar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {fila.length === 0 && (
                  <TableRow>
                    <TableCell
main
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {aberta && <AvaliarDialog solicitacao={aberta} onClose={() => setAberta(null)} />}
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
main
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

 main
        </div>

        <div>
          <Label className="text-xs font-medium">Fundamentação / observações</Label>
          <Textarea rows={4} value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>

        <div className="rounded-md border border-info/30 bg-info/10 p-3 text-xs text-info">
 main
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
 main
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
