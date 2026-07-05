import Link from "next/link";

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      {backHref ? (
        <Link
          href={backHref}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </div>
        {children ? (
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
