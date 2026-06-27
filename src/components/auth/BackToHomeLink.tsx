import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackToHomeLinkProps {
  className?: string;
}

export function BackToHomeLink({ className }: BackToHomeLinkProps) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
    >
      <ArrowLeft className="w-4 h-4" />
      Back to home
    </Link>
  );
}
