// Tipos e máquina de estados do sistema CORE/MG

export type PerfilId =
  | "SOLICITANTE"
  | "REGULADOR"
  | "AUTORIDADE"
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
  { id: "ADMINISTRATIVO", nome: "Setor de Compras/Contratos", descricao: "Administrativo" },
  { id: "GESTAO", nome: "Gestão SUBASS", descricao: "Painel gerencial" },
];

export interface Usuario {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  perfil: PerfilId;
  unidade: string;
}

export const USUARIOS_MOCK: Usuario[] = [
  { id: "u1", nome: "Dra. Ana Souza", cpf: "111.222.333-44", matricula: "NIR-001", perfil: "SOLICITANTE", unidade: "HPS João XXIII" },
  { id: "u2", nome: "Dr. Bruno Lima", cpf: "222.333.444-55", matricula: "REG-014", perfil: "REGULADOR", unidade: "CORE/MG" },
  { id: "u3", nome: "Dra. Carla Dias", cpf: "333.444.555-66", matricula: "REG-021", perfil: "REGULADOR", unidade: "CORE/MG" },
  { id: "u4", nome: "Dr. Diego Alves", cpf: "444.555.666-77", matricula: "AUT-003", perfil: "AUTORIDADE", unidade: "Coordenação CORE" },
  { id: "u5", nome: "Dra. Eliana Reis", cpf: "555.666.777-88", matricula: "AUT-005", perfil: "AUTORIDADE", unidade: "Coordenação CORE" },
  { id: "u6", nome: "Fernanda Costa", cpf: "666.777.888-99", matricula: "ADM-102", perfil: "ADMINISTRATIVO", unidade: "Setor de Compras" },
  { id: "u7", nome: "Gestor SUBASS", cpf: "777.888.999-00", matricula: "GES-001", perfil: "GESTAO", unidade: "SUBASS" },
];

// Máquina de estados
export type StatusSolicitacao =
  | "AGUARDANDO_REGULACAO"
  | "AGUARDANDO_VAGA_ZERO"
  | "PARECER_EMITIDO"
  | "AUTORIZADO_AUTORIDADE"
  | "LEITO_COMPRADO"
  | "INTERNADO"
  | "RECUSADO";

export const STATUS_META: Record<
  StatusSolicitacao,
  { label: string; tone: "info" | "warning" | "success" | "destructive" | "muted" }
> = {
  AGUARDANDO_REGULACAO: { label: "Aguardando Regulação", tone: "info" },
  AGUARDANDO_VAGA_ZERO: { label: "Aguardando Vaga Zero", tone: "warning" },
  PARECER_EMITIDO: { label: "Parecer Emitido", tone: "info" },
  AUTORIZADO_AUTORIDADE: { label: "Autorizado pela Autoridade Sanitária", tone: "success" },
  LEITO_COMPRADO: { label: "Leito Comprado", tone: "success" },
  INTERNADO: { label: "Paciente Internado", tone: "success" },
  RECUSADO: { label: "Recusado", tone: "destructive" },
};

// Transições permitidas por perfil (bloqueia edição retroativa)
export const TRANSICOES: Record<
  StatusSolicitacao,
  { proximo: StatusSolicitacao; perfil: PerfilId; rotulo: string }[]
> = {
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
  AUTORIZADO_AUTORIDADE: [
    { proximo: "LEITO_COMPRADO", perfil: "ADMINISTRATIVO", rotulo: "Registrar compra do leito" },
  ],
  LEITO_COMPRADO: [
    { proximo: "INTERNADO", perfil: "ADMINISTRATIVO", rotulo: "Confirmar internação efetiva" },
  ],
  INTERNADO: [],
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
}

export const HOSPITAIS_CREDENCIADOS: HospitalCredenciado[] = [
  { id: "h1", nome: "Hospital Vera Cruz", cnes: "2126234", macrorregiao: "Centro", municipio: "Belo Horizonte" },
  { id: "h2", nome: "Hospital Mater Dei", cnes: "2170438", macrorregiao: "Centro", municipio: "Belo Horizonte" },
  { id: "h3", nome: "Hospital Santa Rosália", cnes: "2148254", macrorregiao: "Triângulo", municipio: "Uberaba" },
  { id: "h4", nome: "Hospital Márcio Cunha", cnes: "2140474", macrorregiao: "Vale do Aço", municipio: "Ipatinga" },
  { id: "h5", nome: "Hospital do Coração", cnes: "2145727", macrorregiao: "Sul", municipio: "Poços de Caldas" },
  { id: "h6", nome: "Hospital Norte Mineiro", cnes: "2145123", macrorregiao: "Norte", municipio: "Montes Claros" },
];

export interface SinaisVitais {
  pa: string; // Pressão arterial
  fc: string; // Frequência cardíaca
  fr: string; // Frequência respiratória
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

export interface ParecerRegulador {
  reguladorId: string;
  vagaZeroTentada: boolean;
  vagaZeroDetalhe: string;
  parecerTecnico: string;
  clinicaIndicada: ClinicaMedica;
  emitidoEm: string;
}

export interface AutorizacaoAutoridade {
  autoridadeId: string;
  termoNumero: string;
  observacoes: string;
  assinadoEm: string;
}

export interface CompraLeito {
  compradorId: string;
  hospitalId: string;
  valorDiaria: number;
  empenho: string;
  internacaoEm: string;
  registradoEm: string;
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

  // Fluxo
  status: StatusSolicitacao;
  criadoEm: string;
  parecer?: ParecerRegulador;
  autorizacao?: AutorizacaoAutoridade;
  compra?: CompraLeito;
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
