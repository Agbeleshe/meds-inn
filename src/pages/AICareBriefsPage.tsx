import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { CheckCircle2, Clock, RefreshCw, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCareBriefs } from '@/hooks/use-care-briefs';
import { useAuth } from '@/contexts/AuthContext';
import { CareBriefPanel } from '@/components/clinical/CareBriefPanel';
import { useApp } from '@/contexts/AppContext';

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AICareBriefsPage() {
  const { user } = useAuth();
  const { role } = useApp();
  const [searchParams] = useSearchParams();
  const {
    items,
    loading,
    error,
    busy,
    regenerateOne,
    regenerateAll,
    markReviewed,
    saveClinicianNote,
  } = useCareBriefs();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = searchParams.get('motherId');
    if (fromUrl && items.some((row) => row.motherId === fromUrl)) {
      setSelectedId(fromUrl);
      return;
    }
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0].motherId);
    }
  }, [items, selectedId, searchParams]);

  const awaitingCount = useMemo(
    () => items.filter((row) => row.brief && !row.brief.reviewed).length,
    [items],
  );

  const selectedRow = items.find((row) => row.motherId === selectedId);

  async function handleRegenerateAll() {
    try {
      const count = await regenerateAll();
      toast.success(`Regenerated ${count} care brief${count !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate briefs');
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Failed to load care briefs: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div data-tour="ai-briefs-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Care Briefs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {role === 'admin'
              ? 'All enrolled mothers · hospital-wide view'
              : 'Your assigned patients · caseload view'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {loading ? 'Loading…' : `${awaitingCount} brief${awaitingCount !== 1 ? 's' : ''} awaiting clinician review`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground hidden md:block">AI assists — does not diagnose or prescribe.</p>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            disabled={busy || loading || items.length === 0}
            onClick={handleRegenerateAll}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Regenerate all
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-secondary px-4 py-3 rounded-lg border border-primary/20">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground text-pretty">
          Briefs are generated from patient records, medication logs, appointment history, daily care checklists,
          and secure messaging. Each statement cites its data source. All briefs require review by{' '}
          <span className="font-semibold text-foreground">{user?.name ?? 'an authorised clinician'}</span> before action.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading care briefs…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {role === 'admin'
              ? 'No enrolled mothers in this hospital yet.'
              : 'No assigned mothers in your caseload.'}
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div data-tour="ai-briefs-list" className="space-y-2">
            {items.map((row) => {
              const brief = row.brief;
              const isReviewed = brief?.reviewed ?? false;
              const isSelected = selectedId === row.motherId;
              return (
                <button
                  key={row.motherId}
                  onClick={() => setSelectedId(row.motherId)}
                  className={cn(
                    'w-full text-left rounded-xl border p-4 transition-all',
                    isSelected ? 'border-primary bg-secondary' : 'border-border bg-card hover:border-primary/30',
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-xs bg-secondary text-primary font-semibold">{row.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{row.motherName}</p>
                        <p className="text-xs text-muted-foreground">{row.motherId}</p>
                      </div>
                    </div>
                    {!brief ? (
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : isReviewed ? (
                      <CheckCircle2 className="w-4 h-4 text-[hsl(142_63%_35%)] shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-[hsl(38_70%_40%)] shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn(
                      'font-medium',
                      row.riskLevel === 'high' ? 'text-destructive' : row.riskLevel === 'moderate' ? 'text-[hsl(38_70%_35%)]' : 'text-[hsl(142_63%_30%)]',
                    )}>
                      {row.riskLevel === 'high' ? '● High risk' : row.riskLevel === 'moderate' ? '● Moderate' : '● Low risk'}
                    </span>
                    <span className="text-muted-foreground">
                      {brief ? formatDate(brief.generatedAt) : 'Not generated'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-2">
            {selectedRow && (
              <CareBriefPanel
                brief={selectedRow.brief}
                canEdit={selectedRow.canEdit}
                busy={busy}
                patientId={selectedRow.motherId}
                riskLevel={selectedRow.riskLevel}
                onRegenerate={
                  selectedRow.canEdit
                    ? () => regenerateOne(selectedRow.motherId).then(() => toast.success('Brief regenerated'))
                    : undefined
                }
                onMarkReviewed={
                  selectedRow.canEdit
                    ? () => markReviewed(selectedRow.motherId).then(() => toast.success(`Marked reviewed by ${user?.name ?? 'clinician'}`))
                    : undefined
                }
                onSaveNote={
                  selectedRow.canEdit
                    ? (note) => saveClinicianNote(selectedRow.motherId, note)
                    : undefined
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
