import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BedDouble, CheckCircle2, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useCore } from "@/lib/core-store";
import { HOSPITAIS_CREDENCIADOS, type Solicitacao } from "@/lib/core-types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { StatusBadge } from "@/lib/status-badge";

export const Route = createFileRoute("/administrativo")({
  head: () => ({ meta: [{ title: "Setor de Compras — CORE/MG" }] }),
  component: AdministrativoPage,
});

function AdministrativoPage() {
  const { solicitacoes } = useCore();
  const [aberta, setAberta] = useState<Solicitacao | null>(null);

  const autorizadas = useMemo(
    () => solicitacoes.filter((s) => s.status === "AUTORIZADO_AUTORIDADE"),
    [solicitacoes],
  );
  const compradas = useMemo(
    () => solicitacoes.filter((s) => s.status === "LEITO_COMPRADO"),
    [solicitacoes],
  );

  return (
    <PerfilGate permitido={["ADMINISTRATIVO"]}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Setor de Compras / Contratos</h1>
          <p className="text-sm text-muted-foreground">
            Compras autorizadas pela Autoridade Sanitária aguardando execução.
          </p>
        </div>

        {autorizadas.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">
            <ShoppingBag className="mt-0.5 h-4 w-4" />
            <span className="font-medium">
              {autorizadas.length} compra(s) autorizada(s) aguardando ação.
            </span>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Termo</TableHead>
                  <TableHead>Assinado em</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {autorizadas.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                    <TableCell className="font-medium">{s.pacienteNome}</TableCell>
                    <TableCell>{s.parecer?.clinicaIndicada}</TableCell>
                    <TableCell className="font-mono text-xs">{s.autorizacao?.termoNumero}</TableCell>
                    <TableCell className="text-xs">
                      {s.autorizacao && formatDateTime(s.autorizacao.assinadoEm)}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setAberta(s)}>
                        <BedDouble className="h-4 w-4" /> Registrar compra
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {autorizadas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma compra autorizada aguardando.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {compradas.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="border-b p-3 text-sm font-semibold">
                Leitos comprados aguardando confirmação de internação
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Empenho</TableHead>
                    <TableHead>Diária</TableHead>
                    <TableHead>Internação prevista</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compradas.map((s) => {
                    const h = HOSPITAIS_CREDENCIADOS.find((x) => x.id === s.compra?.hospitalId);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                        <TableCell>{h?.nome}</TableCell>
                        <TableCell className="font-mono text-xs">{s.compra?.empenho}</TableCell>
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

        {aberta && <ComprarDialog solicitacao={aberta} onClose={() => setAberta(null)} />}
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

function ComprarDialog({
  solicitacao,
  onClose,
}: {
  solicitacao: Solicitacao;
  onClose: () => void;
}) {
  const { registrarCompra } = useCore();
  const [hospitalId, setHospitalId] = useState<string>("");
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

  const clinicaIndicada = solicitacao.parecer?.clinicaIndicada;
  const hospitaisFiltrados = HOSPITAIS_CREDENCIADOS;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar compra — {solicitacao.protocolo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 rounded-md bg-muted/40 p-3 text-sm">
          <div><strong>Paciente:</strong> {solicitacao.pacienteNome}</div>
          <div><strong>Clínica indicada:</strong> {clinicaIndicada}</div>
          <div><strong>Termo:</strong> <span className="font-mono">{solicitacao.autorizacao?.termoNumero}</span></div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium">Hospital privado credenciado</Label>
            <Select value={hospitalId} onValueChange={setHospitalId}>
              <SelectTrigger><SelectValue placeholder="Selecione o prestador" /></SelectTrigger>
              <SelectContent>
                {hospitaisFiltrados.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.nome} — {h.municipio}/{h.macrorregiao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Input value={empenho} onChange={(e) => setEmpenho(e.target.value)} placeholder="EMP-…"/>
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium">Data/hora da internação efetiva</Label>
            <Input
              type="datetime-local"
              value={internacao}
              onChange={(e) => setInternacao(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar}>Registrar compra</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
