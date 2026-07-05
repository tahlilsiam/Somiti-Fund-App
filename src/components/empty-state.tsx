import { type LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      {Icon ? (
        <span className="bg-muted text-muted-foreground mx-auto mb-3 flex size-10 items-center justify-center rounded-full">
          <Icon className="size-5" />
        </span>
      ) : null}
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
