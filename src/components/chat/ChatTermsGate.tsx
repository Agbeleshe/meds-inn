import { useEffect, useState } from "react";
import { CHAT_TERMS_CONTENT, CHAT_TERMS_STORAGE_KEY } from "@/lib/chat-constants";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield } from "lucide-react";

export function useChatTermsAccepted(userId: string | undefined) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const key = `${CHAT_TERMS_STORAGE_KEY}_${userId}`;
    setAccepted(localStorage.getItem(key) === "1");
  }, [userId]);

  const accept = () => {
    if (!userId) return;
    localStorage.setItem(`${CHAT_TERMS_STORAGE_KEY}_${userId}`, "1");
    setAccepted(true);
  };

  return { accepted, accept };
}

type ChatTermsDialogProps = {
  open: boolean;
  onAccept: () => void;
};

export function ChatTermsDialog({ open, onAccept }: ChatTermsDialogProps) {
  const [checked, setChecked] = useState(false);

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-primary" />
            {CHAT_TERMS_CONTENT.title}
          </DialogTitle>
        </DialogHeader>
        <ul className="text-sm text-muted-foreground space-y-2.5 list-disc pl-4">
          {CHAT_TERMS_CONTENT.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <label className="flex items-start gap-2.5 text-sm cursor-pointer pt-2">
          <Checkbox
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
            className="mt-0.5"
          />
          <span>{CHAT_TERMS_CONTENT.agreeLabel}</span>
        </label>
        <DialogFooter>
          <Button disabled={!checked} onClick={onAccept} className="w-full sm:w-auto">
            Continue to messages
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
