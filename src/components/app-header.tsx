import { useState } from "react";
import { UserCircle2, LogIn, KeyRound } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AppHeader() {
  const { usuarioAtual, usuarios, trocarUsuario, loginPorEmail } = useCore();
  const perfil = PERFIS.find((p) => p.id === usuarioAtual.perfil)!;
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const doLogin = () => {
    const r = loginPorEmail(email, senha);
    if (r.ok) {
      toast.success("Login realizado.");
      setLoginOpen(false);
      setEmail("");
      setSenha("");
    } else {
      toast.error(r.erro);
    }
  };

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
        <Button
          variant="outline"
          size="sm"
          className="hidden h-9 sm:inline-flex"
          onClick={() => setLoginOpen(true)}
        >
          <KeyRound className="h-3.5 w-3.5" /> Login por e-mail
        </Button>

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

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-4 w-4" /> Login corporativo (simulado)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">E-mail institucional</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@saude.mg.gov.br"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Senha</Label>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="core2026"
              />
            </div>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Credenciais de teste</summary>
              <ul className="mt-2 space-y-0.5 font-mono">
                {usuarios.map((u) => (
                  <li key={u.id}>
                    {u.email} / {u.senha} — {PERFIS.find((p) => p.id === u.perfil)!.nome}
                  </li>
                ))}
              </ul>
            </details>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={doLogin}>Entrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
