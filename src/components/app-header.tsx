import { UserCircle2, LogIn } from "lucide-react";
import { useCore } from "@/lib/core-store";
import { PERFIS } from "@/lib/core-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  const { usuarioAtual, usuarios, trocarUsuario } = useCore();
  const perfil = PERFIS.find((p) => p.id === usuarioAtual.perfil)!;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-3 shadow-sm">
      <SidebarTrigger />
      <div className="hidden min-w-0 flex-1 md:block">
        <div className="text-xs text-muted-foreground">
          Central de Operações para Regulação — Governo de Minas Gerais
        </div>
        <div className="truncate text-sm font-semibold">
          Sistema de Compra de Leitos Hospitalares
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-md border bg-muted/50 px-2 py-1 text-xs sm:flex">
          <LogIn className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">Login corporativo</span>
          <span className="text-muted-foreground">(gov.br)</span>
        </div>

        <Select value={usuarioAtual.id} onValueChange={trocarUsuario}>
          <SelectTrigger className="h-9 w-[280px]">
            <div className="flex min-w-0 items-center gap-2">
              <UserCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 text-left">
                <div className="truncate text-xs font-semibold">{usuarioAtual.nome}</div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {perfil.nome} • CPF {usuarioAtual.cpf}
                </div>
              </div>
            </div>
          </SelectTrigger>
          <SelectContent align="end" className="w-[320px]">
            {usuarios.map((u) => {
              const p = PERFIS.find((x) => x.id === u.perfil)!;
              return (
                <SelectItem key={u.id} value={u.id}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{u.nome}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {p.nome} • {u.unidade}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
