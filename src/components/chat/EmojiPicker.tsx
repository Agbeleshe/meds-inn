import { useRef, useEffect } from "react";
import { CHAT_EMOJIS } from "@/lib/chat-constants";
import { cn } from "@/lib/utils";

type EmojiPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  className?: string;
};

export function EmojiPicker({ open, onClose, onSelect, className }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-full left-0 mb-2 z-50 w-[min(100vw-2rem,280px)] rounded-xl border border-border bg-popover p-2 shadow-lg",
        className,
      )}
    >
      <div className="grid grid-cols-6 gap-0.5 max-h-40 overflow-y-auto">
        {CHAT_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="text-xl p-1.5 rounded-md hover:bg-muted transition-colors"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
