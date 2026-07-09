import { useState } from "react";
import { toast } from "sonner";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useCore } from "@/lib/core-store";
import {
  CANAL_CONTATO_LABEL,
  ESCOPOS_BUSCA,
  ESCOPO_BUSCA_LABEL,
  RESULTADO_CONTATO_LABEL,
  MOTIVO_RECUSA_LABEL,
  type CanalContato,
  type EscopoBusca,
  type MotivoRecusa,
  type ResultadoContato,
  type Solicitacao,
} from "@/lib/core-types";
import { formatDateTime } from "@/lib/formatters";

export function RegistroTentativaContato({ solicitacao }: { solicitacao: Solicitacao }) {
  const { registrarContato } = useCore();
  const historico = solicitacao.historicoContatos ?? [];

  const [hospitalNome, setHospitalNome] = useState("");
  const [dataHora, setDataHora] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
  );
  const [canal, setCanal] = useState<CanalContato>("TELEFONE");
  const [resultado, setResultado] = useState<ResultadoContato>("SEM_RESPOSTA");
  const [motivoRecusa, setMotivoRecusa] = useState<MotivoRecusa>("SEM_LEITO_DISPONIVEL");
  const [justificativaRecusa, setJustificativaRecusa] = useState("");
  const [escopo, setEscopo] = useState<EscopoBusca>(
    solicitacao.escopoBuscaAtual ?? "MACRO_ORIGEM",
  );

  const salvar = () => {
    if (!hospitalNome.trim()) {
      toast.error("Informe o hospital contatado.");
      return;
    }
    if (resultado === "RECUSA" && !justificativaRecusa.trim()) {
      toast.error("Justificativa é obrigatória em caso de recusa.");
      return;
    }
    try {
      registrarContato(solicitacao.id, {
        hospitalNome: hospitalNome.trim(),
        dataHoraContato: new Date(dataHora).toISOString(),
        canal,
        resultado,
        motivoRecusa: resultado === "RECUSA" ? motivoRecusa : undefined,
        justificativaRecusa:
          resultado === "RECUSA" ? justificativaRecusa.trim() : undefined,
        escopoBusca: escopo,
      });
      toast.success("Tentativa de contato registrada.");
      setHospitalNome("");
      setJustificativaRecusa("");
      setResultado("SEM_RESPOSTA");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao registrar contato");
    }
  };

  return (
    <Card className="border-info/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Phone className="h-4 w-4 text-info" /> Registro de Tentativa de Contato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">Hospital contatado</Label>
            <Input
              value={hospitalNome}
              onChange={(e) => setHospitalNome(e.target.value)}
              placeholder="Nome do hospital"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Data/Hora do contato</Label>
            <Input
              type="datetime-local"
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Canal</Label>
            <Select value={canal} onValueChange={(v) => setCanal(v as CanalContato)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CANAL_CONTATO_LABEL) as CanalContato[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CANAL_CONTATO_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium">Escopo da busca</Label>
            <Select value={escopo} onValueChange={(v) => setEscopo(v as EscopoBusca)}>
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
            <Label className="text-xs font-medium">Resultado</Label>
            <Select
              value={resultado}
              onValueChange={(v) => setResultado(v as ResultadoContato)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RESULTADO_CONTATO_LABEL) as ResultadoContato[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {RESULTADO_CONTATO_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {resultado === "RECUSA" && (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs font-medium">Motivo padronizado da recusa</Label>
              <Select
                value={motivoRecusa}
                onValueChange={(v) => setMotivoRecusa(v as MotivoRecusa)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(MOTIVO_RECUSA_LABEL) as MotivoRecusa[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {MOTIVO_RECUSA_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Justificativa técnica</Label>
              <Textarea
                value={justificativaRecusa}
                onChange={(e) => setJustificativaRecusa(e.target.value)}
                placeholder="Descreva a justificativa da recusa"
                rows={2}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button size="sm" onClick={salvar}>
            Registrar contato
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(historico) && historico.length > 0 ? (
                historico.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-xs">{formatDateTime(h.dataHoraContato)}</TableCell>
                    <TableCell className="text-xs">{h.hospitalNome}</TableCell>
                    <TableCell className="text-xs">{ESCOPO_BUSCA_LABEL[h.escopoBusca]}</TableCell>
                    <TableCell className="text-xs">
                      {RESULTADO_CONTATO_LABEL[h.resultado]}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs">
                    Nenhum contato registrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
