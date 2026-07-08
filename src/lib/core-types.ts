/**
 * Tipos e constantes — CORE/MG
 */

// ---------- Perfis ----------
export type PerfilId =
  "REGULADOR" | "AUTORIDADE" | "ENFERMEIRO" | "ADMINISTRATIVO" | "ADMINISTRATIVO_CORE" | "GESTAO";

export interface Perfil {
  id: PerfilId;
  nome: string;
  descricao: string;
}

export const PERFIS: Perfil[] = [
  { id: "REGULADOR", nome: "Médico Regulador", descricao: "CORE/MG" },
  { id: "AUTORIDADE", nome: "Autoridade Sanitária", descricao: "Coordenador CORE" },
  { id: "ENFERMEIRO", nome: "Enfermeiro Navegador", descricao: "Busca ativa de leito credenciado" },
  {
    id: "ADMINISTRATIVO",
    nome: "Setor de Compras/Contratos",
    descricao: "SEI, faturas e liquidação",
  },
  { id: "ADMINISTRATIVO_CORE", nome: "Administrativo CORE/MG", descricao: "Gestão operacional" },
  { id: "GESTAO", nome: "Gestão SUBASS", descricao: "Painel gerencial" },
];

export interface Usuario {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  perfil: PerfilId;
  unidade: string;
  email: string;
  senha: string;
}

export const USUARIOS_MOCK: Usuario[] = [
  {
    id: "u2",
    nome: "Dr. Bruno Lima",
    cpf: "222.222.222-22",
    matricula: "MG-1002",
    perfil: "REGULADOR",
    unidade: "CORE/MG",
    email: "bruno@saude.mg.gov.br",
    senha: "core2026",
  },
  {
    id: "u3",
    nome: "Dra. Carla Dias",
    cpf: "333.333.333-33",
    matricula: "MG-1003",
    perfil: "AUTORIDADE",
    unidade: "CORE/MG",
    email: "carla@saude.mg.gov.br",
    senha: "core2026",
  },
  {
    id: "u4",
    nome: "Enf. Diego Reis",
    cpf: "444.444.444-44",
    matricula: "MG-1004",
    perfil: "ENFERMEIRO",
    unidade: "CORE/MG",
    email: "diego@saude.mg.gov.br",
    senha: "core2026",
  },
  {
    id: "u5",
    nome: "Eduarda Melo",
    cpf: "555.555.555-55",
    matricula: "MG-1005",
    perfil: "ADMINISTRATIVO",
    unidade: "SES/MG - Compras",
    email: "eduarda@saude.mg.gov.br",
    senha: "core2026",
  },
  {
    id: "u6",
    nome: "Fábio Nunes",
    cpf: "666.666.666-66",
    matricula: "MG-1006",
    perfil: "GESTAO",
    unidade: "SUBASS",
    email: "fabio@saude.mg.gov.br",
    senha: "core2026",
  },
  {
    id: "u7",
    nome: "Gabriela Rocha",
    cpf: "777.777.777-77",
    matricula: "MG-1007",
    perfil: "ADMINISTRATIVO_CORE",
    unidade: "CORE/MG",
    email: "gabriela@saude.mg.gov.br",
    senha: "core2026",
  },
];

// ---------- Macrorregiões / clínicas ----------
export type Macrorregiao =
  "Centro" | "Sul" | "Norte" | "Leste" | "Oeste" | "Triângulo do Sul" | "Vale do Aço";

export const MACRORREGIOES: Macrorregiao[] = [
  "Centro",
  "Sul",
  "Norte",
  "Leste",
  "Oeste",
  "Triângulo do Sul",
  "Vale do Aço",
];

export type ClinicaMedica =
  | "UTI Adulto"
  | "UTI Pediátrica"
  | "UTI Neonatal"
  | "Clínica Médica"
  | "Cirúrgica"
  | "Cardiológica";

export const CLINICAS: ClinicaMedica[] = [
  "UTI Adulto",
  "UTI Pediátrica",
  "UTI Neonatal",
  "Clínica Médica",
  "Cirúrgica",
  "Cardiológica",
];

// ---------- Gravidade ----------
export type Gravidade = "VERMELHO" | "LARANJA" | "AMARELO" | "VERDE";

export const GRAVIDADE_META: Record<Gravidade, { label: string; classe: string; peso: number }> = {
  VERMELHO: { label: "Vermelho", classe: "bg-destructive/15 text-destructive", peso: 4 },
  LARANJA: { label: "Laranja", classe: "bg-warning/25 text-warning-foreground", peso: 3 },
  AMARELO: { label: "Amarelo", classe: "bg-info/20 text-info", peso: 2 },
  VERDE: { label: "Verde", classe: "bg-success/15 text-success", peso: 1 },
};

// ---------- Sinais vitais / anexos / gatilhos ----------
export interface SinaisVitais {
  pa: string;
  fc: string;
  fr: string;
  temp: string;
  spo2: string;
  glasgow?: string;
}
export interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  tamanhoKb: number;
}

export type GatilhoCompra =
  | "ESGOTAMENTO_CLINICO"
  | "ORDEM_JUDICIAL_EXPIRADA"
  | "ESGOTAMENTO_LEITO_SUS"
  | "DETERMINACAO_JUDICIAL"
  | "RISCO_IMINENTE_MORTE";

export const GATILHOS_BYPASS_TRIAGEM: GatilhoCompra[] = [
  "ESGOTAMENTO_LEITO_SUS",
  "DETERMINACAO_JUDICIAL",
  "RISCO_IMINENTE_MORTE",
  "ORDEM_JUDICIAL_EXPIRADA",
];

// ---------- Status ----------
export type StatusSolicitacao =
  | "AGUARDANDO_REGULACAO"
  | "AGUARDANDO_VAGA_ZERO"
  | "PARECER_EMITIDO"
  | "TERMO_PENDENTE_HOMOLOGACAO"
  | "AUTORIZADO_AUTORIDADE"
  | "DIRECIONADO_VAGA_ZERO"
  | "DIRECIONADO_LEITO_EXTRA"
  | "INDEFERIDO_AUTORIDADE"
  | "BUSCA_MACRO_REGIONAL"
  | "BUSCA_ESTADUAL_EXPANDIDA"
  | "LEITO_CONFIRMADO_ENFERMAGEM"
  | "PROCESSO_SEI_INICIADO"
  | "LEITO_COMPRADO"
  | "INTERNADO"
  | "PROCESSO_FINANCEIRO_EM_PAGAMENTO"
  | "CANCELADO_ABSORVIDO_SUS"
  | "RECUSADO";

export type StatusTone = "info" | "warning" | "success" | "destructive" | "muted";

export const STATUS_META: Record<StatusSolicitacao, { label: string; tone: StatusTone }> = {
  AGUARDANDO_REGULACAO: { label: "Aguardando Autoridade Sanitária", tone: "info" },
  AGUARDANDO_VAGA_ZERO: { label: "Aguardando Vaga Zero", tone: "warning" },
  PARECER_EMITIDO: { label: "Parecer Emitido", tone: "info" },
  TERMO_PENDENTE_HOMOLOGACAO: { label: "Termo Pendente Homologação", tone: "warning" },
  AUTORIZADO_AUTORIDADE: { label: "Compra autorizada", tone: "success" },
  DIRECIONADO_VAGA_ZERO: { label: "Direcionado para Vaga Zero", tone: "warning" },
  DIRECIONADO_LEITO_EXTRA: { label: "Direcionado para Leito Extra", tone: "warning" },
  INDEFERIDO_AUTORIDADE: { label: "Indeferido pela Autoridade", tone: "destructive" },
  BUSCA_MACRO_REGIONAL: { label: "Busca Macrorregional", tone: "info" },
  BUSCA_ESTADUAL_EXPANDIDA: { label: "Busca Estadual", tone: "info" },
  LEITO_CONFIRMADO_ENFERMAGEM: { label: "Leito Confirmado (Enfermagem)", tone: "success" },
  PROCESSO_SEI_INICIADO: { label: "Processo SEI Iniciado", tone: "info" },
  LEITO_COMPRADO: { label: "Leito Comprado", tone: "success" },
  INTERNADO: { label: "Internado", tone: "success" },
  PROCESSO_FINANCEIRO_EM_PAGAMENTO: { label: "Em Pagamento", tone: "muted" },
  CANCELADO_ABSORVIDO_SUS: { label: "Absorvido pelo SUS", tone: "muted" },
  RECUSADO: { label: "Recusado", tone: "destructive" },
};

export const TRANSICOES: Record<
  StatusSolicitacao,
  Array<{ proximo: StatusSolicitacao; perfil: PerfilId }>
> = {
  AGUARDANDO_REGULACAO: [],
  AGUARDANDO_VAGA_ZERO: [],
  PARECER_EMITIDO: [],
  TERMO_PENDENTE_HOMOLOGACAO: [],
  AUTORIZADO_AUTORIDADE: [],
  DIRECIONADO_VAGA_ZERO: [],
  DIRECIONADO_LEITO_EXTRA: [],
  INDEFERIDO_AUTORIDADE: [],
  BUSCA_MACRO_REGIONAL: [],
  BUSCA_ESTADUAL_EXPANDIDA: [],
  LEITO_CONFIRMADO_ENFERMAGEM: [],
  PROCESSO_SEI_INICIADO: [],
  LEITO_COMPRADO: [],
  INTERNADO: [],
  PROCESSO_FINANCEIRO_EM_PAGAMENTO: [],
  CANCELADO_ABSORVIDO_SUS: [],
  RECUSADO: [],
};

// ---------- Escopo de busca / transferência / contatos ----------
export type EscopoBusca = "MACRO_ORIGEM" | "MACRO_PROXIMA" | "ESTADUAL";
export const ESCOPOS_BUSCA: EscopoBusca[] = ["MACRO_ORIGEM", "MACRO_PROXIMA", "ESTADUAL"];
export const ESCOPO_BUSCA_LABEL: Record<EscopoBusca, string> = {
  MACRO_ORIGEM: "Macro-Origem",
  MACRO_PROXIMA: "Macro-Próxima",
  ESTADUAL: "Estadual",
};

export type StatusTransferencia = "AGUARDANDO_TRANSPORTE" | "EM_TRANSITO" | "ADMITIDO_DESTINO";
export const STATUS_TRANSFERENCIA_ORDEM: StatusTransferencia[] = [
  "AGUARDANDO_TRANSPORTE",
  "EM_TRANSITO",
  "ADMITIDO_DESTINO",
];
export const STATUS_TRANSFERENCIA_LABEL: Record<StatusTransferencia, string> = {
  AGUARDANDO_TRANSPORTE: "Aguardando Transporte",
  EM_TRANSITO: "Em Trânsito",
  ADMITIDO_DESTINO: "Admitido no Destino",
};

export type CanalContato = "TELEFONE" | "EMAIL";
export const CANAL_CONTATO_LABEL: Record<CanalContato, string> = {
  TELEFONE: "Telefone",
  EMAIL: "E-mail",
};

export type ResultadoContato = "ACEITE" | "RECUSA" | "SEM_RESPOSTA";
export const RESULTADO_CONTATO_LABEL: Record<ResultadoContato, string> = {
  ACEITE: "Aceite",
  RECUSA: "Recusa",
  SEM_RESPOSTA: "Sem Resposta",
};

export type MotivoRecusa =
  | "SEM_LEITO_DISPONIVEL"
  | "SEM_PERFIL_ASSISTENCIAL"
  | "SEM_ESPECIALIDADE"
  | "SEM_EQUIPE_DISPONIVEL"
  | "SEM_RECURSO_DIAGNOSTICO_TERAPEUTICO"
  | "PACIENTE_INCOMPATIVEL"
  | "NAO_ATENDE_TIPO_LEITO"
  | "OUTRO";

export const MOTIVO_RECUSA_LABEL: Record<MotivoRecusa, string> = {
  SEM_LEITO_DISPONIVEL: "Sem leito disponível",
  SEM_PERFIL_ASSISTENCIAL: "Sem perfil assistencial",
  SEM_ESPECIALIDADE: "Sem especialidade",
  SEM_EQUIPE_DISPONIVEL: "Sem equipe disponível",
  SEM_RECURSO_DIAGNOSTICO_TERAPEUTICO: "Sem recurso diagnóstico/terapêutico",
  PACIENTE_INCOMPATIVEL: "Paciente incompatível com o serviço",
  NAO_ATENDE_TIPO_LEITO: "Não atende ao tipo de leito solicitado",
  OUTRO: "Outro",
};

export interface HistoricoContato {
  id: string;
  hospitalNome: string;
  dataHoraContato: string;
  canal: CanalContato;
  resultado: ResultadoContato;
  motivoRecusa?: MotivoRecusa;
  justificativaRecusa?: string;
  escopoBusca: EscopoBusca;
  registradoPorId: string;
  reacionarHospital?: boolean;
  repescagemEm?: string;
  repescagemRealizada?: boolean;
}

// ---------- Enfermagem / desempate ----------
export type CriterioDesempate = "MENOR_DISTANCIA" | "MELHOR_ESTRUTURA" | "CLINICA_DISPONIVEL";
export const CRITERIO_DESEMPATE_LABEL: Record<CriterioDesempate, string> = {
  MENOR_DISTANCIA: "Menor distância",
  MELHOR_ESTRUTURA: "Melhor estrutura",
  CLINICA_DISPONIVEL: "Clínica disponível",
};

// ---------- Sub-registros ----------
export interface ParecerRegulador {
  reguladorId: string;
  clinicaIndicada: ClinicaMedica;
  parecerTecnico: string;
  vagaZeroTentada: boolean;
  vagaZeroDetalhe: string;
  checkTermoEsgotamentoSus: boolean;
  emitidoEm: string;
}

export interface AutorizacaoAutoridade {
  autoridadeId: string;
  termoNumero: string;
  observacoes: string;
  autorizadoEm: string;
}

export interface AceiteHospital {
  hospitalId: string;
  vagasDisponiveis: number;
  aceitoEm: string;
  escopoBusca: EscopoBusca;
}

export interface EscolhaEnfermagem {
  hospitalId: string;
  criterioDesempateUtilizado: CriterioDesempate;
  justificativa: string;
  escopoBusca: string;
  confirmadoEm: string;
  enfermeiroId: string;
}

export interface ProcessoSei {
  numeroSeiProcesso: string;
  checkLaudoPaciente: boolean;
  checkTermoAcionamento: boolean;
  checkTermoEsgotamentoSus: boolean;
  abertoEm: string;
  abertoPorId: string;
}

export interface CompraLeito {
  hospitalId: string;
  valorDiaria: number;
  empenho: string;
  internacaoEm: string;
  registradoEm: string;
  registradoPorId: string;
}

export interface EnvioFaturas {
  enviadoEm: string;
  enviadoPorId: string;
  observacoes: string;
}

export interface Judicial {
  numeroProcesso: string;
  observacoes: string;
}

export interface Cancelamento {
  motivo: string;
  canceladoEm: string;
  canceladoPorId: string;
}

// ---------- Solicitação ----------
export interface Solicitacao {
  id: string;
  protocolo: string;
  solicitanteId: string;
  unidadeOrigem: string;
  cnesUnidadeOrigem?: string;
  macrorregiaoOrigem: Macrorregiao;
  municipioOrigem: string;
  pacienteNome: string;
  pacienteCpf: string;
  pacienteCns: string;
  pacienteNascimento: string;
  diagnosticoPrincipal: string;
  cid: string;
  gravidade: Gravidade;
  sinaisVitais: SinaisVitais;
  justificativa: string;
  anexos: Anexo[];
  gatilhoCompra: GatilhoCompra;
  status: StatusSolicitacao;
  criadoEm: string;

  checkTermoEsgotamentoSus: boolean;
  registradoEsgotamentoPorId?: string;

  parecer?: ParecerRegulador;
  autorizacao?: AutorizacaoAutoridade;

  buscaIniciadaEm?: string;
  escopoBuscaAtual?: EscopoBusca;
  aceitesHospitais: AceiteHospital[];
  escolhaEnfermagem?: EscolhaEnfermagem;
  historicoContatos?: HistoricoContato[];
  statusTransferencia?: StatusTransferencia;

  processoSei?: ProcessoSei;
  numeroSeiProcesso?: string;
  faturasEnviadasCompras: boolean;
  envioFaturas?: EnvioFaturas;
  compra?: CompraLeito;

  judicial?: Judicial;
  compraDireta?: { decretadaPorId: string; decretadaEm: string; justificativa: string };
  cancelamento?: Cancelamento;

  // Campos para dashboard/gestão
  regiaoOrigem?: Macrorregiao;
  regiaoExecutora?: Macrorregiao;
  tipoLeito?: ClinicaMedica;
  taxaAceiteRecusa?: boolean;
  tempoRespostaHoras?: number;
}

// ---------- Auditoria ----------
export interface RegistroAuditoria {
  id: string;
  emAt: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioCpf: string;
  perfil: PerfilId;
  acao: string;
  detalhe?: string;
  solicitacaoId?: string;
  statusAntes?: StatusSolicitacao;
  statusDepois?: StatusSolicitacao;
}

// ---------- Hospitais credenciados ----------
export interface HospitalCredenciado {
  id: string;
  nome: string;
  cnes: string;
  municipio: string;
  macrorregiao: Macrorregiao;
  emailPrincipal: string;
  telefone: string;
  email2?: string;
  email3?: string;
  tipoPrestador: "Privado" | "Filantrópico/contratualizado SUS" | "Outro";
  ativo: boolean;
  distanciaKmBH: number;
  estruturaScore: number;
  clinicasDisponiveis: ClinicaMedica[];
}

export const HOSPITAIS_CREDENCIADOS: HospitalCredenciado[] = [
  {
    id: "h1",
    nome: "Hospital Vera Cruz",
    cnes: "2126796",
    municipio: "Belo Horizonte",
    macrorregiao: "Centro",
    emailPrincipal: "nir.veracruz@example.org",
    telefone: "(31) 3333-1001",
    tipoPrestador: "Privado",
    ativo: true,
    distanciaKmBH: 3,
    estruturaScore: 5,
    clinicasDisponiveis: ["UTI Adulto", "Clínica Médica", "Cirúrgica", "Cardiológica"],
  },
  {
    id: "h2",
    nome: "Hospital Mater Dei",
    cnes: "2126800",
    municipio: "Belo Horizonte",
    macrorregiao: "Centro",
    emailPrincipal: "nir.materdei@example.org",
    telefone: "(31) 3333-1002",
    tipoPrestador: "Privado",
    ativo: true,
    distanciaKmBH: 5,
    estruturaScore: 5,
    clinicasDisponiveis: ["UTI Adulto", "UTI Pediátrica", "Cirúrgica"],
  },
  {
    id: "h3",
    nome: "Hospital Semper",
    cnes: "2126819",
    municipio: "Belo Horizonte",
    macrorregiao: "Centro",
    emailPrincipal: "nir.semper@example.org",
    telefone: "(31) 3333-1003",
    tipoPrestador: "Privado",
    ativo: true,
    distanciaKmBH: 6,
    estruturaScore: 4,
    clinicasDisponiveis: ["UTI Adulto", "Clínica Médica"],
  },
  {
    id: "h4",
    nome: "Hospital Regional do Sul",
    cnes: "2126827",
    municipio: "Varginha",
    macrorregiao: "Sul",
    emailPrincipal: "nir.sul@example.org",
    telefone: "(35) 3333-1004",
    tipoPrestador: "Filantrópico/contratualizado SUS",
    ativo: true,
    distanciaKmBH: 320,
    estruturaScore: 4,
    clinicasDisponiveis: ["UTI Adulto", "Clínica Médica"],
  },
  {
    id: "h5",
    nome: "Hospital Regional Norte",
    cnes: "2126835",
    municipio: "Montes Claros",
    macrorregiao: "Norte",
    emailPrincipal: "nir.norte@example.org",
    telefone: "(38) 3333-1005",
    tipoPrestador: "Filantrópico/contratualizado SUS",
    ativo: true,
    distanciaKmBH: 420,
    estruturaScore: 3,
    clinicasDisponiveis: ["UTI Adulto"],
  },
  {
    id: "h6",
    nome: "Hospital Márcio Cunha",
    cnes: "2126843",
    municipio: "Ipatinga",
    macrorregiao: "Vale do Aço",
    emailPrincipal: "nir.marciocunha@example.org",
    telefone: "(31) 3333-1006",
    tipoPrestador: "Privado",
    ativo: true,
    distanciaKmBH: 210,
    estruturaScore: 5,
    clinicasDisponiveis: ["UTI Adulto", "UTI Neonatal", "Cirúrgica"],
  },
];
