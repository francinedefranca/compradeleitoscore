import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useCore } from "@/lib/core-store";
import { PERFIS, type PerfilId } from "@/lib/core-types";

export function PerfilGate({
  permitido,
  children,
}: {
  permitido: PerfilId[];
  children: ReactNode;
}) {
  const { usuarioAtual } = useCore();
  if (permitido.includes(usuarioAtual.perfil)) return <>{children}</>;

  const nomes = permitido.map((p) => PERFIS.find((x) => x.id === p)!.nome).join(", ");
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-lg border bg-card p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-warning/20 text-warning-foreground">
        <Lock className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Acesso restrito</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Este módulo é exclusivo para: <strong>{nomes}</strong>.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Troque de perfil no canto superior direito para simular outro usuário.
      </p>
    </div>
  );
}
