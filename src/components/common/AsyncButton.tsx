import { useState, type MouseEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AsyncButtonProps extends ButtonProps {
  /** Controlled loading state (e.g. when the parent tracks saving per row). */
  loading?: boolean;
  /** Shown on the button while loading. Defaults to children. */
  loadingText?: string;
}

export function AsyncButton({
  loading: loadingProp,
  loadingText,
  disabled,
  onClick,
  children,
  className,
  ...props
}: AsyncButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = loadingProp ?? internalLoading;

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading || !onClick) return;
    const result = onClick(event);
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setInternalLoading(true);
      try {
        await result;
      } finally {
        setInternalLoading(false);
      }
    }
  }

  return (
    <Button
      {...props}
      className={cn(className)}
      disabled={disabled || loading}
      aria-busy={loading}
      onClick={handleClick}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}
