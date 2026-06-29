import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavingIndicatorProps {
  active: boolean;
  message?: string;
  className?: string;
}

/** Inline banner for async saves (checklist toggles, etc.). */
export function SavingIndicator({
  active,
  message = "Please hold on while we save your changes…",
  className,
}: SavingIndicatorProps) {
  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
