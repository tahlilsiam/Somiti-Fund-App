import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={className}>
      {title || description || action ? (
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              {title ? <CardTitle>{title}</CardTitle> : null}
              {description ? (
                <CardDescription>{description}</CardDescription>
              ) : null}
            </div>
            {action ? <div>{action}</div> : null}
          </div>
        </CardHeader>
      ) : null}
      <CardContent className={cn(contentClassName)}>{children}</CardContent>
    </Card>
  );
}
