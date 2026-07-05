import { cn } from "@/lib/utils";

/** Standard container for tables: bordered, rounded, horizontally scrollable. */
export function DataTableWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border", className)}>
      {children}
    </div>
  );
}
