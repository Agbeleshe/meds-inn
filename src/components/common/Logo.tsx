import { cn } from "@/lib/utils";
import { LOGO_DARK_SRC, LOGO_SRC } from "@/lib/brand";
import { useTheme } from "@/contexts/ThemeContext";

const SIZES = {
  xs: { icon: "h-5 w-5", text: "text-sm" },
  sm: { icon: "h-6 w-6", text: "text-sm" },
  md: { icon: "h-8 w-8", text: "text-base" },
  lg: { icon: "h-10 w-10", text: "text-xl" },
  xl: { icon: "h-14 w-14", text: "text-2xl" },
  splash: { icon: "h-20 w-20", text: "text-[34px]" },
} as const;

type LogoSize = keyof typeof SIZES;

/** auto = theme-aware; dark = white mark (sidebar / dark bg); light = teal mark */
export type LogoVariant = "auto" | "light" | "dark";

function resolveLogoSrc(variant: LogoVariant, theme: "light" | "dark") {
  if (variant === "dark") return LOGO_DARK_SRC;
  if (variant === "light") return LOGO_SRC;
  return theme === "dark" ? LOGO_DARK_SRC : LOGO_SRC;
}

interface LogoMarkProps {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
}

export function LogoMark({ size = "md", variant = "auto", className }: LogoMarkProps) {
  const { theme } = useTheme();
  const src = resolveLogoSrc(variant, theme);

  return (
    <img
      src={src}
      alt="Meds-inn"
      className={cn(SIZES[size].icon, "shrink-0 object-contain", className)}
    />
  );
}

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

export function Logo({
  size = "md",
  variant = "auto",
  showWordmark = true,
  className,
  wordmarkClassName,
}: LogoProps) {
  const s = SIZES[size];

  return (
    <div className={cn("flex items-center gap-2.5 min-w-0", className)}>
      <LogoMark size={size} variant={variant} />
      {showWordmark && (
        <span
          className={cn(
            s.text,
            "font-semibold tracking-tight truncate",
            wordmarkClassName,
          )}
        >
          Meds-inn
        </span>
      )}
    </div>
  );
}
