/**
 * Definições de Tipos e Constantes - CORE Gestão SES/MG
 * Inclui: Perfil ADMINISTRATIVO_CORE, fluxos de desospitalização, contrarreferência e auditoria.
 */

// 1. Perfis de Usuário - Adicionado ADMINISTRATIVO_CORE
export type PerfilId = 
  | "SOLICITANTE" 
  | "REGULADOR" 
  | "AUTORIDADE" 
  | "ENFERMEIRO" 
  | "ADMINISTRATIVO" 
  | "ADMINISTRATIVO_CORE"
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
  { id: "ADMINISTRATIVO_CORE", nome: "Administrativo CORE/MG", descricao: "Gestão operacional e documental" },
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

// 2. Estados e Fluxo Regulatório
export type StatusSolicitacao =
  | "AGUARDANDO_REGULACAO"
  | "AGUARDANDO_VAGA_ZERO"
  | "PARECER_EMITIDO"
  | "TERMO_PENDENTE_HOMOLOGACAO"
  | "AUTORIZADO_AUTORIDADE"
  | "BUSCA_MACRO_REGIONAL"
  | "BUSCA_ESTADUAL_EXPANDIDA"
  | "LEITO_CONFIRMADO_ENFERMAGEM"
  | "PROCESSO_SEI_INICIADO"
  | "LEITO_COMPRADO"
  | "INTERNADO"
  | "PROCESSO_FINANCEIRO_EM_PAGAMENTO"
  | "CANCELADO_ABSORVIDO_SUS"
  | "RECUSADO";

// ... (Mantenha aqui as constantes STATUS_META, TRANSICOES, etc., do seu código original)

// 3. Tipagem das Solicitações com Novos Campos de Governança
export interface Solicitacao {
  id: string;
  protocolo: string;
  solicitanteId: string;
  unidadeOrigem: string;
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
  
  // Campos obrigatórios de governança
  checkTermoEsgotamentoSus: boolean;
  registradoEsgotamentoPorId?: string;

  // Etapas do fluxo
  parecer?: ParecerRegulador;
  autorizacao?: AutorizacaoAutoridade;
  
  // Enfermagem e Navegação (Resolução 11.006)
  buscaIniciadaEm?: string;
  escopoBuscaAtual?: EscopoBusca;
  aceitesHospitais: AceiteHospital[];
  escolhaEnfermagem?: EscolhaEnfermagem;
  historicoContatos?: HistoricoContato[];
  statusTransferencia?: StatusTransferencia;

  // Administrativo / SEI
  processoSei?: ProcessoSei;
  numeroSeiProcesso?: string;
  faturasEnviadasCompras: boolean;
  envioFaturas?: EnvioFaturas;

  // Judicial e Especiais
  judicial?: Judicial;
  compraDireta?: { decretadaPorId: string; decretadaEm: string; justificativa: string };
  cancelamento?: Cancelamento;

  // Campos adicionais para relatórios gerenciais
  regiaoOrigem?: Macrorregiao;
  regiaoExecutora?: Macrorregiao;
  tipoLeito?: ClinicaMedica;
}

// ... (Continue com o restante das definições de interfaces de apoio)
