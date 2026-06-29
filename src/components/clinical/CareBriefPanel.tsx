import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Sparkles,
  CheckCircle2,
  RefreshCw,
  FileText,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Loader2,
  Printer,
  Database,
} from 'lucide-react';
import { AdherenceBadge } from '@/components/common/Badges';
import type { CareBriefRecord } from '@/lib/api-client';
import { downloadCareBriefPdf } from '@/lib/care-brief-print';

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface CareBriefPanelProps {
  brief: CareBriefRecord | null;
  canEdit?: boolean;
  busy?: boolean;
  loading?: boolean;
  patientId?: string;
  riskLevel?: string;
  onRegenerate?: () => Promise<unknown>;
  onMarkReviewed?: () => Promise<unknown>;
  onSaveNote?: (note: string) => Promise<unknown>;
  compact?: boolean;
}

export function CareBriefPanel({
  brief,
  canEdit = false,
  busy = false,
  loading = false,
  patientId,
  riskLevel,
  onRegenerate,
  onMarkReviewed,
  onSaveNote,
  compact = false,
}: CareBriefPanelProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading care brief…</span>
        </CardContent>
      </Card>
    );
  }

  if (!brief) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <Sparkles className="w-8 h-8 text-primary mx-auto opacity-60" />
          <p className="text-sm text-muted-foreground">No AI care brief generated yet.</p>
          {canEdit && onRegenerate && (
            <Button size="sm" className="gap-1.5" disabled={busy} onClick={() => onRegenerate().catch((e) => toast.error(String(e)))}>
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate brief
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const summaryParagraphs = brief.summary.split(/\n\n+/).filter(Boolean);

  async function handlePrint() {
    const toastId = toast.loading('Preparing care brief PDF…');
    try {
      await downloadCareBriefPdf(brief!, { patientId, riskLevel });
      toast.success('Care brief downloaded as PDF', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not download care brief', { id: toastId });
    }
  }

  return (
    <>
      <Card className="border-primary/20 bg-secondary/30">
        <CardHeader className={compact ? 'pb-2' : 'pb-3'}>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold text-primary">AI Care Brief</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                {brief.motherName} · Generated {formatDateTime(brief.generatedAt)}
                {brief.reviewed && brief.reviewedAt && (
                  <> · Reviewed {formatDateTime(brief.reviewedAt)}{brief.reviewedBy ? ` by ${brief.reviewedBy}` : ''}</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {brief.reviewed ? (
                <Badge className="text-xs bg-[hsl(142_63%_35%)] text-white">Reviewed</Badge>
              ) : (
                <Badge className="text-xs bg-[hsl(38_92%_50%)] text-white">Awaiting review</Badge>
              )}
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={busy} onClick={handlePrint}>
                <Printer className="w-3 h-3" /> Download PDF
              </Button>
              {canEdit && onRegenerate && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={busy} onClick={() => onRegenerate().catch((e) => toast.error(String(e)))}>
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Regenerate
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-card rounded-lg p-4 border border-primary/10 space-y-3">
            {summaryParagraphs.map((para, i) => (
              <p key={i} className="text-sm text-foreground text-pretty leading-relaxed">{para}</p>
            ))}
          </div>

          {brief.clinicianNote && (
            <div className="bg-card rounded-lg p-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Clinician note</p>
              <p className="text-sm text-foreground">{brief.clinicianNote}</p>
            </div>
          )}

          {(brief.dataSources ?? []).length > 0 && (
            <div className="bg-card rounded-lg p-3 border border-border">
              <div className="flex items-center gap-1.5 mb-2">
                <Database className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Information sources</p>
              </div>
              <ul className="space-y-2">
                {(brief.dataSources ?? []).map((src, i) => (
                  <li key={i} className="text-xs text-foreground">
                    <span className="font-semibold">{src.category}: </span>
                    <span className="text-muted-foreground">{src.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-card rounded-lg p-3 border border-border">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[hsl(38_70%_35%)]" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk Cues</p>
              </div>
              <ul className="space-y-1.5">
                {brief.riskCues.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                    <ChevronRight className="w-3 h-3 text-[hsl(38_70%_40%)] mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card rounded-lg p-3 border border-border">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adherence</p>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Medication</span>
                    <AdherenceBadge value={brief.adherenceSummary.medication} />
                  </div>
                  <Progress value={brief.adherenceSummary.medication} className="h-1.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Appointments</span>
                    <AdherenceBadge value={brief.adherenceSummary.appointment} />
                  </div>
                  <Progress value={brief.adherenceSummary.appointment} className="h-1.5" />
                </div>
                {brief.adherenceSummary.checklist != null && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Daily checklist</span>
                      <AdherenceBadge value={brief.adherenceSummary.checklist} />
                    </div>
                    <Progress value={brief.adherenceSummary.checklist} className="h-1.5" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {brief.adherenceSummary.missedVisits} missed visit{brief.adherenceSummary.missedVisits !== 1 ? 's' : ''} (last 30 days)
                </p>
              </div>
            </div>

            <div className="bg-card rounded-lg p-3 border border-border">
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suggested Actions</p>
              </div>
              <ul className="space-y-1.5">
                {brief.suggestedFollowups.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                    <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap">
            {!brief.reviewed && canEdit && onMarkReviewed && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                disabled={busy}
                onClick={() => onMarkReviewed().catch((e) => toast.error(String(e)))}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark as reviewed
              </Button>
            )}
            {canEdit && onSaveNote && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={busy}
                onClick={() => {
                  setNoteText(brief.clinicianNote ?? '');
                  setNoteOpen(true);
                }}
              >
                {brief.clinicianNote ? 'Edit clinician note' : 'Add clinician note'}
              </Button>
            )}
            {brief.reviewed && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" disabled={busy} onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" /> Export reviewed brief (PDF)
              </Button>
            )}
            <p className="text-xs text-muted-foreground ml-auto">AI assists clinicians — does not diagnose or prescribe.</p>
          </div>
        </CardContent>
      </Card>

      {onSaveNote && (
        <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clinician note</DialogTitle>
            </DialogHeader>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add your clinical observations or follow-up instructions…"
              rows={5}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
              <Button
                disabled={busy || !noteText.trim()}
                onClick={() => {
                  onSaveNote(noteText.trim())
                    .then(() => {
                      setNoteOpen(false);
                      toast.success('Clinician note saved');
                    })
                    .catch((e) => toast.error(String(e)));
                }}
              >
                Save note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
