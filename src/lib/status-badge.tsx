import { STATUS_META, type StatusSolicitacao } from "./core-types";
import { cn } from "./utils";

const toneClasses: Record<string, string> = {
  info: "bg-info/15 text-info border-info/30",
  warning: "bg-warning/20 text-warning-foreground border-warning/40",
  success: "bg-success/15 text-success border-success/30",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: StatusSolicitacao; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[meta.tone],
        className,
      )}
    >
      <span className={cn("status-dot", {
        "bg-info": meta.tone === "info",
        "bg-warning": meta.tone === "warning",
        "bg-success": meta.tone === "success",
        "bg-destructive": meta.tone === "destructive",
        "bg-muted-foreground": meta.tone === "muted",
      })} />
      {meta.label}
    </span>
  );
}
