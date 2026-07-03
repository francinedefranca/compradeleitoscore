// Tipos e máquina de estados do sistema CORE/MG

export type PerfilId =
  | "SOLICITANTE"
  | "REGULADOR"
  | "AUTORIDADE"
  | "ENFERMEIRO"
  | "ADMINISTRATIVO"
  | "GESTAO";

export interface Perfil {
  id: PerfilId;
  nome: string;
  descricao: string;
}

export const PERFIS: Perfil[] = [
  { id: "SOLICITANTE", nome: "NIR / Médico Assistente", descricao: "Solicitante de origem" },
  { id: "REGULADOR", nome: "Médico Regulador", descricao: "CORE/MG" },
  { id: "AUTORIDADE", nome: "Autoridade Sanitária", descricao: "Coordenador CORE" },
  { id: "ENFERMEIRO", nome: "Enfermeiro Navegador", descricao: "Busca ativa de leito credenciado" },
  { id: "ADMINISTRATIVO", nome: "Setor de Compras/Contratos", descricao: "SEI, faturas e liquidação" },
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
  senha: string; // simulado
}

export const USUARIOS_MOCK: Usuario[] = [
  { id: "u1", nome: "Dra. Ana Souza", cpf: "111.222.333-44", matricula: "NIR-001", perfil: "SOLICITANTE", unidade: "HPS João XXIII", email: "ana.souza@saude.mg.gov.br", senha: "core2026" },
  { id: "u2", nome: "Dr. Bruno Lima", cpf: "222.333.444-55", matricula: "REG-014", perfil: "REGULADOR", unidade: "CORE/MG", email: "bruno.lima@saude.mg.gov.br", senha: "core2026" },
  { id: "u3", nome: "Dra. Carla Dias", cpf: "333.444.555-66", matricula: "REG-021", perfil: "REGULADOR", unidade: "CORE/MG", email: "carla.dias@saude.mg.gov.br", senha: "core2026" },
  { id: "u4", nome: "Dr. Diego Alves", cpf: "444.555.666-77", matricula: "AUT-003", perfil: "AUTORIDADE", unidade: "Coordenação CORE", email: "diego.alves@saude.mg.gov.br", senha: "core2026" },
  { id: "u5", nome: "Dra. Eliana Reis", cpf: "555.666.777-88", matricula: "AUT-005", perfil: "AUTORIDADE", unidade: "Coordenação CORE", email: "eliana.reis@saude.mg.gov.br", senha: "core2026" },
  { id: "u6", nome: "Fernanda Costa", cpf: "666.777.888-99", matricula: "ADM-102", perfil: "ADMINISTRATIVO", unidade: "Setor de Compras", email: "fernanda.costa@saude.mg.gov.br", senha: "core2026" },
  { id: "u7", nome: "Gestor SUBASS", cpf: "777.888.999-00", matricula: "GES-001", perfil: "GESTAO", unidade: "SUBASS", email: "gestor.subass@saude.mg.gov.br", senha: "core2026" },
  { id: "u8", nome: "Enf. Helena Prado", cpf: "888.999.000-11", matricula: "ENF-045", perfil: "ENFERMEIRO", unidade: "Núcleo de Navegação CORE", email: "helena.prado@saude.mg.gov.br", senha: "core2026" },
];

// Máquina de estados
export type StatusSolicitacao =
  | "SOLICITACAO_POR_ESGOTAMENTO_SUS" // == AGUARDANDO_REGULACAO
  | "AGUARDANDO_REGULACAO"
  | "AGUARDANDO_VAGA_ZERO"
  | "PARECER_EMITIDO" // TERMO_PENDENTE_HOMOLOGACAO
  | "TERMO_PENDENTE_HOMOLOGACAO"
  | "AUTORIZADO_AUTORIDADE" // COMPRA_AUTORIZADA
  | "COMPRA_AUTORIZADA"
  | "BUSCA_MACRO_REGIONAL"
  | "BUSCA_ESTADUAL_EXPANDIDA"
  | "LEITO_CONFIRMADO_ENFERMAGEM"
  | "PROCESSO_SEI_INICIADO"
  | "LEITO_COMPRADO"
  | "INTERNADO"
  | "PROCESSO_FINANCEIRO_EM_PAGAMENTO"
  | "CANCELADO_ABSORVIDO_SUS"
  | "RECUSADO";

export const STATUS_META: Record<
  StatusSolicitacao,
  { label: string; tone: "info" | "warning" | "success" | "destructive" | "muted" }
> = {
  SOLICITACAO_POR_ESGOTAMENTO_SUS: { label: "Solicitação por Esgotamento SUS", tone: "info" },
  AGUARDANDO_REGULACAO: { label: "Aguardando Regulação", tone: "info" },
  AGUARDANDO_VAGA_ZERO: { label: "Aguardando Vaga Zero", tone: "warning" },
  PARECER_EMITIDO: { label: "Parecer Emitido", tone: "info" },
  TERMO_PENDENTE_HOMOLOGACAO: { label: "Termo Pendente de Homologação", tone: "warning" },
  AUTORIZADO_AUTORIDADE: { label: "Autorizado pela Autoridade Sanitária", tone: "success" },
  COMPRA_AUTORIZADA: { label: "Compra Autorizada", tone: "success" },
  BUSCA_MACRO_REGIONAL: { label: "Busca — Macrorregião", tone: "info" },
  BUSCA_ESTADUAL_EXPANDIDA: { label: "Busca Estadual Expandida", tone: "warning" },
  LEITO_CONFIRMADO_ENFERMAGEM: { label: "Leito Confirmado (Enfermagem)", tone: "success" },
  PROCESSO_SEI_INICIADO: { label: "Processo SEI Iniciado", tone: "info" },
  LEITO_COMPRADO: { label: "Leito Comprado", tone: "success" },
  INTERNADO: { label: "Paciente Internado", tone: "success" },
  PROCESSO_FINANCEIRO_EM_PAGAMENTO: { label: "Processo Financeiro em Pagamento", tone: "success" },
  CANCELADO_ABSORVIDO_SUS: { label: "Cancelado — Absorvido pelo SUS", tone: "muted" },
  RECUSADO: { label: "Recusado", tone: "destructive" },
};

// Transições permitidas por perfil (bloqueia edição retroativa).
// Cancelamento por absorção SUS é tratado à parte no store.
export const TRANSICOES: Record<
  StatusSolicitacao,
  { proximo: StatusSolicitacao; perfil: PerfilId; rotulo: string }[]
> = {
  SOLICITACAO_POR_ESGOTAMENTO_SUS: [],
  AGUARDANDO_REGULACAO: [
    { proximo: "AGUARDANDO_VAGA_ZERO", perfil: "REGULADOR", rotulo: "Registrar tentativa de Vaga Zero" },
    { proximo: "RECUSADO", perfil: "REGULADOR", rotulo: "Recusar solicitação" },
  ],
  AGUARDANDO_VAGA_ZERO: [
    { proximo: "PARECER_EMITIDO", perfil: "REGULADOR", rotulo: "Emitir parecer técnico" },
    { proximo: "RECUSADO", perfil: "REGULADOR", rotulo: "Recusar solicitação" },
  ],
  PARECER_EMITIDO: [
    { proximo: "AUTORIZADO_AUTORIDADE", perfil: "AUTORIDADE", rotulo: "Autorizar compra extraordinária" },
    { proximo: "RECUSADO", perfil: "AUTORIDADE", rotulo: "Negar autorização" },
  ],
  TERMO_PENDENTE_HOMOLOGACAO: [
    { proximo: "AUTORIZADO_AUTORIDADE", perfil: "AUTORIDADE", rotulo: "Homologar termo" },
  ],
  AUTORIZADO_AUTORIDADE: [
    { proximo: "BUSCA_MACRO_REGIONAL", perfil: "ENFERMEIRO", rotulo: "Iniciar busca macrorregional" },
  ],
  COMPRA_AUTORIZADA: [
    { proximo: "BUSCA_MACRO_REGIONAL", perfil: "ENFERMEIRO", rotulo: "Iniciar busca macrorregional" },
  ],
  BUSCA_MACRO_REGIONAL: [
    { proximo: "BUSCA_ESTADUAL_EXPANDIDA", perfil: "ENFERMEIRO", rotulo: "Expandir busca ao nível estadual" },
    { proximo: "LEITO_CONFIRMADO_ENFERMAGEM", perfil: "ENFERMEIRO", rotulo: "Confirmar leito escolhido" },
  ],
  BUSCA_ESTADUAL_EXPANDIDA: [
    { proximo: "LEITO_CONFIRMADO_ENFERMAGEM", perfil: "ENFERMEIRO", rotulo: "Confirmar leito escolhido" },
  ],
  LEITO_CONFIRMADO_ENFERMAGEM: [
    { proximo: "PROCESSO_SEI_INICIADO", perfil: "ADMINISTRATIVO", rotulo: "Abrir processo SEI" },
  ],
  PROCESSO_SEI_INICIADO: [
    { proximo: "LEITO_COMPRADO", perfil: "ADMINISTRATIVO", rotulo: "Registrar empenho/compra" },
  ],
  LEITO_COMPRADO: [
    { proximo: "INTERNADO", perfil: "ADMINISTRATIVO", rotulo: "Confirmar internação efetiva" },
  ],
  INTERNADO: [
    { proximo: "PROCESSO_FINANCEIRO_EM_PAGAMENTO", perfil: "ADMINISTRATIVO", rotulo: "Encaminhar faturas ao setor de compras" },
  ],
  PROCESSO_FINANCEIRO_EM_PAGAMENTO: [],
  CANCELADO_ABSORVIDO_SUS: [],
  RECUSADO: [],
};

export type Gravidade = "VERMELHO" | "LARANJA" | "AMARELO" | "VERDE";

export const GRAVIDADE_META: Record<Gravidade, { label: string; peso: number; classe: string }> = {
  VERMELHO: { label: "Emergência", peso: 4, classe: "bg-destructive text-destructive-foreground" },
  LARANJA: { label: "Muito Urgente", peso: 3, classe: "bg-warning text-warning-foreground" },
  AMARELO: { label: "Urgente", peso: 2, classe: "bg-yellow-200 text-yellow-900" },
  VERDE: { label: "Pouco Urgente", peso: 1, classe: "bg-success text-success-foreground" },
};

export type Macrorregiao =
  | "Centro"
  | "Norte"
  | "Sul"
  | "Leste"
  | "Oeste"
  | "Vale do Aço"
  | "Triângulo"
  | "Nordeste"
  | "Noroeste"
  | "Jequitinhonha";

export const MACRORREGIOES: Macrorregiao[] = [
  "Centro", "Norte", "Sul", "Leste", "Oeste",
  "Vale do Aço", "Triângulo", "Nordeste", "Noroeste", "Jequitinhonha",
];

export type ClinicaMedica =
  | "UTI Adulto"
  | "UTI Pediátrica"
  | "UTI Neonatal"
  | "Enfermaria Adulto"
  | "Enfermaria Pediátrica"
  | "Cardiologia"
  | "Neurologia"
  | "Trauma";

export const CLINICAS: ClinicaMedica[] = [
  "UTI Adulto", "UTI Pediátrica", "UTI Neonatal",
  "Enfermaria Adulto", "Enfermaria Pediátrica",
  "Cardiologia", "Neurologia", "Trauma",
];

export interface HospitalCredenciado {
  id: string;
  nome: string;
  cnes: string;
  macrorregiao: Macrorregiao;
  municipio: string;
  distanciaKmBH: number; // proxy simples para "menor distância"
  estruturaScore: 1 | 2 | 3 | 4 | 5; // proxy para "melhor estrutura"
  clinicasDisponiveis: ClinicaMedica[];
  contatoEmail: string;
}

export const HOSPITAIS_CREDENCIADOS: HospitalCredenciado[] = [
  { id: "h1", nome: "Hospital Vera Cruz", cnes: "2126234", macrorregiao: "Centro", municipio: "Belo Horizonte", distanciaKmBH: 3, estruturaScore: 5, clinicasDisponiveis: ["UTI Adulto", "Cardiologia", "Neurologia"], contatoEmail: "regulacao@veracruz.mg" },
  { id: "h2", nome: "Hospital Mater Dei", cnes: "2170438", macrorregiao: "Centro", municipio: "Belo Horizonte", distanciaKmBH: 5, estruturaScore: 5, clinicasDisponiveis: ["UTI Adulto", "UTI Pediátrica", "UTI Neonatal", "Trauma"], contatoEmail: "regulacao@materdei.mg" },
  { id: "h3", nome: "Hospital Santa Rosália", cnes: "2148254", macrorregiao: "Triângulo", municipio: "Uberaba", distanciaKmBH: 490, estruturaScore: 4, clinicasDisponiveis: ["UTI Adulto", "UTI Pediátrica", "Cardiologia"], contatoEmail: "regulacao@santarosalia.mg" },
  { id: "h4", nome: "Hospital Márcio Cunha", cnes: "2140474", macrorregiao: "Vale do Aço", municipio: "Ipatinga", distanciaKmBH: 210, estruturaScore: 4, clinicasDisponiveis: ["UTI Adulto", "Trauma", "Cardiologia"], contatoEmail: "regulacao@marciocunha.mg" },
  { id: "h5", nome: "Hospital do Coração", cnes: "2145727", macrorregiao: "Sul", municipio: "Poços de Caldas", distanciaKmBH: 460, estruturaScore: 3, clinicasDisponiveis: ["UTI Adulto", "Cardiologia"], contatoEmail: "regulacao@hcoracao.mg" },
  { id: "h6", nome: "Hospital Norte Mineiro", cnes: "2145123", macrorregiao: "Norte", municipio: "Montes Claros", distanciaKmBH: 420, estruturaScore: 3, clinicasDisponiveis: ["UTI Adulto", "UTI Pediátrica"], contatoEmail: "regulacao@nortemineiro.mg" },
];

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
  // Novos rótulos oficiais da governança CORE/MG
  | "ESGOTAMENTO_LEITO_SUS"
  | "DETERMINACAO_JUDICIAL"
  | "RISCO_IMINENTE_MORTE"
  // Rótulos legados mantidos para compatibilidade com dados/telas existentes
  | "ESGOTAMENTO_CLINICO"
  | "ORDEM_JUDICIAL_EXPIRADA";

export const GATILHO_LABEL: Record<GatilhoCompra, string> = {
  ESGOTAMENTO_LEITO_SUS: "Esgotamento de Leito SUS",
  DETERMINACAO_JUDICIAL: "Determinação Judicial",
  RISCO_IMINENTE_MORTE: "Risco Iminente de Morte",
  ESGOTAMENTO_CLINICO: "Esgotamento Clínico (legado)",
  ORDEM_JUDICIAL_EXPIRADA: "Ordem Judicial Expirada (legado)",
};

// Governança: gatilhos que permitem bypass de triagem/segregação
export const GATILHOS_BYPASS_TRIAGEM: GatilhoCompra[] = [
  "DETERMINACAO_JUDICIAL",
  "ORDEM_JUDICIAL_EXPIRADA",
  "RISCO_IMINENTE_MORTE",
];

export type CriterioDesempate =
  | "MENOR_DISTANCIA"
  | "MELHOR_ESTRUTURA"
  | "TIPO_LEITO_ADEQUADO";

export const CRITERIO_DESEMPATE_LABEL: Record<CriterioDesempate, string> = {
  MENOR_DISTANCIA: "Menor Distância",
  MELHOR_ESTRUTURA: "Melhor Estrutura",
  TIPO_LEITO_ADEQUADO: "Tipo de Leito Adequado",
};

// Escopo estratificado da busca ativa (substitui o antigo "Em Busca").
export type EscopoBusca = "MACRO_ORIGEM" | "MACRO_PROXIMA" | "ESTADUAL";
export const ESCOPO_BUSCA_LABEL: Record<EscopoBusca, string> = {
  MACRO_ORIGEM: "Macro-Origem",
  MACRO_PROXIMA: "Macro-Próxima",
  ESTADUAL: "Estadual",
};
export const ESCOPOS_BUSCA: EscopoBusca[] = ["MACRO_ORIGEM", "MACRO_PROXIMA", "ESTADUAL"];

// Etapas de transferência do paciente pós-confirmação de leito.
export type StatusTransferencia =
  | "AGUARDANDO_TRANSPORTE"
  | "EM_TRANSITO"
  | "ADMITIDO_DESTINO";
export const STATUS_TRANSFERENCIA_LABEL: Record<StatusTransferencia, string> = {
  AGUARDANDO_TRANSPORTE: "Aguardando Transporte",
  EM_TRANSITO: "Em Trânsito",
  ADMITIDO_DESTINO: "Admitido no Destino",
};
export const STATUS_TRANSFERENCIA_ORDEM: StatusTransferencia[] = [
  "AGUARDANDO_TRANSPORTE",
  "EM_TRANSITO",
  "ADMITIDO_DESTINO",
];

// Histórico de tentativas manuais de contato com hospitais (Apoio Adm. Centralizado).
export type CanalContato = "EMAIL" | "TELEFONE";
export type ResultadoContato = "ACEITE" | "RECUSA" | "SEM_RESPOSTA";
export const CANAL_CONTATO_LABEL: Record<CanalContato, string> = {
  EMAIL: "E-mail",
  TELEFONE: "Telefone",
};
export const RESULTADO_CONTATO_LABEL: Record<ResultadoContato, string> = {
  ACEITE: "Aceite",
  RECUSA: "Recusa",
  SEM_RESPOSTA: "Sem Resposta",
};

export interface HistoricoContato {
  id: string;
  hospitalId?: string; // pode ser vazio: hospitais sem login também são registrados
  hospitalNome: string;
  dataHoraContato: string; // ISO
  canal: CanalContato;
  resultado: ResultadoContato;
  justificativaRecusa?: string;
  escopoBusca: EscopoBusca;
  registradoPorId: string;
  registradoPorNome: string;
}

export interface ParecerRegulador {
  reguladorId: string;
  vagaZeroTentada: boolean;
  vagaZeroDetalhe: string;
  parecerTecnico: string;
  clinicaIndicada: ClinicaMedica;
  emitidoEm: string;
  checkTermoEsgotamentoSus: boolean;
}

export interface AutorizacaoAutoridade {
  autoridadeId: string;
  termoNumero: string;
  observacoes: string;
  assinadoEm: string;
}

export interface AceiteHospital {
  hospitalId: string;
  aceitoEm: string;
  vagasDisponiveis: number;
}

export interface EscolhaEnfermagem {
  enfermeiroId: string;
  hospitalId: string;
  criterioDesempateUtilizado: CriterioDesempate;
  justificativa: string;
  confirmadoEm: string;
  escopoBusca: "MACRO" | "ESTADUAL";
}

export interface ProcessoSei {
  administrativoId: string;
  numeroSeiProcesso: string;
  checkLaudoPaciente: boolean;
  checkTermoAcionamento: boolean;
  checkTermoEsgotamentoSus: boolean;
  iniciadoEm: string;
}

export interface CompraLeito {
  compradorId: string;
  hospitalId: string;
  valorDiaria: number;
  empenho: string;
  internacaoEm: string;
  registradoEm: string;
}

export interface EnvioFaturas {
  administrativoId: string;
  enviadoEm: string;
  observacoes: string;
}

export interface Judicial {
  numeroMandadoJudicial: string;
  prazoLimiteJudicial: string; // ISO
  vara: string;
}

export interface Cancelamento {
  canceladoPorId: string;
  canceladoEm: string;
  justificativa: string;
}

export interface Solicitacao {
  id: string;
  protocolo: string;

  // Origem
  solicitanteId: string;
  unidadeOrigem: string;
  macrorregiaoOrigem: Macrorregiao;
  municipioOrigem: string;

  // Paciente
  pacienteNome: string;
  pacienteCpf: string;
  pacienteCns: string;
  pacienteNascimento: string;

  // Clínico
  diagnosticoPrincipal: string;
  cid: string;
  gravidade: Gravidade;
  sinaisVitais: SinaisVitais;
  justificativa: string;
  anexos: Anexo[];

  // Gatilho
  gatilhoCompra: GatilhoCompra;
  judicial?: Judicial;

  // Fluxo
  status: StatusSolicitacao;
  criadoEm: string;

  // Marcadores obrigatórios
  checkTermoEsgotamentoSus: boolean;

  // Etapas
  parecer?: ParecerRegulador;
  autorizacao?: AutorizacaoAutoridade;

  // Enfermagem
  buscaIniciadaEm?: string;
  aceitesHospitais: AceiteHospital[];
  escolhaEnfermagem?: EscolhaEnfermagem;

  // Administrativo / SEI
  processoSei?: ProcessoSei;
  numeroSeiProcesso?: string;

  // Compra / Faturamento
  compra?: CompraLeito;
  faturasEnviadasCompras: boolean;
  envioFaturas?: EnvioFaturas;

  // Cancelamento
  cancelamento?: Cancelamento;

  // Multi-perfil segregation ledger — quem registrou o "esgotamento SUS" na fase 1
  registradoEsgotamentoPorId?: string;

  // Governança CORE/MG — controles adicionais
  /** Justificativa clínica/logística de transporte inter-hospitalar. */
  justificativaTransporte?: string;
  /** Checklist SEI consolidado (espelho dos flags de processoSei p/ relatórios). */
  checklistSei?: {
    laudo: boolean;
    termoAcionamento: boolean;
    termoEsgotamentoSus: boolean;
  };

  // Indicadores de gestão
  /** Tempo total de resposta (solicitação → internação), em horas. */
  tempoRespostaHoras?: number;
  /** Macrorregião de origem do paciente (espelho de macrorregiaoOrigem). */
  regiaoOrigem?: Macrorregiao;
  /** Macrorregião do hospital executor (destino da compra). */
  regiaoExecutora?: Macrorregiao;
  /** true = aceite; false = recusa registrada pela ponta hospitalar. */
  taxaAceiteRecusa?: boolean;
  /** Tipo de leito efetivamente contratado. */
  tipoLeito?: ClinicaMedica;

  // Compra direta (decreto de Autoridade Sanitária em RISCO_IMINENTE_MORTE)
  compraDireta?: {
    decretadaPorId: string;
    decretadaEm: string;
    justificativa: string;
  };
}


export interface RegistroAuditoria {
  id: string;
  solicitacaoId: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioCpf: string;
  perfil: PerfilId;
  acao: string;
  detalhe?: string;
  emAt: string;
  statusAntes?: StatusSolicitacao;
  statusDepois?: StatusSolicitacao;
}
