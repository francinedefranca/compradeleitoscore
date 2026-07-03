import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  Stethoscope,
  ShieldCheck,
  Briefcase,
  History,
  Building2,
  Activity,
  Search,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useCore } from "@/lib/core-store";
import type { PerfilId } from "@/lib/core-types";

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  perfis: PerfilId[] | "todos";
}

const navGeral: NavItem[] = [
  { title: "Painel Gerencial", url: "/dashboard", icon: LayoutDashboard, perfis: "todos" },
];

const navModulos: NavItem[] = [
  { title: "Minhas Solicitações", url: "/solicitante", icon: FileText, perfis: ["SOLICITANTE"] },
  { title: "Nova Solicitação", url: "/solicitante/nova", icon: Activity, perfis: ["SOLICITANTE"] },
  { title: "Fila de Regulação", url: "/regulador", icon: Stethoscope, perfis: ["REGULADOR"] },
  { title: "Homologação", url: "/autoridade", icon: ShieldCheck, perfis: ["AUTORIDADE"] },
  { title: "Enfermagem Navegadora", url: "/enfermeiro", icon: Search, perfis: ["ENFERMEIRO"] },
  { title: "Administrativo / SEI", url: "/administrativo", icon: Briefcase, perfis: ["ADMINISTRATIVO"] },
];

const navSuporte: NavItem[] = [
  { title: "Prestadores Credenciados", url: "/prestadores", icon: Building2, perfis: "todos" },
  { title: "Log de Auditoria", url: "/auditoria", icon: History, perfis: "todos" },
];

export function AppSidebar() {
  const { usuarioAtual } = useCore();
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (p: string) => currentPath === p;

  const filtrar = (items: NavItem[]) =>
    items.filter((i) => i.perfis === "todos" || i.perfis.includes(usuarioAtual.perfil));

  const renderGroup = (label: string, items: NavItem[]) => {
    const list = filtrar(items);
    if (list.length === 0) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {list.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive(item.url)}>
                  <Link to={item.url} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            MG
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-sidebar-foreground">CORE / MG</div>
            <div className="truncate text-[11px] text-sidebar-foreground/70">
              Compra de Leitos
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Geral", navGeral)}
        {renderGroup("Módulos", navModulos)}
        {renderGroup("Suporte", navSuporte)}
      </SidebarContent>
    </Sidebar>
  );
}
