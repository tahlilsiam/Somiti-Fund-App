import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "success"
  | "danger"
  | "info"
  | "warning"
  | "neutral";

const toneClasses: Record<Exclude<BadgeTone, "neutral">, string> = {
  success:
    "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  danger:
    "border-transparent bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  info: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  warning:
    "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

export function StatusBadge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  if (tone === "neutral") {
    return (
      <Badge variant="secondary" className={cn("text-muted-foreground", className)}>
        {children}
      </Badge>
    );
  }
  return <Badge className={cn(toneClasses[tone], className)}>{children}</Badge>;
}
