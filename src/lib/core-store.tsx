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
  type EscopoBusca,
  type StatusTransferencia,
  type HistoricoContato,
  type ClinicaMedica,
  type Gravidade,
  GATILHOS_BYPASS_TRIAGEM,
} from "./core-types";

// (Manter aqui a lógica de datas SEED_NOW, nowIso, hoursAgo, daysAgo)
const SEED_NOW = "2026-07-03T14:00:00.000Z";
const nowIso = () => new Date().toISOString();
const isoOffsetMs = (from: string, ms: number) => new Date(new Date(from).getTime() - ms).toISOString();
const hoursAgo = (h: number) => isoOffsetMs(SEED_NOW, h * 3600_000);
const daysAgo = (d: number) => isoOffsetMs(SEED_NOW, d * 86400_000);

// Certifique-se de que cada objeto em seedSolicitacoes inclua os novos campos:
// escopoBuscaAtual: "MACRO_ORIGEM", 
// statusTransferencia: "AGUARDANDO_TRANSPORTE", 
// historicoContatos: []

// ... (Substitua a sua lista seedSolicitacoes garantindo esses 3 campos em todos os itens)

// Na função CoreProvider, atualize o estado para lidar com o novo perfil:
export function CoreProvider({ children }: { children: ReactNode }) {
  const [usuarioAtualId, setUsuarioAtualId] = useState("u1");
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>(seedSolicitacoes);
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>([]);

  const usuarioAtual = useMemo(
    () => USUARIOS_MOCK.find((u) => u.id === usuarioAtualId) || USUARIOS_MOCK[0],
    [usuarioAtualId],
  );

  // Mantenha a lógica do logAudit e validarTransicao...

  // IMPORTANTE: Ajuste a validação para aceitar o novo perfil
  const validarTransicao = useCallback(
    (atual: StatusSolicitacao, proximo: StatusSolicitacao, perfil: PerfilId) => {
      // Se o perfil for ADMINISTRATIVO_CORE, ele deve ter acesso total às operações administrativas
      if (perfil === "ADMINISTRATIVO_CORE") return; 
      
      const permitidas = TRANSICOES[atual] ?? [];
      const t = permitidas.find((p) => p.proximo === proximo && p.perfil === perfil);
      if (!t) {
        throw new Error(`Transição ${atual} -> ${proximo} negada para ${perfil}.`);
      }
    },
    [],
  );

  // ... (Manter o restante da lógica de funções useCallback inalterada)
}
