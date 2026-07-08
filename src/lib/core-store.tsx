import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  USUARIOS_MOCK,
  type Anexo,
  type AutorizacaoAutoridade,
  type CanalContato,
  type ClinicaMedica,
  type EscopoBusca,
  type EscolhaEnfermagem,
  type Gravidade,
  type GatilhoCompra,
  type HistoricoContato,
  type Macrorregiao,
  type MotivoRecusa,
  type ParecerRegulador,
  type PerfilId,
  type RegistroAuditoria,
  type ResultadoContato,
  type SinaisVitais,
  type Solicitacao,
  type StatusSolicitacao,
  type StatusTransferencia,
  type Usuario,
} from "./core-types";

// ---------- helpers ----------
const SEED_NOW = Date.now();
const nowIso = () => new Date().toISOString();
const hoursAgo = (h: number) => new Date(SEED_NOW - h * 3600_000).toISOString();
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 10)}`;

let PROTOCOLO_SEQ = 153;
const proximoProtocolo = () =>
  `CL-${new Date().getFullYear()}-${String(++PROTOCOLO_SEQ).padStart(6, "0")}`;

// ---------- seed ----------
const seedSolicitacoes: Solicitacao[] = [
  {
    id: "s1",
    protocolo: proximoProtocolo(),
    solicitanteId: "u1",
    unidadeOrigem: "HPS João XXIII",
    macrorregiaoOrigem: "Centro",
    municipioOrigem: "Belo Horizonte",
    pacienteNome: "Maria Aparecida da Silva",
    pacienteCpf: "123.456.789-00",
    pacienteCns: "700 0000 0000 0000",
    pacienteNascimento: "1958-04-12",
    diagnosticoPrincipal: "Sepse grave / IRpA",
    cid: "A41.9",
    gravidade: "VERMELHO",
    sinaisVitais: { pa: "80x50", fc: "128", fr: "32", temp: "39.1", spo2: "88", glasgow: "13" },
    justificativa:
      "Paciente sem leito de UTI SUS após tentativas de vaga zero em toda a macrorregião centro.",
    anexos: [],
    gatilhoCompra: "ESGOTAMENTO_CLINICO",
    status: "AGUARDANDO_REGULACAO",
    criadoEm: hoursAgo(2),
    checkTermoEsgotamentoSus: false,
    aceitesHospitais: [],
    faturasEnviadasCompras: false,
    escopoBuscaAtual: "MACRO_ORIGEM",
    statusTransferencia: "AGUARDANDO_TRANSPORTE",
    historicoContatos: [],
  },
];

// ---------- store shape ----------
interface CoreStore {
  usuarios: Usuario[];
  usuarioAtual: Usuario;
  solicitacoes: Solicitacao[];
  auditoria: RegistroAuditoria[];
  trocarUsuario: (id: string) => void;
  loginPorEmail: (email: string, senha: string) => { ok: true } | { ok: false; erro: string };
  criarSolicitacao: (data: NovaSolicitacaoInput) => Solicitacao;
  emitirParecer: (
    id: string,
    parecer: {
      vagaZeroTentada: boolean;
      vagaZeroDetalhe: string;
      parecerTecnico: string;
      clinicaIndicada: ClinicaMedica;
      checkTermoEsgotamentoSus: boolean;
    },
    proximoStatus: StatusSolicitacao,
  ) => void;
  recusar: (id: string, motivo: string) => void;
  autorizarCompra: (id: string, dados: { observacoes: string }) => void;
  atualizarEscopoBusca: (id: string, escopo: EscopoBusca) => void;
  atualizarStatusTransferencia: (id: string, status: StatusTransferencia) => void;
  registrarContato: (
    id: string,
    contato: {
      hospitalNome: string;
      dataHoraContato: string;
      canal: CanalContato;
      resultado: ResultadoContato;
      justificativaRecusa?: string;
      motivoRecusa?: MotivoRecusa;
      escopoBusca: EscopoBusca;
      reacionarHospital?: boolean;
      repescagemEm?: string;
    },
  ) => void;
  marcarRepescagemRealizada: (id: string, contatoId: string) => void;
  iniciarBuscaMacro: (id: string) => void;
  registrarAceite: (id: string, hospitalId: string, vagas: number) => void;
  expandirParaEstadual: (id: string) => void;
  cancelarAbsorcaoSus: (id: string, justificativa: string) => void;
  confirmarLeitoEnfermagem: (
    id: string,
    dados: Omit<EscolhaEnfermagem, "confirmadoEm" | "enfermeiroId">,
  ) => void;
  abrirProcessoSei: (
    id: string,
    dados: {
      numeroSeiProcesso: string;
      checkLaudoPaciente: boolean;
      checkTermoAcionamento: boolean;
      checkTermoEsgotamentoSus: boolean;
    },
  ) => void;
  registrarCompra: (
    id: string,
    dados: { hospitalId: string; valorDiaria: number; empenho: string; internacaoEm: string },
  ) => void;
  registrarInternacao: (id: string) => void;
  enviarFaturasParaCompras: (id: string, observacoes: string) => void;
  decretarCompraDireta: (id: string, justificativa: string) => void;
}

export interface NovaSolicitacaoInput {
  pacienteNome: string;
  pacienteCpf: string;
  pacienteCns: string;
  pacienteNascimento: string;
  macrorregiaoOrigem: Macrorregiao;
  municipioOrigem: string;
  diagnosticoPrincipal: string;
  cid: string;
  gravidade: Gravidade;
  justificativa: string;
  sinaisVitais: SinaisVitais;
  anexos: Anexo[];
  gatilhoCompra: GatilhoCompra;
  checkTermoEsgotamentoSus: boolean;
}

const Ctx = createContext<CoreStore | null>(null);

export function CoreProvider({ children }: { children: ReactNode }) {
  const [usuarioAtualId, setUsuarioAtualId] = useState<string>("u1");
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>(seedSolicitacoes);
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>([]);

  const usuarioAtual = useMemo(
    () => USUARIOS_MOCK.find((u) => u.id === usuarioAtualId) ?? USUARIOS_MOCK[0]!,
    [usuarioAtualId],
  );

  const logAudit = useCallback(
    (entry: {
      acao: string;
      detalhe?: string;
      solicitacaoId?: string;
      statusAntes?: StatusSolicitacao;
      statusDepois?: StatusSolicitacao;
      quemId?: string;
    }) => {
      const quem =
        USUARIOS_MOCK.find((u) => u.id === (entry.quemId ?? usuarioAtualId)) ?? usuarioAtual;
      setAuditoria((prev) => [
        ...prev,
        {
          id: uid("a"),
          emAt: nowIso(),
          usuarioId: quem.id,
          usuarioNome: quem.nome,
          usuarioCpf: quem.cpf,
          perfil: quem.perfil,
          acao: entry.acao,
          detalhe: entry.detalhe,
          solicitacaoId: entry.solicitacaoId,
          statusAntes: entry.statusAntes,
          statusDepois: entry.statusDepois,
        },
      ]);
    },
    [usuarioAtual, usuarioAtualId],
  );

  const patch = useCallback((id: string, updater: (s: Solicitacao) => Solicitacao) => {
    setSolicitacoes((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  }, []);

  const requirePerfil = (esperado: PerfilId | PerfilId[]) => {
    const lista = Array.isArray(esperado) ? esperado : [esperado];
    if (!lista.includes(usuarioAtual.perfil)) {
      throw new Error(`Ação restrita ao perfil ${lista.join(", ")}.`);
    }
  };

  const trocarUsuario = useCallback((id: string) => setUsuarioAtualId(id), []);

  const loginPorEmail: CoreStore["loginPorEmail"] = useCallback((email, senha) => {
    const u = USUARIOS_MOCK.find(
      (x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.senha === senha,
    );
    if (!u) return { ok: false, erro: "Credenciais inválidas." };
    setUsuarioAtualId(u.id);
    return { ok: true };
  }, []);

  const criarSolicitacao: CoreStore["criarSolicitacao"] = useCallback(
    (data) => {
      requirePerfil("SOLICITANTE");
      const nova: Solicitacao = {
        id: uid("s"),
        protocolo: proximoProtocolo(),
        solicitanteId: usuarioAtual.id,
        unidadeOrigem: usuarioAtual.unidade,
        macrorregiaoOrigem: data.macrorregiaoOrigem,
        municipioOrigem: data.municipioOrigem,
        pacienteNome: data.pacienteNome,
        pacienteCpf: data.pacienteCpf,
        pacienteCns: data.pacienteCns,
        pacienteNascimento: data.pacienteNascimento,
        diagnosticoPrincipal: data.diagnosticoPrincipal,
        cid: data.cid,
        gravidade: data.gravidade,
        sinaisVitais: data.sinaisVitais,
        justificativa: data.justificativa,
        anexos: data.anexos,
        gatilhoCompra: data.gatilhoCompra,
        status: "AGUARDANDO_REGULACAO",
        criadoEm: nowIso(),
        checkTermoEsgotamentoSus: data.checkTermoEsgotamentoSus,
        aceitesHospitais: [],
        faturasEnviadasCompras: false,
        escopoBuscaAtual: "MACRO_ORIGEM",
        statusTransferencia: "AGUARDANDO_TRANSPORTE",
        historicoContatos: [],
      };
      setSolicitacoes((p) => [nova, ...p]);
      logAudit({
        acao: "Solicitação criada",
        solicitacaoId: nova.id,
        statusDepois: nova.status,
        detalhe: `${nova.diagnosticoPrincipal} (${nova.cid})`,
      });
      return nova;
    },
    [logAudit, usuarioAtual],
  );

  const emitirParecer: CoreStore["emitirParecer"] = useCallback(
    (id, dados, proximo) => {
      requirePerfil("REGULADOR");
      patch(id, (s) => ({
        ...s,
        parecer: {
          reguladorId: usuarioAtual.id,
          clinicaIndicada: dados.clinicaIndicada,
          parecerTecnico: dados.parecerTecnico,
          vagaZeroTentada: dados.vagaZeroTentada,
          vagaZeroDetalhe: dados.vagaZeroDetalhe,
          checkTermoEsgotamentoSus: dados.checkTermoEsgotamentoSus,
          emitidoEm: nowIso(),
        },
        status: proximo,
      }));
      logAudit({
        acao: proximo === "PARECER_EMITIDO" ? "Parecer técnico emitido" : "Aguardando Vaga Zero",
        solicitacaoId: id,
        statusDepois: proximo,
        detalhe: dados.clinicaIndicada,
      });
    },
    [logAudit, patch, usuarioAtual],
  );

  const recusar: CoreStore["recusar"] = useCallback(
    (id, motivo) => {
      requirePerfil("REGULADOR");
      patch(id, (s) => ({ ...s, status: "RECUSADO" }));
      logAudit({
        acao: "Solicitação recusada",
        detalhe: motivo,
        solicitacaoId: id,
        statusDepois: "RECUSADO",
      });
    },
    [logAudit, patch],
  );

  const autorizarCompra: CoreStore["autorizarCompra"] = useCallback(
    (id, dados) => {
      requirePerfil("AUTORIDADE");
      const autorizacao: AutorizacaoAutoridade = {
        autoridadeId: usuarioAtual.id,
        termoNumero: `TA-${Date.now().toString(36).toUpperCase()}`,
        observacoes: dados.observacoes,
        autorizadoEm: nowIso(),
      };
      patch(id, (s) => ({ ...s, autorizacao, status: "AUTORIZADO_AUTORIDADE" }));
      logAudit({
        acao: "Termo de Acionamento assinado",
        solicitacaoId: id,
        statusDepois: "AUTORIZADO_AUTORIDADE",
        detalhe: autorizacao.termoNumero,
      });
    },
    [logAudit, patch, usuarioAtual],
  );

  const atualizarEscopoBusca: CoreStore["atualizarEscopoBusca"] = useCallback(
    (id, escopo) => {
      patch(id, (s) => {
        const temAceiteMacrorregional = s.aceitesHospitais.some(
          (a) => (a.escopoBusca ?? "MACRO_ORIGEM") !== "ESTADUAL",
        );
        if (escopo === "ESTADUAL" && temAceiteMacrorregional) {
          throw new Error("Busca estadual bloqueada: já houve aceite na macrorregião PDR.");
        }
        return { ...s, escopoBuscaAtual: escopo };
      });
      logAudit({ acao: "Escopo de busca atualizado", detalhe: escopo, solicitacaoId: id });
    },
    [logAudit, patch],
  );

  const atualizarStatusTransferencia: CoreStore["atualizarStatusTransferencia"] = useCallback(
    (id, status) => {
      patch(id, (s) => ({ ...s, statusTransferencia: status }));
      logAudit({ acao: "Status de transferência atualizado", detalhe: status, solicitacaoId: id });
    },
    [logAudit, patch],
  );

  const registrarContato: CoreStore["registrarContato"] = useCallback(
    (id, contato) => {
      if (!contato.hospitalNome.trim()) throw new Error("Informe o hospital contatado.");
      if (contato.resultado === "RECUSA" && !contato.justificativaRecusa?.trim()) {
        throw new Error("Justificativa é obrigatória para recusas.");
      }
      if (contato.resultado === "RECUSA" && !contato.motivoRecusa) {
        throw new Error("Motivo padronizado é obrigatório para recusas.");
      }
      const novo: HistoricoContato = {
        id: uid("hc"),
        hospitalNome: contato.hospitalNome,
        dataHoraContato: contato.dataHoraContato,
        canal: contato.canal,
        resultado: contato.resultado,
        motivoRecusa: contato.motivoRecusa,
        justificativaRecusa: contato.justificativaRecusa,
        escopoBusca: contato.escopoBusca,
        registradoPorId: usuarioAtual.id,
        reacionarHospital: contato.reacionarHospital,
        repescagemEm: contato.repescagemEm,
        repescagemRealizada: false,
      };
      patch(id, (s) => ({
        ...s,
        historicoContatos: [...(s.historicoContatos ?? []), novo],
      }));
      logAudit({
        acao: "Tentativa de contato registrada",
        detalhe: `${contato.hospitalNome} — ${contato.resultado}`,
        solicitacaoId: id,
      });
    },
    [logAudit, patch, usuarioAtual],
  );

  const marcarRepescagemRealizada: CoreStore["marcarRepescagemRealizada"] = useCallback(
    (id, contatoId) => {
      requirePerfil("ENFERMEIRO");
      patch(id, (s) => ({
        ...s,
        historicoContatos: (s.historicoContatos ?? []).map((c) =>
          c.id === contatoId ? { ...c, repescagemRealizada: true } : c,
        ),
      }));
      logAudit({ acao: "Repescagem realizada", solicitacaoId: id, detalhe: contatoId });
    },
    [logAudit, patch],
  );

  const iniciarBuscaMacro: CoreStore["iniciarBuscaMacro"] = useCallback(
    (id) => {
      requirePerfil("ENFERMEIRO");
      patch(id, (s) => ({
        ...s,
        buscaIniciadaEm: nowIso(),
        status: "BUSCA_MACRO_REGIONAL",
      }));
      logAudit({
        acao: "Busca macrorregional iniciada",
        solicitacaoId: id,
        statusDepois: "BUSCA_MACRO_REGIONAL",
      });
    },
    [logAudit, patch],
  );

  const registrarAceite: CoreStore["registrarAceite"] = useCallback(
    (id, hospitalId, vagas) => {
      requirePerfil("ENFERMEIRO");
      patch(id, (s) => ({
        ...s,
        aceitesHospitais: [
          ...s.aceitesHospitais,
          {
            hospitalId,
            vagasDisponiveis: vagas,
            aceitoEm: nowIso(),
            escopoBusca: s.escopoBuscaAtual ?? "MACRO_ORIGEM",
          },
        ],
      }));
      logAudit({ acao: "Aceite de hospital registrado", detalhe: hospitalId, solicitacaoId: id });
    },
    [logAudit, patch],
  );

  const expandirParaEstadual: CoreStore["expandirParaEstadual"] = useCallback(
    (id) => {
      requirePerfil("ENFERMEIRO");
      patch(id, (s) => {
        const temAceiteMacrorregional = s.aceitesHospitais.some(
          (a) => (a.escopoBusca ?? "MACRO_ORIGEM") !== "ESTADUAL",
        );
        if (temAceiteMacrorregional) {
          throw new Error("Expansão estadual bloqueada: já houve aceite na macrorregião.");
        }
        return { ...s, status: "BUSCA_ESTADUAL_EXPANDIDA", escopoBuscaAtual: "ESTADUAL" };
      });
      logAudit({
        acao: "Busca expandida para estadual",
        solicitacaoId: id,
        statusDepois: "BUSCA_ESTADUAL_EXPANDIDA",
      });
    },
    [logAudit, patch],
  );

  const cancelarAbsorcaoSus: CoreStore["cancelarAbsorcaoSus"] = useCallback(
    (id, justificativa) => {
      if (justificativa.trim().length < 15) {
        throw new Error("Justificativa mínima de 15 caracteres.");
      }
      patch(id, (s) => ({
        ...s,
        status: "CANCELADO_ABSORVIDO_SUS",
        cancelamento: {
          motivo: justificativa,
          canceladoEm: nowIso(),
          canceladoPorId: usuarioAtual.id,
        },
      }));
      logAudit({
        acao: "Cancelado por absorção SUS",
        detalhe: justificativa,
        solicitacaoId: id,
        statusDepois: "CANCELADO_ABSORVIDO_SUS",
      });
    },
    [logAudit, patch, usuarioAtual],
  );

  const confirmarLeitoEnfermagem: CoreStore["confirmarLeitoEnfermagem"] = useCallback(
    (id, dados) => {
      requirePerfil("ENFERMEIRO");
      const escolha: EscolhaEnfermagem = {
        ...dados,
        confirmadoEm: nowIso(),
        enfermeiroId: usuarioAtual.id,
      };
      patch(id, (s) => ({
        ...s,
        escolhaEnfermagem: escolha,
        status: "LEITO_CONFIRMADO_ENFERMAGEM",
      }));
      logAudit({
        acao: "Leito confirmado pela enfermagem",
        detalhe: dados.hospitalId,
        solicitacaoId: id,
        statusDepois: "LEITO_CONFIRMADO_ENFERMAGEM",
      });
    },
    [logAudit, patch, usuarioAtual],
  );

  const abrirProcessoSei: CoreStore["abrirProcessoSei"] = useCallback(
    (id, dados) => {
      requirePerfil(["ADMINISTRATIVO", "ADMINISTRATIVO_CORE"]);
      patch(id, (s) => ({
        ...s,
        processoSei: {
          numeroSeiProcesso: dados.numeroSeiProcesso,
          checkLaudoPaciente: dados.checkLaudoPaciente,
          checkTermoAcionamento: dados.checkTermoAcionamento,
          checkTermoEsgotamentoSus: dados.checkTermoEsgotamentoSus,
          abertoEm: nowIso(),
          abertoPorId: usuarioAtual.id,
        },
        numeroSeiProcesso: dados.numeroSeiProcesso,
        status: "PROCESSO_SEI_INICIADO",
      }));
      logAudit({
        acao: "Processo SEI aberto",
        detalhe: dados.numeroSeiProcesso,
        solicitacaoId: id,
        statusDepois: "PROCESSO_SEI_INICIADO",
      });
    },
    [logAudit, patch, usuarioAtual],
  );

  const registrarCompra: CoreStore["registrarCompra"] = useCallback(
    (id, dados) => {
      requirePerfil(["ADMINISTRATIVO", "ADMINISTRATIVO_CORE"]);
      patch(id, (s) => ({
        ...s,
        compra: {
          hospitalId: dados.hospitalId,
          valorDiaria: dados.valorDiaria,
          empenho: dados.empenho,
          internacaoEm: dados.internacaoEm,
          registradoEm: nowIso(),
          registradoPorId: usuarioAtual.id,
        },
        status: "LEITO_COMPRADO",
      }));
      logAudit({
        acao: "Compra de leito registrada",
        detalhe: `Empenho ${dados.empenho}`,
        solicitacaoId: id,
        statusDepois: "LEITO_COMPRADO",
      });
    },
    [logAudit, patch, usuarioAtual],
  );

  const registrarInternacao: CoreStore["registrarInternacao"] = useCallback(
    (id) => {
      requirePerfil(["ADMINISTRATIVO", "ADMINISTRATIVO_CORE"]);
      patch(id, (s) => ({ ...s, status: "INTERNADO" }));
      logAudit({ acao: "Internação confirmada", solicitacaoId: id, statusDepois: "INTERNADO" });
    },
    [logAudit, patch],
  );

  const enviarFaturasParaCompras: CoreStore["enviarFaturasParaCompras"] = useCallback(
    (id, observacoes) => {
      requirePerfil(["ADMINISTRATIVO", "ADMINISTRATIVO_CORE"]);
      patch(id, (s) => ({
        ...s,
        faturasEnviadasCompras: true,
        envioFaturas: { enviadoEm: nowIso(), enviadoPorId: usuarioAtual.id, observacoes },
        status: "PROCESSO_FINANCEIRO_EM_PAGAMENTO",
      }));
      logAudit({
        acao: "Faturas encaminhadas",
        detalhe: observacoes,
        solicitacaoId: id,
        statusDepois: "PROCESSO_FINANCEIRO_EM_PAGAMENTO",
      });
    },
    [logAudit, patch, usuarioAtual],
  );

  const decretarCompraDireta: CoreStore["decretarCompraDireta"] = useCallback(
    (id, justificativa) => {
      requirePerfil("AUTORIDADE");
      if (justificativa.trim().length < 15) {
        throw new Error("Justificativa mínima de 15 caracteres.");
      }
      patch(id, (s) => ({
        ...s,
        compraDireta: {
          decretadaPorId: usuarioAtual.id,
          decretadaEm: nowIso(),
          justificativa,
        },
      }));
      logAudit({ acao: "Compra direta decretada", detalhe: justificativa, solicitacaoId: id });
    },
    [logAudit, patch, usuarioAtual],
  );

  const value: CoreStore = {
    usuarios: USUARIOS_MOCK,
    usuarioAtual,
    solicitacoes,
    auditoria,
    trocarUsuario,
    loginPorEmail,
    criarSolicitacao,
    emitirParecer,
    recusar,
    autorizarCompra,
    atualizarEscopoBusca,
    atualizarStatusTransferencia,
    registrarContato,
    marcarRepescagemRealizada,
    iniciarBuscaMacro,
    registrarAceite,
    expandirParaEstadual,
    cancelarAbsorcaoSus,
    confirmarLeitoEnfermagem,
    abrirProcessoSei,
    registrarCompra,
    registrarInternacao,
    enviarFaturasParaCompras,
    decretarCompraDireta,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCore(): CoreStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCore deve ser usado dentro de <CoreProvider>.");
  return ctx;
}
