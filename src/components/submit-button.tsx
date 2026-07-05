"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * Submit button that automatically shows a pending state while the enclosing
 * form's action is running. Must be rendered inside a <form>.
 */
export function SubmitButton({
  children,
  pendingText = "Saving…",
  className,
  variant,
  size,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className={className}
      variant={variant}
      size={size}
    >
      {pending ? pendingText : children}
    </Button>
  );
}
