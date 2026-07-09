import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { FileUp, X } from "lucide-react";
import { useState } from "react";

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
import { useCore } from "@/lib/core-store";
import {
  GRAVIDADE_META,
  MACRORREGIOES,
  type GatilhoCompra,
  type Anexo,
  type Gravidade,
  type Macrorregiao,
} from "@/lib/core-types";

import { PerfilGate } from "@/components/perfil-gate";

export const Route = createFileRoute("/solicitante/nova")({
  head: () => ({ meta: [{ title: "Cadastrar caso de compra — CORE/MG" }] }),
  component: NovaSolicitacao,
});

const schema = z.object({
  pacienteNome: z.string().trim().min(3, "Informe o nome completo").max(120),
  pacienteDocumento: z.string().trim().min(5, "Informe CPF ou CNS"),
  pacienteNascimento: z.string().min(10, "Data obrigatória"),
  macrorregiaoOrigem: z.string().min(1),
  municipioOrigem: z.string().trim().min(2).max(80),
  unidadeOrigem: z.string().trim().min(3, "Informe a unidade solicitante").max(120),
  cnesUnidadeOrigem: z.string().trim().min(3, "Informe o CNES da unidade").max(20),
  diagnosticoPrincipal: z.string().trim().min(5).max(200),
  cid: z.string().trim().min(2).max(10),
  gravidade: z.enum(["VERMELHO", "LARANJA", "AMARELO", "VERDE"]),
  justificativa: z.string().trim().min(20, "Descreva com mais detalhes").max(1000),
  pa: z.string().min(1),
  fc: z.string().min(1),
  fr: z.string().min(1),
  temp: z.string().min(1),
  spo2: z.string().min(1),
  glasgow: z.string().optional(),
  gatilhoCompra: z.enum([
    "ESGOTAMENTO_CLINICO",
    "ORDEM_JUDICIAL_EXPIRADA",
    "ESGOTAMENTO_LEITO_SUS",
    "DETERMINACAO_JUDICIAL",
    "RISCO_IMINENTE_MORTE",
  ]),
  numeroProcessoJudicial: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function NovaSolicitacao() {
  const { criarSolicitacao } = useCore();
  const navigate = useNavigate();
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gravidade: "LARANJA",
      macrorregiaoOrigem: "Centro",
      unidadeOrigem: "",
      cnesUnidadeOrigem: "",
      gatilhoCompra: "ESGOTAMENTO_CLINICO",
      numeroProcessoJudicial: "",
    },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const novos: Anexo[] = Array.from(files).map((f) => ({
      id: `a-${Date.now()}-${f.name}`,
      nome: f.name,
      tipo: f.type,
      tamanhoKb: Math.max(1, Math.round(f.size / 1024)),
    }));
    setAnexos((prev) => [...prev, ...novos]);
  };

  const onSubmit = (data: FormData) => {
    try {
      const nova = criarSolicitacao({
        pacienteNome: data.pacienteNome,
        pacienteDocumento: data.pacienteDocumento,
        pacienteNascimento: data.pacienteNascimento,
        macrorregiaoOrigem: data.macrorregiaoOrigem as Macrorregiao,
        municipioOrigem: data.municipioOrigem,
        unidadeOrigem: data.unidadeOrigem,
        cnesUnidadeOrigem: data.cnesUnidadeOrigem,
        diagnosticoPrincipal: data.diagnosticoPrincipal,
        cid: data.cid.toUpperCase(),
        gravidade: data.gravidade as Gravidade,
        justificativa: data.justificativa,
        sinaisVitais: {
          pa: data.pa,
          fc: data.fc,
          fr: data.fr,
          temp: data.temp,
          spo2: data.spo2,
          glasgow: data.glasgow,
        },
        anexos,
        gatilhoCompra: data.gatilhoCompra as GatilhoCompra,
        numeroProcessoJudicial: data.numeroProcessoJudicial,
        checkTermoEsgotamentoSus: data.gatilhoCompra === "ESGOTAMENTO_LEITO_SUS",
      });
      toast.success(`Caso ${nova.protocolo} cadastrado para fluxo interno da CORE.`);
      navigate({ to: "/regulador" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao cadastrar caso");
    }
  };

  return (
    <PerfilGate permitido={["REGULADOR", "AUTORIDADE", "ADMINISTRATIVO", "ADMINISTRATIVO_CORE"]}>
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Cadastrar caso de compra excepcional
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastro interno após o médico regulador ou a autoridade sanitária identificar, na
            ferramenta estadual, hipótese excepcional de compra de leito.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identificação do Paciente</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Nome completo" error={form.formState.errors.pacienteNome?.message}>
                <Input {...form.register("pacienteNome")} />
              </Field>
              <Field
                label="Data de nascimento"
                error={form.formState.errors.pacienteNascimento?.message}
              >
                <Input type="date" {...form.register("pacienteNascimento")} />
              </Field>
              <Field label="CPF ou CNS" error={form.formState.errors.pacienteDocumento?.message}>
                <Input
                  {...form.register("pacienteDocumento")}
                  placeholder="Informe CPF ou CNS disponível"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Origem e unidade solicitante</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Macrorregião de origem">
                <Select
                  value={form.watch("macrorregiaoOrigem")}
                  onValueChange={(v) => form.setValue("macrorregiaoOrigem", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MACRORREGIOES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label="Município de origem"
                error={form.formState.errors.municipioOrigem?.message}
              >
                <Input {...form.register("municipioOrigem")} />
              </Field>
              <Field
                label="Unidade solicitante / origem"
                error={form.formState.errors.unidadeOrigem?.message}
              >
                <Input {...form.register("unidadeOrigem")} placeholder="Ex.: HPS João XXIII" />
              </Field>
              <Field
                label="CNES da unidade"
                error={form.formState.errors.cnesUnidadeOrigem?.message}
              >
                <Input {...form.register("cnesUnidadeOrigem")} placeholder="Ex.: 0027049" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quadro Clínico</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field
                label="Diagnóstico principal"
                error={form.formState.errors.diagnosticoPrincipal?.message}
              >
                <Input {...form.register("diagnosticoPrincipal")} />
              </Field>
              <Field label="CID" error={form.formState.errors.cid?.message}>
                <Input {...form.register("cid")} placeholder="Ex.: I63.9" />
              </Field>
              <Field label="Classificação de gravidade">
                <Select
                  value={form.watch("gravidade")}
                  onValueChange={(v) => form.setValue("gravidade", v as Gravidade)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(GRAVIDADE_META) as Gravidade[]).map((g) => (
                      <SelectItem key={g} value={g}>
                        {GRAVIDADE_META[g].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Gatilho/hipótese de compra excepcional">
                <Select
                  value={form.watch("gatilhoCompra")}
                  onValueChange={(v) => form.setValue("gatilhoCompra", v as GatilhoCompra)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ESGOTAMENTO_CLINICO">
                      Esgotamento clínico/regulatório
                    </SelectItem>
                    <SelectItem value="ESGOTAMENTO_LEITO_SUS">
                      Inexistência de leito SUS disponível
                    </SelectItem>
                    <SelectItem value="RISCO_IMINENTE_MORTE">Risco iminente de morte</SelectItem>
                    <SelectItem value="DETERMINACAO_JUDICIAL">Determinação judicial</SelectItem>
                    <SelectItem value="ORDEM_JUDICIAL_EXPIRADA">
                      Ordem judicial com prazo expirado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nº do processo judicial, se houver">
                <Input
                  {...form.register("numeroProcessoJudicial")}
                  placeholder="Ex.: 5000000-00.2026.8.13.0000"
                />
              </Field>
              <div className="md:col-span-2">
                <Label className="mb-2 block text-sm font-medium">Sinais Vitais</Label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                  <Field label="PA">
                    <Input {...form.register("pa")} placeholder="120/80" />
                  </Field>
                  <Field label="FC">
                    <Input {...form.register("fc")} placeholder="bpm" />
                  </Field>
                  <Field label="FR">
                    <Input {...form.register("fr")} placeholder="rpm" />
                  </Field>
                  <Field label="Temp.">
                    <Input {...form.register("temp")} placeholder="°C" />
                  </Field>
                  <Field label="SpO₂">
                    <Input {...form.register("spo2")} placeholder="%" />
                  </Field>
                  <Field label="Glasgow">
                    <Input {...form.register("glasgow")} placeholder="opcional" />
                  </Field>
                </div>
              </div>
              <div className="md:col-span-2">
                <Field
                  label="Justificativa da hipótese de compra excepcional"
                  error={form.formState.errors.justificativa?.message}
                >
                  <Textarea rows={4} {...form.register("justificativa")} />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exames e laudos anexos</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:bg-muted/60">
                <FileUp className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Selecione arquivos (PDF, imagens)</span>
                <span className="text-xs text-muted-foreground">
                  Anexe TC, exames laboratoriais e laudos que justifiquem a compra.
                </span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
              {anexos.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {anexos.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded border bg-card px-3 py-1.5 text-sm"
                    >
                      <span className="truncate">{a.nome}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{a.tamanhoKb} KB</span>
                        <button
                          type="button"
                          onClick={() => setAnexos((p) => p.filter((x) => x.id !== a.id))}
                          className="text-destructive hover:opacity-80"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/regulador" })}>
              Cancelar
            </Button>
            <Button type="submit">Cadastrar caso</Button>
          </div>
        </form>
      </div>
    </PerfilGate>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
