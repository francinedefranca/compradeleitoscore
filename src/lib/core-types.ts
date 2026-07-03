/**
 * Definições de Tipos e Constantes - CORE Gestão SES/MG
 * Alinhado com as resoluções SES/MG 10.832, 10.834, 11.006 e 11.008.
 */

// 1. Perfis de Usuário
export type PerfilId = "SOLICITANTE" | "REGULADOR" | "AUTORIDADE" | "ENFERMEIRO" | "ADMINISTRATIVO" | "ADMINISTRATIVO_CORE";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  perfil: PerfilId;
  unidade: string;
  senha: string;
}

// 2. Estados e Gatilhos
export type StatusSolicitacao = 
  | "AGUARDANDO_REGULACAO" 
  | "AGUARDANDO_VAGA_ZERO" 
  | "PARECER_EMITIDO" 
  | "AUTORIZADO_AUTORIDADE" 
  | "BUSCA_MACRO_REGIONAL" 
  | "BUSCA_ESTADUAL_EXPANDIDA" 
  | "LEITO_CONFIRMADO_ENFERMAGEM" 
  | "PROCESSO_SEI_INICIADO" 
  | "LEITO_COMPRADO" 
  | "INTERNADO" 
  | "PROCESSO_FINANCEIRO_EM_PAGAMENTO" 
  | "RECUSADO" 
  | "CANCELADO_ABSORVIDO_SUS";

export type GatilhoCompra = "ESGOTAMENTO_CLINICO" | "RISCO_IMINENTE_MORTE" | "ORDEM_JUDICIAL_EXPIRADA";

export const GATILHOS_BYPASS_TRIAGEM: GatilhoCompra[] = ["RISCO_IMINENTE_MORTE", "ORDEM_JUDICIAL_EXPIRADA"];

// 3. Estruturas de Contato e Histórico
export type CanalContato = "TELEFONE" | "EMAIL" | "SISTEMA";
export const CANAL_CONTATO_LABEL: Record<CanalContato, string> = {
  TELEFONE: "Telefone",
  EMAIL: "E-mail",
  SISTEMA: "Sistema Oficial",
};

export type ResultadoContato = "SEM_RESPOSTA" | "ACEITE" | "RECUSA";
export const RESULTADO_CONTATO_LABEL: Record<ResultadoContato, string> = {
  SEM_RESPOSTA: "Sem resposta / Ocupado",
  ACEITE: "Vaga Confirmada",
  RECUSA: "Recusa Hospitalar",
};

export type EscopoBusca = "MICRO_ORIGEM" | "MACRO_ORIGEM" | "ESTADUAL";
export const ESCOPOS_BUSCA: EscopoBusca[] = ["MICRO_ORIGEM", "MACRO_ORIGEM", "ESTADUAL"];
export const ESCOPO_BUSCA_LABEL: Record<EscopoBusca, string> = {
  MICRO_ORIGEM: "Microrregião de Origem",
  MACRO_ORIGEM: "Macrorregião de Origem",
  ESTADUAL: "Estadual",
};

export interface HistoricoContato {
  id: string;
  hospitalNome: string;
  dataHoraContato: string;
  canal: CanalContato;
  resultado: ResultadoContato;
  justificativaRecusa?: string;
  escopoBusca: EscopoBusca;
  registradoPorId: string;
  registradoPorNome: string;
}

// 4. Modelagem da Solicitação Principal
export interface Solicitacao {
  id: string;
  protocolo: string;
  solicitanteId: string;
  unidadeOrigem: string;
  macrorregiaoOrigem: string;
  municipioOrigem: string;
  pacienteNome: string;
  pacienteCpf: string;
  pacienteCns: string;
  pacienteNascimento: string;
  diagnosticoPrincipal: string;
  cid: string;
  gravidade: "VERMELHO" | "LARANJA";
  sinaisVitais: { pa: string; fc: string; fr: string; temp: string; spo2: string; glasgow?: string };
  justificativa: string;
  anexos: { id: string; nome: string; tipo: string; tamanhoKb: number }[];
  gatilhoCompra: GatilhoCompra;
  status: StatusSolicitacao;
  criadoEm: string;
  checkTermoEsgotamentoSus: boolean;
  aceitesHospitais: { hospitalId: string; aceitoEm: string; vagasDisponiveis: number }[];
  faturasEnviadasCompras: boolean;
  registradoEsgotamentoPorId: string;
  parecer?: ParecerRegulador;
  autorizacao?: AutorizacaoAutoridade;
  escolhaEnfermagem?: EscolhaEnfermagem;
  processoSei?: ProcessoSei;
  compra?: CompraLeito;
  cancelamento?: { canceladoPorId: string; canceladoEm: string; justificativa: string };
  compraDireta?: { decretadaPorId: string; decretadaEm: string; justificativa: string };
  escopoBuscaAtual?: EscopoBusca;
  statusTransferencia?: StatusTransferencia;
  historicoContatos?: HistoricoContato[];
  buscaIniciadaEm?: string;
  numeroSeiProcesso?: string;
  envioFaturas?: { administrativoId: string; enviadoEm: string; observacoes: string };
  judicial?: { numeroMandadoJudicial: string; prazoLimiteJudicial: string; vara: string };
}

// 5. Outros Tipos Auxiliares
export interface ParecerRegulador {
  reguladorId: string;
  emitidoEm: string;
  vagaZeroTentada: boolean;
  vagaZeroDetalhe: string;
  parecerTecnico: string;
  clinicaIndicada: string;
  checkTermoEsgotamentoSus: boolean;
}

export interface AutorizacaoAutoridade {
  autoridadeId: string;
  termoNumero: string;
  assinadoEm: string;
  observacoes: string;
}

export interface EscolhaEnfermagem {
  hospitalId: string;
  enfermeiroId: string;
  confirmadoEm: string;
  criterioDesempateUtilizado: string;
}

export interface ProcessoSei {
  administrativoId: string;
  numeroSeiProcesso: string;
  iniciadoEm: string;
  checkLaudoPaciente: boolean;
  checkTermoAcionamento: boolean;
  checkTermoEsgotamentoSus: boolean;
}

export interface CompraLeito {
  compradorId: string;
  hospitalId: string;
  valorDiaria: number;
  empenho: string;
  internacaoEm: string;
  registradoEm: string;
}

export type StatusTransferencia = "AGUARDANDO_TRANSPORTE" | "EM_TRANSITO" | "CHEGADA_DESTINO";
export const STATUS_TRANSFERENCIA_LABEL: Record<StatusTransferencia, string> = {
  AGUARDANDO_TRANSPORTE: "Aguardando Transporte",
  EM_TRANSITO: "Em Trânsito",
  CHEGADA_DESTINO: "Chegada no Destino",
};

export interface RegistroAuditoria {
  id: string;
  solicitacaoId: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioCpf: string;
  perfil: PerfilId;
  acao: string;
  detalhe: string;
  emAt: string;
  statusAntes?: StatusSolicitacao;
  statusDepois: StatusSolicitacao;
}
