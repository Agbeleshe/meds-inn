import React, { useState } from 'react';
import { PATIENTS } from '@/lib/demo-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Sparkles, CheckCircle2, Clock, RefreshCw, FileText, ChevronRight, AlertTriangle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdherenceBadge } from '@/components/common/Badges';

const BRIEFS = PATIENTS.slice(0, 5).map((p, i) => ({
  patient: p,
  generated: '2026-06-25',
  reviewed: i < 2,
  reviewedBy: i < 2 ? 'Dr. Tolu Adebayo' : null,
  reviewedAt: i < 2 ? '2026-06-25 08:30' : null,
  riskCues: p.id === 'MED-ELR-24018'
    ? ['Fatigue reported x2 weeks', 'Occasional dizziness noted', 'Hb slightly below range (10.8 g/dL)']
    : p.riskLevel === 'high'
    ? ['Blood pressure elevated at last visit', 'Missed last two follow-up calls']
    : ['No urgent concerns at this time'],
  adherenceSummary: {
    medication: p.adherence,
    appointment: Math.round(p.adherence * 0.95),
    missedVisits: p.riskLevel === 'high' ? 2 : 1,
  },
  suggestedFollowups: p.id === 'MED-ELR-24018'
    ? ['Nurse call within 48 hours', 'Schedule GTT before July 15', 'Review iron adherence at next visit']
    : p.riskLevel === 'high'
    ? ['Immediate phone consultation recommended', 'Escalate to Dr. Tolu Adebayo', 'Home visit if no contact by 48 hours']
    : ['Routine 4-week check-in', 'Continue current plan'],
  summary: p.id === 'MED-ELR-24018'
    ? `${p.name} is ${p.gestationalWeek} weeks pregnant with ${p.adherence}% medication adherence. She missed one appointment in the last 30 days and recently reported fatigue and occasional dizziness. Her haemoglobin at the most recent visit was slightly below normal at 10.8 g/dL. Iron supplementation is ongoing. Suggested next step: nurse follow-up within 48 hours and glucose tolerance test to be scheduled before the 28-week visit.`
    : p.riskLevel === 'high'
    ? `${p.name} has missed two follow-up calls and her blood pressure was elevated at the last visit. Urgent follow-up is recommended before the next scheduled appointment. Current medication adherence is ${p.adherence}%. Immediate phone consultation or home visit should be arranged if no contact is made within 48 hours.`
    : `${p.name} is progressing within expected parameters. Medication adherence is ${p.adherence}% and all recent appointments have been attended. No urgent concerns at this time. Continue with the current care plan and next scheduled review.`,
}));

export default function AICareBriefsPage() {
  const [selectedId, setSelectedId] = useState(PATIENTS[0].id);
  const [reviewed, setReviewed] = useState<Record<string, boolean>>(
    Object.fromEntries(BRIEFS.filter(b => b.reviewed).map(b => [b.patient.id, true]))
  );

  const selectedBrief = BRIEFS.find(b => b.patient.id === selectedId)!;

  function markReviewed() {
    setReviewed(prev => ({ ...prev, [selectedId]: true }));
    toast.success('Brief marked as reviewed by Dr. Tolu Adebayo');
  }

  return (
    <div className="space-y-6">
      <div data-tour="ai-briefs-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Care Briefs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {BRIEFS.filter(b => !reviewed[b.patient.id]).length} briefs awaiting clinician review
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground hidden md:block">AI assists — does not diagnose or prescribe.</p>
          <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={() => toast.success('Regenerating all briefs…')}>
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate all
          </Button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-secondary px-4 py-3 rounded-lg border border-primary/20">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground text-pretty">
          AI care briefs are <span className="font-semibold text-foreground">summaries for clinical use only</span>.
          They are generated from documented patient activity and adherence data.
          All briefs require review by an authorised clinician before any action is taken.
          Meds-inn does not provide medical diagnoses or prescriptions.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Brief list */}
        <div data-tour="ai-briefs-list" className="space-y-2">
          {BRIEFS.map(b => {
            const isReviewed = reviewed[b.patient.id];
            const isSelected = selectedId === b.patient.id;
            return (
              <button
                key={b.patient.id}
                onClick={() => setSelectedId(b.patient.id)}
                className={cn(
                  'w-full text-left rounded-xl border p-4 transition-all',
                  isSelected ? 'border-primary bg-secondary' : 'border-border bg-card hover:border-primary/30'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-xs bg-secondary text-primary font-semibold">{b.patient.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{b.patient.name}</p>
                      <p className="text-xs text-muted-foreground">{b.patient.id}</p>
                    </div>
                  </div>
                  {isReviewed
                    ? <CheckCircle2 className="w-4 h-4 text-[hsl(142_63%_35%)] shrink-0" />
                    : <Clock className="w-4 h-4 text-[hsl(38_70%_40%)] shrink-0" />}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={cn('font-medium', b.patient.riskLevel === 'high' ? 'text-destructive' : b.patient.riskLevel === 'moderate' ? 'text-[hsl(38_70%_35%)]' : 'text-[hsl(142_63%_30%)]')}>
                    {b.patient.riskLevel === 'high' ? '● High risk' : b.patient.riskLevel === 'moderate' ? '● Moderate' : '● Low risk'}
                  </span>
                  <span className="text-muted-foreground">{b.generated}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Brief detail */}
        {selectedBrief && (
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-primary/20 bg-secondary/30">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm font-semibold text-primary">AI Care Brief</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedBrief.patient.name} · Generated {selectedBrief.generated}
                      {reviewed[selectedBrief.patient.id] && ` · Reviewed ${selectedBrief.reviewedAt}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {reviewed[selectedBrief.patient.id]
                      ? <Badge className="text-xs bg-[hsl(142_63%_35%)] text-white">Reviewed</Badge>
                      : <Badge className="text-xs bg-[hsl(38_92%_50%)] text-white">Awaiting review</Badge>}
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success('Regenerating brief…')}>
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-card rounded-lg p-4 border border-primary/10">
                  <p className="text-sm text-foreground text-pretty leading-relaxed">{selectedBrief.summary}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  {/* Risk cues */}
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-[hsl(38_70%_35%)]" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk Cues</p>
                    </div>
                    <ul className="space-y-1.5">
                      {selectedBrief.riskCues.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                          <ChevronRight className="w-3 h-3 text-[hsl(38_70%_40%)] mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Adherence */}
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adherence</p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Medication</span>
                          <AdherenceBadge value={selectedBrief.adherenceSummary.medication} />
                        </div>
                        <Progress value={selectedBrief.adherenceSummary.medication} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Appointments</span>
                          <AdherenceBadge value={selectedBrief.adherenceSummary.appointment} />
                        </div>
                        <Progress value={selectedBrief.adherenceSummary.appointment} className="h-1.5" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedBrief.adherenceSummary.missedVisits} missed visit{selectedBrief.adherenceSummary.missedVisits !== 1 ? 's' : ''} (last 30 days)
                      </p>
                    </div>
                  </div>

                  {/* Follow-ups */}
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suggested Actions</p>
                    </div>
                    <ul className="space-y-1.5">
                      {selectedBrief.suggestedFollowups.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                          <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap">
                  {!reviewed[selectedBrief.patient.id] && (
                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={markReviewed}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark as reviewed
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast.success('Clinician note added')}>
                    Add clinician note
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast.success('Brief shared with care team')}>
                    Share with team
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
