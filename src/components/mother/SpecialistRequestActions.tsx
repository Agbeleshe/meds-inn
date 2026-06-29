import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { submitSpecialistRequest } from '@/lib/api-client';
import { isMotherUnassigned, hasPendingSpecialistRequest } from '@/lib/assignments';
import { AsyncButton } from '@/components/common/AsyncButton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserPlus, RefreshCw, Flag, Clock } from 'lucide-react';
import type { Mother, SpecialistRequestType } from '@/types/clinical';

interface SpecialistRequestActionsProps {
  motherId: string;
  profile: Mother;
  onSubmitted: () => void;
  /** compact = inline buttons only; full = includes unassigned prompt copy */
  variant?: 'compact' | 'full';
}

export function SpecialistRequestActions({
  motherId,
  profile,
  onSubmitted,
  variant = 'full',
}: SpecialistRequestActionsProps) {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState<SpecialistRequestType>('request');
  const [note, setNote] = useState('');

  if (user?.role !== 'mother') return null;

  const unassigned = isMotherUnassigned(profile);
  const pending = hasPendingSpecialistRequest(profile);

  function openDialog(type: SpecialistRequestType) {
    setRequestType(type);
    setNote('');
    setDialogOpen(true);
  }

  async function submit() {
    try {
      await submitSpecialistRequest(motherId, { type: requestType, note: note.trim() || undefined });
      setDialogOpen(false);
      toast.success('Your request was sent to the hospital admin.');
      onSubmitted();
    } catch {
      toast.error('Could not send request. Please try again.');
    }
  }

  const dialogTitles: Record<SpecialistRequestType, string> = {
    request: 'Request a specialist',
    change: 'Request change of specialist',
    report: 'Report your specialist',
  };

  return (
    <>
      {pending && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Clock className="w-4 h-4 shrink-0" />
          Your request is pending — the hospital admin will assign a specialist soon.
        </div>
      )}

      {unassigned && !pending && variant === 'full' && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-6 text-center space-y-4">
          <UserPlus className="w-10 h-10 text-primary mx-auto" />
          <div>
            <p className="text-base font-semibold text-foreground">No specialist assigned yet</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              If you haven&apos;t been automatically assigned a nurse or doctor, please request a
              specialist. An admin will match you with someone from your hospital care team.
            </p>
          </div>
          <AsyncButton className="gap-2" onClick={() => openDialog('request')}>
            <UserPlus className="w-4 h-4" /> Request a specialist
          </AsyncButton>
        </div>
      )}

      {unassigned && !pending && variant === 'compact' && (
        <AsyncButton size="sm" className="h-9 gap-1.5" onClick={() => openDialog('request')}>
          <UserPlus className="w-3.5 h-3.5" /> Request a specialist
        </AsyncButton>
      )}

      {!unassigned && !pending && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Need a different specialist?</p>
          <p className="text-xs text-muted-foreground">
            You can ask the hospital admin to change your care team or report a concern.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => openDialog('change')}>
              <RefreshCw className="w-3.5 h-3.5" /> Request change
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 text-destructive" onClick={() => openDialog('report')}>
              <Flag className="w-3.5 h-3.5" /> Report specialist
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" asChild>
              <Link to="/dashboard/messages">Message your team</Link>
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitles[requestType]}</DialogTitle>
            <DialogDescription>
              The hospital admin will be notified and can assign or reassign your care team from the waiting list.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for the admin…"
            rows={4}
            className="text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <AsyncButton loadingText="Sending…" onClick={submit}>Submit request</AsyncButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
