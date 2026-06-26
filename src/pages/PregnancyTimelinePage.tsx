import React, { useState } from 'react';
import { PREGNANCY_STAGES } from '@/lib/demo-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Circle, Clock, AlertTriangle, Heart, BookOpen, Pill, Stethoscope, User, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PregnancyTimelinePage() {
  const [expanded, setExpanded] = useState<string>('second-trimester');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Pregnancy Care Timeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Amina Bello · MED-ELR-24018 · Currently at 24 weeks</p>
      </div>

      {/* Progress bar */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Care Journey Progress</span>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-medium text-primary">Week 24 of 40</span>
        </div>
        <div className="flex items-start gap-0">
          {PREGNANCY_STAGES.map((stage, i) => (
            <div key={stage.id} className="flex-1 flex flex-col items-center gap-1.5">
              <button
                onClick={() => setExpanded(expanded === stage.id ? '' : stage.id)}
                className="flex flex-col items-center gap-1 w-full group"
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                  stage.status === 'completed' ? 'bg-primary border-primary text-primary-foreground' :
                  stage.status === 'current' ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20' :
                  'bg-card border-border text-muted-foreground'
                )}>
                  {stage.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : stage.status === 'current' ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
                <span className={cn(
                  'text-xs text-center leading-tight hidden md:block',
                  stage.status === 'current' ? 'font-semibold text-primary' :
                  stage.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {stage.name}
                </span>
              </button>
              {i < PREGNANCY_STAGES.length - 1 && (
                <div className={cn('h-0.5 w-full mt-3', stage.status === 'completed' ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage cards */}
      <div className="space-y-3">
        {PREGNANCY_STAGES.map(stage => {
          const isExpanded = expanded === stage.id;
          const isCurrent = stage.status === 'current';
          return (
            <div
              key={stage.id}
              className={cn(
                'rounded-xl border overflow-hidden transition-all',
                isCurrent ? 'border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]' :
                stage.status === 'completed' ? 'border-border bg-card opacity-80' : 'border-border bg-card'
              )}
            >
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(isExpanded ? '' : stage.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                    isCurrent ? 'bg-primary' :
                    stage.status === 'completed' ? 'bg-secondary' : 'bg-muted'
                  )}>
                    {stage.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-primary" /> :
                     isCurrent ? <Clock className="w-5 h-5 text-primary-foreground" /> :
                     <Circle className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{stage.name}</span>
                      <span className="text-xs text-muted-foreground">{stage.weeks}</span>
                      {isCurrent && (
                        <Badge className="text-xs bg-primary text-primary-foreground">
                          Current · Week {(stage as typeof stage & { currentWeek?: number }).currentWeek}
                        </Badge>
                      )}
                      {stage.status === 'completed' && <Badge variant="outline" className="text-xs text-[hsl(142_63%_30%)] border-[hsl(142_63%_50%)]">Completed</Badge>}
                    </div>
                    {!isExpanded && <p className="text-xs text-muted-foreground mt-0.5">{stage.goals[0]}</p>}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-border bg-card">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                    {[
                      { icon: Heart, label: 'Care Goals', items: stage.goals, color: 'text-primary' },
                      { icon: Stethoscope, label: 'Required Checkups', items: stage.checkups, color: 'text-[hsl(207_85%_45%)]' },
                      { icon: User, label: 'Nurse Touchpoints', items: stage.nurseTouchpoints, color: 'text-[hsl(142_63%_35%)]' },
                      { icon: AlertTriangle, label: 'Warning Signs', items: stage.warnings, color: 'text-destructive' },
                      { icon: BookOpen, label: 'Education', items: stage.education, color: 'text-accent' },
                      { icon: Pill, label: 'Medication Reminders', items: stage.medications, color: 'text-primary' },
                    ].map(section => {
                      const Icon = section.icon;
                      return (
                        <div key={section.label}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Icon className={`w-3.5 h-3.5 ${section.color}`} />
                            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">{section.label}</span>
                          </div>
                          <ul className="space-y-1.5">
                            {section.items.map((item, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <div className="w-1 h-1 rounded-full bg-border mt-1.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                  {stage.changes.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-border">
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-2">Expected Changes</span>
                      <div className="flex flex-wrap gap-2">
                        {stage.changes.map((c, j) => (
                          <Badge key={j} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Next steps: </span>{stage.nextSteps}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
