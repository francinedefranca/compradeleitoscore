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
import { GRAVIDADE_META, MACRORREGIOES, type Anexo, type Gravidade, type Macrorregiao } from "@/lib/core-types";
import { maskCns, maskCpf } from "@/lib/formatters";
import { PerfilGate } from "@/components/perfil-gate";

export const Route = createFileRoute("/solicitante/nova")({
  head: () => ({ meta: [{ title: "Nova Solicitação — CORE/MG" }] }),
  component: NovaSolicitacao,
});

const schema = z.object({
  pacienteNome: z.string().trim().min(3, "Informe o nome completo").max(120),
  pacienteCpf: z.string().min(14, "CPF inválido"),
  pacienteCns: z.string().min(15, "CNS deve ter 15 dígitos"),
  pacienteNascimento: z.string().min(10, "Data obrigatória"),
  macrorregiaoOrigem: z.string().min(1),
  municipioOrigem: z.string().trim().min(2).max(80),
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
        pacienteCpf: data.pacienteCpf,
        pacienteCns: data.pacienteCns,
        pacienteNascimento: data.pacienteNascimento,
        macrorregiaoOrigem: data.macrorregiaoOrigem as Macrorregiao,
        municipioOrigem: data.municipioOrigem,
        diagnosticoPrincipal: data.diagnosticoPrincipal,
        cid: data.cid.toUpperCase(),
        gravidade: data.gravidade as Gravidade,
        justificativa: data.justificativa,
        sinaisVitais: {
          pa: data.pa, fc: data.fc, fr: data.fr, temp: data.temp, spo2: data.spo2, glasgow: data.glasgow,
        },
        anexos,
      });
      toast.success(`Solicitação ${nova.protocolo} enviada à Regulação.`);
      navigate({ to: "/solicitante" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar solicitação");
    }
  };

  return (
    <PerfilGate permitido={["SOLICITANTE"]}>
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova Solicitação de Leito</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro de paciente em urgência/emergência para regulação pela CORE/MG.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Identificação do Paciente</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Nome completo" error={form.formState.errors.pacienteNome?.message}>
                <Input {...form.register("pacienteNome")} />
              </Field>
              <Field label="Data de nascimento" error={form.formState.errors.pacienteNascimento?.message}>
                <Input type="date" {...form.register("pacienteNascimento")} />
              </Field>
              <Field label="CPF" error={form.formState.errors.pacienteCpf?.message}>
                <Input
                  {...form.register("pacienteCpf")}
                  onChange={(e) => form.setValue("pacienteCpf", maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                />
              </Field>
              <Field label="CNS (Cartão SUS)" error={form.formState.errors.pacienteCns?.message}>
                <Input
                  {...form.register("pacienteCns")}
                  onChange={(e) => form.setValue("pacienteCns", maskCns(e.target.value))}
                  placeholder="000 0000 0000 0000"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Origem</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Macrorregião de origem">
                <Select
                  value={form.watch("macrorregiaoOrigem")}
                  onValueChange={(v) => form.setValue("macrorregiaoOrigem", v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MACRORREGIOES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Município de origem" error={form.formState.errors.municipioOrigem?.message}>
                <Input {...form.register("municipioOrigem")} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Quadro Clínico</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Diagnóstico principal" error={form.formState.errors.diagnosticoPrincipal?.message}>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(GRAVIDADE_META) as Gravidade[]).map((g) => (
                      <SelectItem key={g} value={g}>
                        {GRAVIDADE_META[g].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div />
              <div className="md:col-span-2">
                <Label className="mb-2 block text-sm font-medium">Sinais Vitais</Label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                  <Field label="PA"><Input {...form.register("pa")} placeholder="120/80" /></Field>
                  <Field label="FC"><Input {...form.register("fc")} placeholder="bpm" /></Field>
                  <Field label="FR"><Input {...form.register("fr")} placeholder="rpm" /></Field>
                  <Field label="Temp."><Input {...form.register("temp")} placeholder="°C" /></Field>
                  <Field label="SpO₂"><Input {...form.register("spo2")} placeholder="%" /></Field>
                  <Field label="Glasgow"><Input {...form.register("glasgow")} placeholder="opcional" /></Field>
                </div>
              </div>
              <div className="md:col-span-2">
                <Field label="Justificativa da transferência" error={form.formState.errors.justificativa?.message}>
                  <Textarea rows={4} {...form.register("justificativa")} />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Exames e laudos anexos</CardTitle></CardHeader>
            <CardContent>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:bg-muted/60">
                <FileUp className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Selecione arquivos (PDF, imagens)</span>
                <span className="text-xs text-muted-foreground">
                  Anexe TC, exames laboratoriais e laudos que justifiquem a compra.
                </span>
                <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              </label>
              {anexos.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {anexos.map((a) => (
                    <li key={a.id} className="flex items-center justify-between rounded border bg-card px-3 py-1.5 text-sm">
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
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/solicitante" })}>
              Cancelar
            </Button>
            <Button type="submit">Enviar para regulação</Button>
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
