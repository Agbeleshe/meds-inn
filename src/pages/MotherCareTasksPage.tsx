import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCarePlan } from '@/hooks/use-care-plan';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { SavingIndicator } from '@/components/common/SavingIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  CheckCircle2, ClipboardList, RefreshCw, TrendingUp, AlertTriangle, CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatDisplayDate(dateStr: string) {
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function MotherCareTasksPage() {
  const { user } = useAuth();
  const motherId = user?.motherId;
  const {
    plan,
    source,
    loading,
    saving,
    toggleChecklistItem,
    refetch,
  } = useCarePlan(motherId);

  useEffect(() => {
    if (!motherId) return;
    const refresh = () => refetch();
    window.addEventListener('focus', refresh);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [motherId, refetch]);

  const checklist = plan?.motherChecklist ?? [];
  const dailyAssignment = plan?.dailyChecklist;
  const assignmentActive = plan?.assignmentActive ?? checklist.length > 0;
  const incompleteItems = checklist.filter((c) => !c.done);
  const completedItems = checklist.filter((c) => c.done);
  const todayDone = completedItems.length;
  const todayTotal = checklist.length;
  const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;
  const allDone = todayTotal > 0 && incompleteItems.length === 0;

  const yesterday = plan?.yesterdaySummary;
  const overallAdherence = plan?.checklistAdherence?.adherencePercent;

  async function handleToggle(itemId: string, wasDone: boolean) {
    try {
      await toggleChecklistItem(itemId);
      toast.success(wasDone ? 'Moved back to today\'s list' : 'Marked complete — nice work!');
    } catch {
      toast.error('Could not update task');
      refetch();
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Today&apos;s Care Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your daily checklist from your care team · resets at midnight
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceBadge source={source} loading={loading} />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Reload
          </Button>
        </div>
      </div>

      <SavingIndicator active={saving} message="Updating your checklist…" />

      {dailyAssignment && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>
            Plan active {formatDisplayDate(dailyAssignment.startDate)} – {formatDisplayDate(dailyAssignment.endDate)}
          </span>
          {plan?.todayDate && (
            <Badge variant="outline" className="text-[10px]">Today: {plan.todayDate}</Badge>
          )}
        </div>
      )}

      {yesterday && (
        <Card className="border-primary/15 bg-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Yesterday&apos;s performance
            </CardTitle>
            <p className="text-xs text-muted-foreground">{formatDisplayDate(yesterday.date)}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Progress
                value={yesterday.totalCount > 0 ? (yesterday.completedCount / yesterday.totalCount) * 100 : 0}
                className="h-2 flex-1"
              />
              <span className="text-sm font-semibold tabular-nums">
                {yesterday.completedCount}/{yesterday.totalCount}
              </span>
            </div>
            {yesterday.abscondedCount > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {yesterday.abscondedCount} task{yesterday.abscondedCount !== 1 ? 's' : ''} missed yesterday
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {yesterday.abscondedItems.map((item) => (
                    <Badge
                      key={item.id}
                      variant="outline"
                      className="text-[10px] text-destructive border-destructive/30"
                    >
                      {item.text}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : yesterday.completed ? (
              <p className="text-xs text-[hsl(142_63%_35%)] font-medium">
                You completed all tasks yesterday — well done!
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No recorded tasks for yesterday yet.</p>
            )}
            {overallAdherence != null && (
              <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                Overall plan adherence: <span className="font-semibold text-foreground">{overallAdherence}%</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!yesterday && !loading && dailyAssignment && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Your plan started today — yesterday&apos;s performance will appear here tomorrow.
          </CardContent>
        </Card>
      )}

      {loading && checklist.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : checklist.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {dailyAssignment && !assignmentActive
                ? 'Your care plan is not active today. Check back on your start date or contact your care team.'
                : 'Your care team has not assigned a daily checklist yet. You will be notified when they do.'}
            </p>
          </CardContent>
        </Card>
      ) : allDone ? (
        <Card className="border-[hsl(142_63%_55%)] bg-[hsl(142_63%_97%)]">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-[hsl(142_63%_35%)] mx-auto mb-3" />
            <p className="text-base font-semibold text-foreground">All done for today!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {todayDone}/{todayTotal} tasks complete · checklist reloads at midnight
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">Tasks for today</CardTitle>
              <span className="text-xs font-medium text-primary">{todayPct}%</span>
            </div>
            <Progress value={todayPct} className="h-1.5 mt-2" />
          </CardHeader>
          <CardContent className="space-y-1">
            {incompleteItems.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={saving}
                onClick={() => handleToggle(item.id, item.done)}
                className="flex items-center gap-3 w-full text-left py-2.5 px-1 rounded-md hover:bg-muted/50 disabled:opacity-50 group"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 text-border group-hover:text-muted-foreground" />
                <span className="text-sm text-foreground">{item.text}</span>
              </button>
            ))}
            {completedItems.length > 0 && (
              <div className="pt-3 mt-2 border-t border-border space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground px-1 mb-1">Done today</p>
                {completedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={saving}
                    onClick={() => handleToggle(item.id, item.done)}
                    className="flex items-center gap-3 w-full text-left py-2 px-1 rounded-md hover:bg-muted/50 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-[hsl(142_63%_35%)]" />
                    <span className="text-sm line-through text-muted-foreground">{item.text}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
