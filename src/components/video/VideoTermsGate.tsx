import { useEffect, useState } from 'react';
import { VIDEO_TERMS_CONTENT, VIDEO_TERMS_STORAGE_KEY } from '@/lib/video-constants';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, Video } from 'lucide-react';

export function useVideoTermsAccepted(userId: string | undefined) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setAccepted(localStorage.getItem(`${VIDEO_TERMS_STORAGE_KEY}_${userId}`) === '1');
  }, [userId]);

  const accept = () => {
    if (!userId) return;
    localStorage.setItem(`${VIDEO_TERMS_STORAGE_KEY}_${userId}`, '1');
    setAccepted(true);
  };

  return { accepted, accept };
}

type VideoTermsDialogProps = {
  open: boolean;
  onAccept: () => void;
  onDecline?: () => void;
};

export function VideoTermsDialog({ open, onAccept, onDecline }: VideoTermsDialogProps) {
  const [checked, setChecked] = useState(false);

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        className="max-w-md max-h-[90dvh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-primary" />
            {VIDEO_TERMS_CONTENT.title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          <Video className="w-3.5 h-3.5 shrink-0" />
          Please read before joining your consultation.
        </div>
        <ul className="text-sm text-muted-foreground space-y-2.5 list-disc pl-4">
          {VIDEO_TERMS_CONTENT.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <label className="flex items-start gap-2.5 text-sm cursor-pointer pt-2">
          <Checkbox
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
            className="mt-0.5"
          />
          <span>{VIDEO_TERMS_CONTENT.agreeLabel}</span>
        </label>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onDecline && (
            <Button variant="outline" onClick={onDecline} className="w-full sm:w-auto">
              Cancel
            </Button>
          )}
          <Button disabled={!checked} onClick={onAccept} className="w-full sm:w-auto">
            Join video call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
