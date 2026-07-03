import { useState } from "react";
import { toast } from "sonner";
import { Phone, Mail, Plus } from "lucide-react";

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
  type CanalContato,
  type EscopoBusca,
  type ResultadoContato,
  type Solicitacao,
} from "@/lib/core-types";
import { formatDateTime } from "@/lib/formatters";

export function RegistroTentativaContato({ solicitacao }: { solicitacao: Solicitacao }) {
  const { registrarContato } = useCore();
  const historico = solicitacao.historicoContatos ?? [];

  const [hospitalNome, setHospitalNome] = useState("");
  const [dataHora, setDataHora] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16),
  );
  const [canal, setCanal] = useState<CanalContato>("TELEFONE");
  const [resultado, setResultado] = useState<ResultadoContato>("SEM_RESPOSTA");
  const [justificativaRecusa, setJustificativaRecusa] = useState("");
  const [escopo, setEscopo] = useState<EscopoBusca>(
    solicitacao.escopoBuscaAtual ?? "MACRO_ORIGEM",
  );

  const salvar = () => {
    try {
      registrarContato(solicitacao.id, {
        hospitalNome: hospitalNome.trim(),
        dataHoraContato: new Date(dataHora).toISOString(),
        canal,
        resultado,
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
        {/* ... (Mantenha o seu formulário aqui conforme estava no original) ... */}
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
                    <TableCell className="text-xs">{RESULTADO_CONTATO_LABEL[h.resultado]}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs">Nenhum contato registrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
