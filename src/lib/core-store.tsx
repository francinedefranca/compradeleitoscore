import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import {
  USUARIOS_MOCK,
  TRANSICOES,
  type PerfilId,
  type Solicitacao,
  type StatusSolicitacao,
  type Usuario,
  type RegistroAuditoria,
  type ParecerRegulador,
  type AutorizacaoAutoridade,
  type CompraLeito,
  type EscolhaEnfermagem,
  type ProcessoSei,
} from "./core-types";

// ---------- Datas fixas do seed (SSR/CSR safe) ----------
const SEED_NOW = "2026-07-03T14:00:00.000Z";
const nowIso = () => new Date().toISOString();
const isoOffsetMs = (from: string, ms: number) =>
  new Date(new Date(from).getTime() - ms).toISOString();
const hoursAgo = (h: number) => isoOffsetMs(SEED_NOW, h * 3600_000);
const daysAgo = (d: number) => isoOffsetMs(SEED_NOW, d * 86400_000);

const seedSolicitacoes: Solicitacao[] = [
  {
    id: "s1",
    protocolo: "CORE-2026-0001",
    solicitanteId: "u1",
    unidadeOrigem: "HPS João XXIII",
    macrorregiaoOrigem: "Centro",
    municipioOrigem: "Belo Horizonte",
    pacienteNome: "José Ferreira Silva",
    pacienteCpf: "123.456.789-00",
    pacienteCns: "706 0012 3456 7890",
    pacienteNascimento: "1962-04-11",
    diagnosticoPrincipal: "AVC isquêmico agudo com déficit motor",
    cid: "I63.9",
    gravidade: "VERMELHO",
    sinaisVitais: { pa: "180/110", fc: "112", fr: "24", temp: "36.8", spo2: "92%", glasgow: "12" },
    justificativa: "Necessidade imediata de UTI neurológica. Sem vaga em rede pública da macrorregião.",
    anexos: [
      { id: "a1", nome: "TC-cranio.pdf", tipo: "application/pdf", tamanhoKb: 812 },
      { id: "a2", nome: "hemograma.pdf", tipo: "application/pdf", tamanhoKb: 145 },
    ],
    gatilhoCompra: "ESGOTAMENTO_CLINICO",
    status: "AGUARDANDO_REGULACAO",
    criadoEm: hoursAgo(2),
    checkTermoEsgotamentoSus: false,
    aceitesHospitais: [],
    faturasEnviadasCompras: false,
    registradoEsgotamentoPorId: "u1",
  },
  {
    id: "s2",
    protocolo: "CORE-2026-0002",
    solicitanteId: "u1",
    unidadeOrigem: "HPS João XXIII",
    macrorregiaoOrigem: "Centro",
    municipioOrigem: "Belo Horizonte",
    pacienteNome: "Maria Aparecida Rocha",
    pacienteCpf: "234.567.890-11",
    pacienteCns: "704 5566 1234 4321",
    pacienteNascimento: "1978-09-23",
    diagnosticoPrincipal: "IAM com supra de ST",
    cid: "I21.9",
    gravidade: "VERMELHO",
    sinaisVitais: { pa: "90/60", fc: "128", fr: "26", temp: "36.2", spo2: "89%" },
    justificativa: "Choque cardiogênico. Necessário hemodinâmica em UTI Cardiológica.",
    anexos: [{ id: "a3", nome: "ecg.pdf", tipo: "application/pdf", tamanhoKb: 320 }],
    gatilhoCompra: "ESGOTAMENTO_CLINICO",
    status: "AGUARDANDO_VAGA_ZERO",
    criadoEm: hoursAgo(6),
    checkTermoEsgotamentoSus: true,
    aceitesHospitais: [],
    faturasEnviadasCompras: false,
    registradoEsgotamentoPorId: "u1",
  },
  {
    id: "s3",
    protocolo: "CORE-2026-0003",
    solicitanteId: "u1",
    unidadeOrigem: "Hospital Regional Uberaba",
    macrorregiaoOrigem: "Triângulo",
    municipioOrigem: "Uberaba",
    pacienteNome: "Pedro Henrique Nunes",
    pacienteCpf: "345.678.901-22",
    pacienteCns: "708 1122 3344 5566",
    pacienteNascimento: "2019-03-14",
    diagnosticoPrincipal: "Pneumonia grave com insuficiência respiratória",
    cid: "J18.9",
    gravidade: "LARANJA",
    sinaisVitais: { pa: "80/50", fc: "140", fr: "42", temp: "39.1", spo2: "88%" },
    justificativa: "Paciente pediátrico necessitando UTI Pediátrica com ventilação mecânica.",
    anexos: [],
    gatilhoCompra: "ESGOTAMENTO_CLINICO",
    status: "PARECER_EMITIDO",
    criadoEm: daysAgo(1),
    checkTermoEsgotamentoSus: true,
    aceitesHospitais: [],
    faturasEnviadasCompras: false,
    registradoEsgotamentoPorId: "u1",
    parecer: {
      reguladorId: "u2",
      vagaZeroTentada: true,
      vagaZeroDetalhe:
        "Acionadas UPAs de Uberaba, Uberlândia e HC/UFTM. Nenhum leito pediátrico disponível.",
      parecerTecnico:
        "Esgotados os leitos públicos da macrorregião Triângulo. Indica-se compra extraordinária de leito de UTI Pediátrica em prestador credenciado.",
      clinicaIndicada: "UTI Pediátrica",
      emitidoEm: hoursAgo(10),
      checkTermoEsgotamentoSus: true,
    },
  },
  {
    id: "s4",
    protocolo: "CORE-2026-0004",
    solicitanteId: "u1",
    unidadeOrigem: "Santa Casa BH",
    macrorregiaoOrigem: "Centro",
    municipioOrigem: "Belo Horizonte",
    pacienteNome: "Luiza Martins Almeida",
    pacienteCpf: "456.789.012-33",
    pacienteCns: "702 3344 5566 7788",
    pacienteNascimento: "1955-11-02",
    diagnosticoPrincipal: "Sepse abdominal pós-cirúrgica",
    cid: "A41.9",
    gravidade: "VERMELHO",
    sinaisVitais: { pa: "70/40", fc: "138", fr: "30", temp: "39.6", spo2: "90%" },
    justificativa: "UTI Adulto imediata com suporte hemodinâmico avançado.",
    anexos: [],
    gatilhoCompra: "ESGOTAMENTO_CLINICO",
    status: "AUTORIZADO_AUTORIDADE",
    criadoEm: daysAgo(1),
    checkTermoEsgotamentoSus: true,
    aceitesHospitais: [],
    faturasEnviadasCompras: false,
    registradoEsgotamentoPorId: "u1",
    parecer: {
      reguladorId: "u3",
      vagaZeroTentada: true,
      vagaZeroDetalhe: "Acionamento das centrais regionais sem retorno em 45 min.",
      parecerTecnico:
        "Esgotamento de leitos SUS. Justificada aquisição extraordinária de UTI Adulto.",
      clinicaIndicada: "UTI Adulto",
      emitidoEm: daysAgo(1),
      checkTermoEsgotamentoSus: true,
    },
    autorizacao: {
      autoridadeId: "u4",
      termoNumero: "TA-2026-0018",
      observacoes: "Autorização emergencial, prazo máximo de acionamento 30 min.",
      assinadoEm: hoursAgo(20),
    },
  },
  {
    id: "s5",
    protocolo: "CORE-2026-0005",
    solicitanteId: "u1",
    unidadeOrigem: "Hospital Municipal Ipatinga",
    macrorregiaoOrigem: "Vale do Aço",
    municipioOrigem: "Ipatinga",
    pacienteNome: "Antônio Ribeiro Gomes",
    pacienteCpf: "567.890.123-44",
    pacienteCns: "701 9988 7766 5544",
    pacienteNascimento: "1970-07-19",
    diagnosticoPrincipal: "Politrauma por acidente automobilístico",
    cid: "T07",
    gravidade: "VERMELHO",
    sinaisVitais: { pa: "100/60", fc: "120", fr: "22", temp: "36.5", spo2: "94%", glasgow: "10" },
    justificativa: "UTI Trauma com suporte neurocirúrgico.",
    anexos: [],
    gatilhoCompra: "ESGOTAMENTO_CLINICO",
    status: "INTERNADO",
    criadoEm: daysAgo(3),
    checkTermoEsgotamentoSus: true,
    aceitesHospitais: [],
    faturasEnviadasCompras: false,
    registradoEsgotamentoPorId: "u1",
    parecer: {
      reguladorId: "u2",
      vagaZeroTentada: true,
      vagaZeroDetalhe: "Sem vaga na rede pública Vale do Aço.",
      parecerTecnico: "Compra de leito de UTI justificada.",
      clinicaIndicada: "UTI Adulto",
      emitidoEm: daysAgo(3),
      checkTermoEsgotamentoSus: true,
    },
    autorizacao: {
      autoridadeId: "u5",
      termoNumero: "TA-2026-0012",
      observacoes: "Autorizado.",
      assinadoEm: daysAgo(3),
    },
    compra: {
      compradorId: "u6",
      hospitalId: "h4",
      valorDiaria: 4800,
      empenho: "EMP-2026-0421",
      internacaoEm: daysAgo(2),
      registradoEm: daysAgo(2),
    },
  },
  {
    id: "s6",
    protocolo: "CORE-2026-0006",
    solicitanteId: "u1",
    unidadeOrigem: "Hospital Regional Norte",
    macrorregiaoOrigem: "Norte",
    municipioOrigem: "Montes Claros",
    pacienteNome: "Carlos Judicial de Souza",
    pacienteCpf: "678.901.234-55",
    pacienteCns: "700 1122 3344 5599",
    pacienteNascimento: "1980-01-15",
    diagnosticoPrincipal: "Insuficiência renal aguda por sepse",
    cid: "N17.9",
    gravidade: "LARANJA",
    sinaisVitais: { pa: "110/70", fc: "115", fr: "22", temp: "38.5", spo2: "93%" },
    justificativa: "Ordem judicial de internação em UTI com hemodiálise.",
    anexos: [{ id: "a6", nome: "mandado-judicial.pdf", tipo: "application/pdf", tamanhoKb: 220 }],
    gatilhoCompra: "ORDEM_JUDICIAL_EXPIRADA",
    judicial: {
      numeroMandadoJudicial: "5001234-56.2026.8.13.0433",
      prazoLimiteJudicial: hoursAgo(-24),
      vara: "1ª Vara da Fazenda Pública — Montes Claros",
    },
    status: "PARECER_EMITIDO",
    criadoEm: daysAgo(1),
    checkTermoEsgotamentoSus: true,
    aceitesHospitais: [],
    faturasEnviadasCompras: false,
    registradoEsgotamentoPorId: "u1",
    parecer: {
      reguladorId: "u2",
      vagaZeroTentada: true,
      vagaZeroDetalhe: "Vaga Zero acionada sem retorno.",
      parecerTecnico:
        "Prazo judicial vigente. Indicada compra extraordinária de UTI Adulto com hemodiálise.",
      clinicaIndicada: "UTI Adulto",
      emitidoEm: hoursAgo(6),
      checkTermoEsgotamentoSus: true,
    },
  },
];

const seedAuditoria: RegistroAuditoria[] = seedSolicitacoes.map((s, i) => ({
  id: `aud-seed-${i}`,
  solicitacaoId: s.id,
  usuarioId: s.solicitanteId,
  usuarioNome: USUARIOS_MOCK.find((u) => u.id === s.solicitanteId)!.nome,
  usuarioCpf: USUARIOS_MOCK.find((u) => u.id === s.solicitanteId)!.cpf,
  perfil: "SOLICITANTE",
  acao: "Criação da solicitação",
  detalhe: `Protocolo ${s.protocolo}`,
  emAt: s.criadoEm,
  statusDepois: "AGUARDANDO_REGULACAO",
}));

// ---------- Store ----------
type NovaSolicitacaoInput = Omit<
  Solicitacao,
  | "id"
  | "protocolo"
  | "status"
  | "criadoEm"
  | "solicitanteId"
  | "unidadeOrigem"
  | "aceitesHospitais"
  | "faturasEnviadasCompras"
  | "registradoEsgotamentoPorId"
>;

interface CoreStore {
  usuarioAtual: Usuario;
  usuarios: Usuario[];
  solicitacoes: Solicitacao[];
  auditoria: RegistroAuditoria[];

  loginPorEmail: (email: string, senha: string) => { ok: true } | { ok: false; erro: string };
  trocarUsuario: (id: string) => void;

  criarSolicitacao: (dados: NovaSolicitacaoInput) => Solicitacao;
  emitirParecer: (
    solicitacaoId: string,
    parecer: Omit<ParecerRegulador, "reguladorId" | "emitidoEm">,
    novoStatus: Extract<StatusSolicitacao, "AGUARDANDO_VAGA_ZERO" | "PARECER_EMITIDO">,
  ) => void;
  autorizarCompra: (
    solicitacaoId: string,
    autorizacao: Omit<AutorizacaoAutoridade, "autoridadeId" | "assinadoEm" | "termoNumero">,
  ) => void;

  // Enfermagem
  iniciarBuscaMacro: (solicitacaoId: string) => void;
  registrarAceite: (solicitacaoId: string, hospitalId: string, vagas?: number) => void;
  expandirParaEstadual: (solicitacaoId: string) => void;
  confirmarLeitoEnfermagem: (
    solicitacaoId: string,
    escolha: Omit<EscolhaEnfermagem, "enfermeiroId" | "confirmadoEm">,
  ) => void;

  // Administrativo / SEI
  abrirProcessoSei: (
    solicitacaoId: string,
    sei: Omit<ProcessoSei, "administrativoId" | "iniciadoEm">,
  ) => void;
  registrarCompra: (solicitacaoId: string, compra: Omit<CompraLeito, "compradorId" | "registradoEm">) => void;
  registrarInternacao: (solicitacaoId: string) => void;
  enviarFaturasParaCompras: (solicitacaoId: string, observacoes: string) => void;

  // Recusas e cancelamentos
  recusar: (solicitacaoId: string, motivo: string) => void;
  cancelarAbsorcaoSus: (solicitacaoId: string, justificativa: string) => void;
}

const Ctx = createContext<CoreStore | null>(null);

export function CoreProvider({ children }: { children: ReactNode }) {
  const [usuarioAtualId, setUsuarioAtualId] = useState("u1");
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>(seedSolicitacoes);
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>(seedAuditoria);

  const usuarioAtual = useMemo(
    () => USUARIOS_MOCK.find((u) => u.id === usuarioAtualId)!,
    [usuarioAtualId],
  );

  const logAudit = useCallback(
    (
      r: Omit<RegistroAuditoria, "id" | "emAt" | "usuarioId" | "usuarioNome" | "usuarioCpf" | "perfil">,
      atorId?: string,
    ) => {
      const ator = atorId ? USUARIOS_MOCK.find((u) => u.id === atorId)! : usuarioAtual;
      setAuditoria((prev) => [
        {
          ...r,
          id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          emAt: nowIso(),
          usuarioId: ator.id,
          usuarioNome: ator.nome,
          usuarioCpf: ator.cpf,
          perfil: ator.perfil,
        },
        ...prev,
      ]);
    },
    [usuarioAtual],
  );

  const validarTransicao = useCallback(
    (atual: StatusSolicitacao, proximo: StatusSolicitacao, perfil: PerfilId) => {
      const permitidas = TRANSICOES[atual] ?? [];
      const t = permitidas.find((p) => p.proximo === proximo && p.perfil === perfil);
      if (!t) {
        throw new Error(
          `Transição não permitida: ${atual} → ${proximo} pelo perfil ${perfil}. Edição retroativa bloqueada.`,
        );
      }
    },
    [],
  );

  const loginPorEmail: CoreStore["loginPorEmail"] = useCallback((email, senha) => {
    const u = USUARIOS_MOCK.find(
      (x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.senha === senha,
    );
    if (!u) return { ok: false, erro: "E-mail ou senha inválidos." };
    setUsuarioAtualId(u.id);
    return { ok: true };
  }, []);

  const criarSolicitacao: CoreStore["criarSolicitacao"] = useCallback(
    (dados) => {
      if (usuarioAtual.perfil !== "SOLICITANTE") {
        throw new Error("Somente o perfil SOLICITANTE pode criar solicitações.");
      }
      const seq = String(seedSolicitacoes.length + Date.now()).slice(-4).padStart(4, "0");
      const nova: Solicitacao = {
        ...dados,
        id: `s-${Date.now()}`,
        protocolo: `CORE-2026-${seq}`,
        status: "AGUARDANDO_REGULACAO",
        criadoEm: nowIso(),
        solicitanteId: usuarioAtual.id,
        unidadeOrigem: usuarioAtual.unidade,
        aceitesHospitais: [],
        faturasEnviadasCompras: false,
        registradoEsgotamentoPorId: usuarioAtual.id,
      };
      setSolicitacoes((prev) => [nova, ...prev]);
      logAudit({
        solicitacaoId: nova.id,
        acao: "Criação da solicitação",
        detalhe: `Paciente ${nova.pacienteNome} • ${nova.diagnosticoPrincipal} • Gatilho: ${nova.gatilhoCompra}`,
        statusDepois: "AGUARDANDO_REGULACAO",
      });
      return nova;
    },
    [usuarioAtual, logAudit],
  );

  const emitirParecer: CoreStore["emitirParecer"] = useCallback(
    (id, parecer, novoStatus) => {
      if (usuarioAtual.perfil !== "REGULADOR") {
        throw new Error("Somente o Médico Regulador pode emitir parecer.");
      }
      setSolicitacoes((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          validarTransicao(s.status, novoStatus, "REGULADOR");
          const emAt = nowIso();
          const novo: Solicitacao = {
            ...s,
            status: novoStatus,
            checkTermoEsgotamentoSus: parecer.checkTermoEsgotamentoSus || s.checkTermoEsgotamentoSus,
            parecer: {
              ...parecer,
              reguladorId: usuarioAtual.id,
              emitidoEm: emAt,
            },
          };
          logAudit({
            solicitacaoId: id,
            acao:
              novoStatus === "AGUARDANDO_VAGA_ZERO"
                ? "Registro de tentativa de Vaga Zero"
                : "Emissão de parecer técnico",
            detalhe: parecer.parecerTecnico.slice(0, 160),
            statusAntes: s.status,
            statusDepois: novoStatus,
          });
          return novo;
        }),
      );
    },
    [usuarioAtual, logAudit, validarTransicao],
  );

  const autorizarCompra: CoreStore["autorizarCompra"] = useCallback(
    (id, dados) => {
      if (usuarioAtual.perfil !== "AUTORIDADE") {
        throw new Error("Somente Autoridade Sanitária pode autorizar compra.");
      }
      setSolicitacoes((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;

          const bypassJudicial = s.gatilhoCompra === "ORDEM_JUDICIAL_EXPIRADA";

          // Trava 1: quem emitiu o parecer não pode assinar (salvo judicial)
          if (!bypassJudicial && s.parecer && s.parecer.reguladorId === usuarioAtual.id) {
            throw new Error(
              "Segregação de funções: o autor do parecer técnico não pode autorizar o Termo (exceto ordem judicial expirada).",
            );
          }
          // Trava 2: quem registrou o esgotamento SUS (fase 1) não pode autorizar (salvo judicial)
          if (!bypassJudicial && s.registradoEsgotamentoPorId === usuarioAtual.id) {
            throw new Error(
              "Segregação de funções: o profissional que registrou o esgotamento SUS não pode autorizar a compra (exceto ordem judicial expirada).",
            );
          }

          validarTransicao(s.status, "AUTORIZADO_AUTORIDADE", "AUTORIDADE");
          const termoNumero = `TA-2026-${String(Date.now()).slice(-4)}`;
          const novo: Solicitacao = {
            ...s,
            status: "AUTORIZADO_AUTORIDADE",
            autorizacao: {
              ...dados,
              autoridadeId: usuarioAtual.id,
              termoNumero,
              assinadoEm: nowIso(),
            },
          };
          logAudit({
            solicitacaoId: id,
            acao: bypassJudicial
              ? "Assinatura do Termo (bypass judicial)"
              : "Assinatura do Termo de Acionamento",
            detalhe: `Termo ${termoNumero}${bypassJudicial ? " • Ordem judicial vigente" : ""}`,
            statusAntes: s.status,
            statusDepois: "AUTORIZADO_AUTORIDADE",
          });
          return novo;
        }),
      );
    },
    [usuarioAtual, logAudit, validarTransicao],
  );

  // ---- Enfermagem ----
  const iniciarBuscaMacro: CoreStore["iniciarBuscaMacro"] = useCallback(
    (id) => {
      if (usuarioAtual.perfil !== "ENFERMEIRO") {
        throw new Error("Somente o Enfermeiro Navegador pode iniciar a busca.");
      }
      setSolicitacoes((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          validarTransicao(s.status, "BUSCA_MACRO_REGIONAL", "ENFERMEIRO");
          logAudit({
            solicitacaoId: id,
            acao: "Início da busca ativa (macrorregional)",
            statusAntes: s.status,
            statusDepois: "BUSCA_MACRO_REGIONAL",
          });
          return { ...s, status: "BUSCA_MACRO_REGIONAL", buscaIniciadaEm: nowIso() };
        }),
      );
    },
    [usuarioAtual, logAudit, validarTransicao],
  );

  const registrarAceite: CoreStore["registrarAceite"] = useCallback(
    (id, hospitalId, vagas = 1) => {
      setSolicitacoes((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          if (s.aceitesHospitais.some((a) => a.hospitalId === hospitalId)) return s;
          const novo = {
            ...s,
            aceitesHospitais: [
              ...s.aceitesHospitais,
              { hospitalId, aceitoEm: nowIso(), vagasDisponiveis: vagas },
            ],
          };
          logAudit({
            solicitacaoId: id,
            acao: "Aceite recebido do hospital credenciado",
            detalhe: `Hospital ${hospitalId} • ${vagas} vaga(s)`,
          });
          return novo;
        }),
      );
    },
    [logAudit],
  );

  const expandirParaEstadual: CoreStore["expandirParaEstadual"] = useCallback(
    (id) => {
      if (usuarioAtual.perfil !== "ENFERMEIRO") {
        throw new Error("Somente o Enfermeiro Navegador pode expandir a busca.");
      }
      setSolicitacoes((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          validarTransicao(s.status, "BUSCA_ESTADUAL_EXPANDIDA", "ENFERMEIRO");
          logAudit({
            solicitacaoId: id,
            acao: "Expansão da busca para nível estadual",
            statusAntes: s.status,
            statusDepois: "BUSCA_ESTADUAL_EXPANDIDA",
          });
          return { ...s, status: "BUSCA_ESTADUAL_EXPANDIDA" };
        }),
      );
    },
    [usuarioAtual, logAudit, validarTransicao],
  );

  const confirmarLeitoEnfermagem: CoreStore["confirmarLeitoEnfermagem"] = useCallback(
    (id, escolha) => {
      if (usuarioAtual.perfil !== "ENFERMEIRO") {
        throw new Error("Somente o Enfermeiro Navegador pode confirmar o leito.");
      }
      setSolicitacoes((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          validarTransicao(s.status, "LEITO_CONFIRMADO_ENFERMAGEM", "ENFERMEIRO");
          const novo: Solicitacao = {
            ...s,
            status: "LEITO_CONFIRMADO_ENFERMAGEM",
            escolhaEnfermagem: {
              ...escolha,
              enfermeiroId: usuarioAtual.id,
              confirmadoEm: nowIso(),
            },
          };
          logAudit({
            solicitacaoId: id,
            acao: "Leito confirmado pela Enfermagem",
            detalhe: `Hospital ${escolha.hospitalId} • Critério: ${escolha.criterioDesempateUtilizado}`,
            statusAntes: s.status,
            statusDepois: "LEITO_CONFIRMADO_ENFERMAGEM",
          });
          return novo;
        }),
      );
    },
    [usuarioAtual, logAudit, validarTransicao],
  );

  // ---- Administrativo / SEI ----
  const abrirProcessoSei: CoreStore["abrirProcessoSei"] = useCallback(
    (id, sei) => {
      if (usuarioAtual.perfil !== "ADMINISTRATIVO") {
        throw new Error("Somente o Setor Administrativo pode abrir processo SEI.");
      }
      if (!sei.checkLaudoPaciente || !sei.checkTermoAcionamento || !sei.checkTermoEsgotamentoSus) {
        throw new Error("Checklist documental incompleto (3 peças obrigatórias).");
      }
      setSolicitacoes((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          validarTransicao(s.status, "PROCESSO_SEI_INICIADO", "ADMINISTRATIVO");
          const novo: Solicitacao = {
            ...s,
            status: "PROCESSO_SEI_INICIADO",
            numeroSeiProcesso: sei.numeroSeiProcesso,
            processoSei: {
              ...sei,
              administrativoId: usuarioAtual.id,
              iniciadoEm: nowIso(),
            },
          };
          logAudit({
            solicitacaoId: id,
            acao: "Abertura de Processo SEI",
            detalhe: `SEI ${sei.numeroSeiProcesso}`,
            statusAntes: s.status,
            statusDepois: "PROCESSO_SEI_INICIADO",
          });
          return novo;
        }),
      );
    },
    [usuarioAtual, logAudit, validarTransicao],
  );

  const registrarCompra: CoreStore["registrarCompra"] = useCallback(
    (id, dados) => {
      if (usuarioAtual.perfil !== "ADMINISTRATIVO") {
        throw new Error("Somente Setor Administrativo pode registrar compra.");
      }
      setSolicitacoes((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          validarTransicao(s.status, "LEITO_COMPRADO", "ADMINISTRATIVO");
          const novo: Solicitacao = {
            ...s,
            status: "LEITO_COMPRADO",
            compra: {
              ...dados,
              compradorId: usuarioAtual.id,
              registradoEm: nowIso(),
            },
          };
          logAudit({
            solicitacaoId: id,
            acao: "Registro de compra de leito",
            detalhe: `Hospital ${dados.hospitalId} • Empenho ${dados.empenho} • R$ ${dados.valorDiaria}/diária`,
            statusAntes: s.status,
            statusDepois: "LEITO_COMPRADO",
          });
          return novo;
        }),
      );
    },
    [usuarioAtual, logAudit, validarTransicao],
  );

  const registrarInternacao: CoreStore["registrarInternacao"] = useCallback(
    (id) => {
      if (usuarioAtual.perfil !== "ADMINISTRATIVO") {
        throw new Error("Somente Setor Administrativo pode confirmar internação.");
      }
      setSolicitacoes((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          validarTransicao(s.status, "INTERNADO", "ADMINISTRATIVO");
          logAudit({
            solicitacaoId: id,
            acao: "Confirmação de internação efetiva",
            statusAntes: s.status,
            statusDepois: "INTERNADO",
          });
          return { ...s, status: "INTERNADO" };
        }),
      );
    },
    [usuarioAtual, logAudit, validarTransicao],
  );

  const enviarFaturasParaCompras: CoreStore["enviarFaturasParaCompras"] = useCallback(
    (id, observacoes) => {
      if (usuarioAtual.perfil !== "ADMINISTRATIVO") {
        throw new Error("Somente Setor Administrativo pode encaminhar faturas.");
      }
      setSolicitacoes((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          validarTransicao(s.status, "PROCESSO_FINANCEIRO_EM_PAGAMENTO", "ADMINISTRATIVO");
          const novo: Solicitacao = {
            ...s,
            status: "PROCESSO_FINANCEIRO_EM_PAGAMENTO",
            faturasEnviadasCompras: true,
            envioFaturas: {
              administrativoId: usuarioAtual.id,
              enviadoEm: nowIso(),
              observacoes,
            },
          };
          logAudit({
            solicitacaoId: id,
            acao: "Encaminhamento de faturas ao Setor de Compras",
            detalhe: observacoes.slice(0, 160),
            statusAntes: s.status,
            statusDepois: "PROCESSO_FINANCEIRO_EM_PAGAMENTO",
          });
          return novo;
        }),
      );
    },
    [usuarioAtual, logAudit, validarTransicao],
  );

  const recusar: CoreStore["recusar"] = useCallback(
    (id, motivo) => {
      if (usuarioAtual.perfil !== "REGULADOR" && usuarioAtual.perfil !== "AUTORIDADE") {
        throw new Error("Recusa restrita a Regulador ou Autoridade Sanitária.");
      }
      setSolicitacoes((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          validarTransicao(s.status, "RECUSADO", usuarioAtual.perfil);
          logAudit({
            solicitacaoId: id,
            acao: "Recusa da solicitação",
            detalhe: motivo,
            statusAntes: s.status,
            statusDepois: "RECUSADO",
          });
          return { ...s, status: "RECUSADO" };
        }),
      );
    },
    [usuarioAtual, logAudit, validarTransicao],
  );

  const cancelarAbsorcaoSus: CoreStore["cancelarAbsorcaoSus"] = useCallback(
    (id, justificativa) => {
      if (justificativa.trim().length < 15) {
        throw new Error("Justificativa obrigatória (mín. 15 caracteres).");
      }
      setSolicitacoes((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          if (s.status === "INTERNADO" || s.status === "PROCESSO_FINANCEIRO_EM_PAGAMENTO") {
            throw new Error("Cancelamento por absorção SUS não permitido após internação definitiva.");
          }
          if (s.status === "CANCELADO_ABSORVIDO_SUS" || s.status === "RECUSADO") {
            throw new Error("Solicitação já encerrada.");
          }
          logAudit({
            solicitacaoId: id,
            acao: "Cancelamento por absorção SUS",
            detalhe: justificativa,
            statusAntes: s.status,
            statusDepois: "CANCELADO_ABSORVIDO_SUS",
          });
          return {
            ...s,
            status: "CANCELADO_ABSORVIDO_SUS",
            cancelamento: {
              canceladoPorId: usuarioAtual.id,
              canceladoEm: nowIso(),
              justificativa,
            },
          };
        }),
      );
    },
    [usuarioAtual, logAudit],
  );

  const value: CoreStore = {
    usuarioAtual,
    usuarios: USUARIOS_MOCK,
    solicitacoes,
    auditoria,
    loginPorEmail,
    trocarUsuario: setUsuarioAtualId,
    criarSolicitacao,
    emitirParecer,
    autorizarCompra,
    iniciarBuscaMacro,
    registrarAceite,
    expandirParaEstadual,
    confirmarLeitoEnfermagem,
    abrirProcessoSei,
    registrarCompra,
    registrarInternacao,
    enviarFaturasParaCompras,
    recusar,
    cancelarAbsorcaoSus,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCore fora do CoreProvider");
  return v;
}
