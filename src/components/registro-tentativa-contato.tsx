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

/**
 * Registro manual de tentativas de contato com hospitais (Apoio Adm. Centralizado).
 * Suporta hospitais que NÃO possuem login no sistema (campo texto livre).
 * Toda ação alimenta o histórico auditável e as métricas de "Performance de Rede".
 */
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
        <p className="text-xs text-muted-foreground">
          Apoio Administrativo Centralizado — registra manualmente contatos com hospitais,
          inclusive os que não possuem login no sistema.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Hospital Destino</Label>
            <Input
              placeholder="Nome do hospital (livre)"
              value={hospitalNome}
              onChange={(e) => setHospitalNome(e.target.value)}
              maxLength={120}
            />
          </div>
          <div>
            <Label className="text-xs">Data / Hora do Contato</Label>
            <Input
              type="datetime-local"
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Canal</Label>
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
            <Label className="text-xs">Escopo de Busca</Label>
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
          <div className="md:col-span-2">
            <Label className="text-xs">Resultado</Label>
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
          {resultado === "RECUSA" && (
            <div className="md:col-span-2">
              <Label className="text-xs text-destructive">
                Justificativa da Recusa (obrigatória)
              </Label>
              <Textarea
                rows={2}
                placeholder="Descreva o motivo técnico informado pelo hospital…"
                value={justificativaRecusa}
                onChange={(e) => setJustificativaRecusa(e.target.value)}
                maxLength={500}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={salvar}>
            <Plus className="h-4 w-4" /> Registrar contato
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Justificativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historico.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-xs">{formatDateTime(h.dataHoraContato)}</TableCell>
                  <TableCell className="text-xs font-medium">{h.hospitalNome}</TableCell>
                  <TableCell className="text-xs">{ESCOPO_BUSCA_LABEL[h.escopoBusca]}</TableCell>
                  <TableCell className="text-xs">
                    <span className="inline-flex items-center gap-1">
                      {h.canal === "EMAIL" ? (
                        <Mail className="h-3 w-3" />
                      ) : (
                        <Phone className="h-3 w-3" />
                      )}
                      {CANAL_CONTATO_LABEL[h.canal]}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span
                      className={
                        h.resultado === "ACEITE"
                          ? "rounded-full bg-success/15 px-2 py-0.5 text-success"
                          : h.resultado === "RECUSA"
                            ? "rounded-full bg-destructive/15 px-2 py-0.5 text-destructive"
                            : "rounded-full bg-muted px-2 py-0.5 text-muted-foreground"
                      }
                    >
                      {RESULTADO_CONTATO_LABEL[h.resultado]}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground">
                    {h.justificativaRecusa ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
              {historico.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                    Nenhuma tentativa registrada.
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
export const TabelaHistorico = ({ contatos }: { contatos: HistoricoContato[] }) => (
  <table className="w-full text-sm">
    <thead>
      <tr>
        <th>Data</th>
        <th>Hospital</th>
        <th>Canal</th>
        <th>Resultado</th>
        <th>Justificativa</th>
      </tr>
    </thead>
    <tbody>
      {contatos.sort((a, b) => b.data.getTime() - a.data.getTime()).map((c) => (
        <tr key={c.id}>
          <td>{c.data.toLocaleString()}</td>
          <td>{c.hospital}</td>
          <td>{c.canal}</td>
          <td>{c.resultado}</td>
          <td>{c.justificativa || '-'}</td>
        </tr>
      ))}
    </tbody>
  </table>
);
// Substitua o .map original por este modelo seguro:
{Array.isArray(contatos) && contatos.length > 0 ? (
  contatos.map((c) => (
    <tr key={c.id}>...</tr>
  ))
) : (
  <tr><td colSpan={5}>Nenhum contato registrado.</td></tr>
)}
