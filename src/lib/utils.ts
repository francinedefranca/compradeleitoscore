import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Solicitacao } from "./core-types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calcula o tempo de resposta (em horas) entre a abertura da solicitação
 * e o primeiro aceite registrado por um prestador.
 * - Retorna null quando ainda não há aceite (dado "sujo" fica de fora do dashboard).
 * - Arredonda para 2 casas decimais.
 */
export function calcularTempoRespostaHoras(s: Solicitacao): number | null {
  if (!s.criadoEm || !s.aceitesHospitais?.length) return null;
  const inicio = new Date(s.criadoEm).getTime();
  const primeiroAceite = s.aceitesHospitais
    .map((a) => new Date(a.aceitoEm).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b)[0];
  if (!primeiroAceite || primeiroAceite < inicio) return null;
  const horas = (primeiroAceite - inicio) / 3600_000;
  return Math.round(horas * 100) / 100;
}

/** Aplica calcularTempoRespostaHoras e devolve a solicitação enriquecida. */
export function enriquecerSolicitacao(s: Solicitacao): Solicitacao {
  const tempo = calcularTempoRespostaHoras(s);
  return {
    ...s,
    tempoRespostaHoras: tempo ?? s.tempoRespostaHoras,
    regiaoOrigem: s.regiaoOrigem ?? s.macrorregiaoOrigem,
    tipoLeito: s.tipoLeito ?? s.parecer?.clinicaIndicada,
    taxaAceiteRecusa:
      s.taxaAceiteRecusa ?? (s.aceitesHospitais.length > 0 ? true : undefined),
  };
}

/** Retorna o início da semana (segunda-feira 00:00 UTC-local) de uma data. */
export function inicioDaSemana(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dia = x.getDay(); // 0=dom
  const diff = (dia + 6) % 7; // segunda como início
  x.setDate(x.getDate() - diff);
  return x;
}

/** Formata "YYYY-Www" a partir de uma data ISO. */
export function chaveSemana(iso: string): string {
  const d = new Date(iso);
  const inicio = inicioDaSemana(d);
  const jan1 = new Date(inicio.getFullYear(), 0, 1);
  const semana = Math.ceil(
    ((inicio.getTime() - jan1.getTime()) / 86400_000 + jan1.getDay() + 1) / 7,
  );
  return `${inicio.getFullYear()}-W${String(semana).padStart(2, "0")}`;
}
export const calcularEscopoSugerido = (dataSolicitacao: Date): 'Macro-Origem' | 'Macro-Próxima' | 'Estadual' => {
  const agora = new Date();
  const diferencaHoras = (agora.getTime() - dataSolicitacao.getTime()) / (1000 * 60 * 60);

  if (diferencaHoras >= 24) return 'Estadual';
  if (diferencaHoras >= 3) return 'Macro-Próxima';
  return 'Macro-Origem';
};
