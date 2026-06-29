import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMyMotherProfile } from '@/hooks/use-mother';
import { useCarePlan } from '@/hooks/use-care-plan';
import { useAppointments } from '@/hooks/use-appointments';
import { useMedications } from '@/hooks/use-medications';
import { useBabyProfile } from '@/hooks/use-baby';
import { useBabyCare } from '@/hooks/use-baby-care';
import { ACTIVE_HOSPITAL } from '@/lib/hospitals';
import { syncGestationalWeek } from '@/lib/gestational-week-sync';
import {
  getWeekEducation,
  getTrimesterWeeks,
  type WeekEducation,
} from '@/lib/pregnancy-week-education';
import {
  getBabyEducation,
  getBabyWeekAnchors,
  isBabyCareProgramComplete,
} from '@/lib/baby-week-education';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { SavingIndicator } from '@/components/common/SavingIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Baby, Calendar, Pill, MessageSquare, BookOpen,
  CheckCircle2, Clock, AlertTriangle, ChevronRight, Heart,
  Droplets, Apple, Bell, Archive, Stethoscope,
} from 'lucide-react';
import { getTodayAppointments } from '@/lib/appointment-visits';

import type { Appointment } from '@/types/clinical';

export default function MotherDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const motherId = user?.motherId;
  const { data: profile, loading: profileLoading, updateProfile, refetch: refetchProfile } = useMyMotherProfile(motherId);
  const isPostpartum =
    profile?.careStage === 'postpartum' ||
    profile?.status === 'postpartum' ||
    profile?.status === 'delivered';
  const { profile: babyProfile } = useBabyProfile(motherId);
  const { checklist: babyChecklist } = useBabyCare(isPostpartum ? motherId : undefined);
  const { plan, source, loading: planLoading, saving, toggleChecklistItem, refetch } = useCarePlan(motherId);
  const { appointments } = useAppointments();
  const { medications } = useMedications(motherId);
  const [tab, setTab] = useState('my-care');
  const [educationTrimester, setEducationTrimester] = useState<WeekEducation['trimester']>('Second');
  const [educationWeek, setEducationWeek] = useState<number>(24);
  const [educationBabyWeek, setEducationBabyWeek] = useState<number>(0);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const babyTasksDone = babyChecklist.filter((i) => i.done).length;
  const babyTasksTotal = babyChecklist.length;

  const babyWeeks = profile?.babyWeeks ?? user?.babyWeeks ?? 0;
  const careProgramComplete = isPostpartum && isBabyCareProgramComplete(babyWeeks);

  const weeks = profile?.gestationalWeek ?? user?.gestationalWeeks ?? 0;
  const trimester = profile?.trimester ?? 'Second';
  const progressPct = weeks > 0 ? Math.min(100, Math.round((weeks / 40) * 100)) : 0;

  useEffect(() => {
    if (!profile || isPostpartum || !updateProfile) return;
    const sync = syncGestationalWeek({
      gestationalWeek: profile.gestationalWeek,
      edd: profile.edd,
      careStage: profile.careStage,
      status: profile.status,
    });
    if (sync?.changed) {
      updateProfile({
        gestationalWeek: sync.week,
        trimester: sync.trimester,
      }).catch(() => {});
    }
  }, [profile?.id, profile?.gestationalWeek, profile?.edd, isPostpartum, updateProfile]);

  useEffect(() => {
    if (weeks > 0) setEducationWeek(weeks);
  }, [weeks]);

  useEffect(() => {
    if (weeks <= 13) setEducationTrimester('First');
    else if (weeks <= 27) setEducationTrimester('Second');
    else setEducationTrimester('Third');
  }, [weeks]);

  const checklist = plan?.motherChecklist ?? [];
  const education = plan?.education ?? [];
  const dailyAssignment = plan?.dailyChecklist;
  const assignmentActive = plan?.assignmentActive ?? checklist.length > 0;
  const incompleteItems = checklist.filter((c) => !c.done);
  const completedItems = checklist.filter((c) => c.done);
  const allDone = checklist.length > 0 && incompleteItems.length === 0;

  const todayAppointments = useMemo(
    () => getTodayAppointments(appointments),
    [appointments],
  );

  const nextAppt = useMemo(
    () => appointments.filter((a) => a.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date))[0],
    [appointments],
  );

  const todayMeds = medications.filter((m) => m.patientId === motherId).slice(0, 5);
  const takenCount = todayMeds.filter((_, i) => i < 3).length;
  const adherencePct = todayMeds.length ? Math.round((takenCount / todayMeds.length) * 100) : 0;

  const firstName = user?.firstName ?? user?.name?.split(' ')[0] ?? 'there';

  const weekEducation = isPostpartum
    ? getBabyEducation(educationBabyWeek)
    : getWeekEducation(educationWeek);

  const babyWeekAnchors = getBabyWeekAnchors();

  useEffect(() => {
    if (isPostpartum) setEducationBabyWeek(babyWeeks);
  }, [isPostpartum, babyWeeks]);

  const trimesterWeeks = getTrimesterWeeks(educationTrimester);

  async function handleMarkDelivered() {
    if (!updateProfile) return;
    setMarkingDelivered(true);
    try {
      await updateProfile({ careStage: 'postpartum', status: 'delivered', babyWeeks: 0 });
      toast.success('Congratulations! Please complete your baby\'s profile.');
      refetchProfile();
      navigate('/dashboard/baby-care');
    } catch {
      toast.error('Could not update your status — please try again');
    } finally {
      setMarkingDelivered(false);
    }
  }

  async function handleToggleChecklistItem(itemId: string, wasDone: boolean) {
    try {
      await toggleChecklistItem(itemId);
      toast.success(wasDone ? 'Moved back to your care list' : 'Great — marked complete');
    } catch {
      toast.error('Could not update checklist');
      refetch();
    }
  }

  if ((profileLoading || planLoading) && !profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-lg font-bold text-foreground sr-only">My Care</h1>
        <DataSourceBadge source={source} loading={planLoading} />
      </div>

      <SavingIndicator active={saving} message="Please hold on while we update your checklist…" />

      {todayAppointments.length > 0 && (
        <div className="rounded-xl border border-[hsl(38_92%_70%)] bg-[hsl(38_92%_97%)] px-4 py-3 flex items-start gap-3">
          <Calendar className="w-5 h-5 text-[hsl(38_70%_35%)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[hsl(38_70%_25%)]">You have an appointment today</p>
            {todayAppointments.map((appt) => (
              <p key={appt.id} className="text-sm text-[hsl(38_70%_30%)] mt-1">
                Please don&apos;t forget — {appt.time}
                {appt.location ? ` at ${appt.location}` : ''}
                {appt.type ? ` (${appt.type})` : ''}.
              </p>
            ))}
            <Link to="/dashboard/appointments" className="text-xs font-medium text-primary hover:underline mt-2 inline-block">
              View appointment details →
            </Link>
          </div>
        </div>
      )}

      <div data-tour="mother-dash-header" className="bg-primary/5 border border-primary/15 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Good morning, {firstName}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isPostpartum ? (
                <>Welcome to your postpartum journey — your care team at {ACTIVE_HOSPITAL.shortName} is with you and {babyProfile?.babyName ? `${babyProfile.babyName}` : 'your baby'}.</>
              ) : weeks > 0 ? (
                <>You are <span className="font-semibold text-primary">{weeks} weeks pregnant</span> — {trimester.toLowerCase()} trimester.</>
              ) : (
                <>Welcome to your care journey.</>
              )}{' '}
              {!isPostpartum && `Your care team at ${ACTIVE_HOSPITAL.shortName} is with you.`}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9 w-full grid grid-cols-4">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="my-care" className="text-xs">My Care</TabsTrigger>
          <TabsTrigger value="education" className="text-xs gap-1">
            <BookOpen className="w-3 h-3" /> Education
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs gap-1">
            <Archive className="w-3 h-3" /> Done
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {!isPostpartum ? (
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-primary/20">
                <CardContent className="pt-5 pb-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pregnancy week</p>
                  <p className="text-4xl font-bold text-primary tabular-nums">{weeks || '—'}</p>
                  <Progress value={progressPct} className="h-1.5 mt-3" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-5">
                  <Baby className="w-4 h-4 text-primary mb-2" />
                  <p className="text-sm font-semibold text-foreground">Your baby</p>
                  <p className="text-xs text-muted-foreground mt-1">Movements and growth tracked week by week.</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Baby className="w-4 h-4" /> {babyProfile?.babyName ? `${babyProfile.babyName}` : 'Your baby'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {babyProfile?.babyName ? (
                  <>
                    <p className="text-sm text-muted-foreground">Born {babyProfile.birthDate || '—'} · {babyProfile.birthWeight || 'weight not recorded'}</p>
                    <p className="text-sm text-muted-foreground">Feeding: {babyProfile.feedingMethod || '—'}</p>
                    {babyTasksTotal > 0 && (
                      <p className="text-xs text-primary mt-1">Baby care today: {babyTasksDone}/{babyTasksTotal} tasks done</p>
                    )}
                    <Link to="/dashboard/baby-care"><Button size="sm" variant="outline" className="h-8 text-xs mt-2">View baby care</Button></Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Add your baby&apos;s details so your care team can support you fully.</p>
                    <Link to="/dashboard/baby-care"><Button size="sm" className="h-8 text-xs mt-2 gap-1"><Bell className="w-3.5 h-3.5" /> Complete baby profile</Button></Link>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {!isPostpartum && (
            <Card className="border-dashed">
              <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Have you delivered?</p>
                  <p className="text-xs text-muted-foreground mt-1">Update your status to unlock postpartum and baby care features.</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" disabled={markingDelivered} onClick={handleMarkDelivered}>
                  {markingDelivered ? 'Updating…' : 'Mark as delivered'}
                </Button>
              </CardContent>
            </Card>
          )}

          {nextAppt && (
            <Card
              className="border-[hsl(142_63%_55%)] bg-[hsl(142_63%_97%)] cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => setSelectedAppt(nextAppt)}
            >
              <CardContent className="pt-5 pb-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Next appointment</p>
                <p className="text-sm font-semibold mt-1">{nextAppt.type}</p>
                <p className="text-xs text-muted-foreground">{nextAppt.date} · {nextAppt.time} · {nextAppt.clinician}</p>
                {nextAppt.status === 'completed' && nextAppt.clinicianConfirmed && (
                  <p className="text-xs text-primary mt-2">Tap to view visit notes</p>
                )}
                <Link to="/dashboard/appointments" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" className="h-8 text-xs mt-3">View all appointments</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {todayMeds.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Pill className="w-4 h-4" /> Today&apos;s medications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {todayMeds.slice(0, 3).map((m) => (
                  <p key={m.id} className="text-sm text-muted-foreground">{m.name} · {m.dosage}</p>
                ))}
                <Link to="/dashboard/medications"><Button variant="link" className="h-auto p-0 text-xs">View all</Button></Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-care" className="mt-4 space-y-4">
          {checklist.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {dailyAssignment && !assignmentActive
                  ? 'Your daily checklist is not active today. It may have ended or not started yet.'
                  : 'Your care team has not set a checklist yet. Check back soon.'}
              </CardContent>
            </Card>
          ) : allDone ? (
            <Card className="border-[hsl(142_63%_55%)] bg-[hsl(142_63%_97%)]">
              <CardContent className="pt-6 pb-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-[hsl(142_63%_35%)] mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground">All care tasks complete!</p>
                <p className="text-xs text-muted-foreground mt-1">Tasks reset each morning at midnight.</p>
                <Button size="sm" variant="outline" className="mt-4 h-8 text-xs" onClick={() => setTab('completed')}>
                  View completed
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Today&apos;s care checklist</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Set by your care team · resets at midnight
                  {dailyAssignment && (
                    <> · through {dailyAssignment.endDate}</>
                  )}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {incompleteItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={saving}
                    onClick={() => handleToggleChecklistItem(item.id, item.done)}
                    className="flex items-center gap-3 w-full text-left group disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-border group-hover:text-muted-foreground" />
                    <span className="text-sm text-foreground">{item.text}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {(education.length > 0) && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Education from your care team</h3>
                </div>
                <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={() => setTab('education')}>
                  View more <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </div>
              <div className="space-y-3">
                {education.slice(0, 2).map((e) => (
                  <div key={e.id} className="bg-card border border-border rounded-xl p-4">
                    <p className="text-sm font-semibold text-foreground mb-1">{e.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{e.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Card className="border-primary/20 bg-secondary/30">
            <CardContent className="pt-5 pb-5 flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Questions for your care team?</p>
                <p className="text-xs text-muted-foreground mt-1">Reply to messages from your nurse or doctor.</p>
                <Link to="/dashboard/messages">
                  <Button size="sm" variant="outline" className="h-8 text-xs mt-3 gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Open Messages
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="mt-4 space-y-4">
          {careProgramComplete ? (
            <Card className="border-[hsl(142_63%_55%)] bg-[hsl(142_63%_97%)]">
              <CardContent className="pt-6 pb-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-[hsl(142_63%_35%)] mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground">First-year care program complete</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Your baby has passed 52 weeks. Continue routine paediatric care with your team.
                </p>
              </CardContent>
            </Card>
          ) : isPostpartum ? (
            <>
              <div className="flex gap-1.5 flex-wrap max-h-24 overflow-y-auto">
                {babyWeekAnchors.map((w) => (
                  <Button
                    key={w}
                    size="sm"
                    variant={educationBabyWeek === w ? 'default' : 'outline'}
                    className="h-7 text-xs px-2.5"
                    onClick={() => setEducationBabyWeek(w)}
                  >
                    {w === 0 ? 'Newborn' : w === 52 ? '1 year' : `Wk ${w}`}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Baby age: week {babyWeeks} of 52 — newborn education through baby&apos;s first year.
              </p>
            </>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {(['First', 'Second', 'Third'] as const).map((tri) => (
                <Button
                  key={tri}
                  size="sm"
                  variant={educationTrimester === tri ? 'default' : 'outline'}
                  className="h-8 text-xs"
                  onClick={() => {
                    setEducationTrimester(tri);
                    const triWeeks = getTrimesterWeeks(tri);
                    setEducationWeek(triWeeks.includes(weeks) ? weeks : triWeeks[0]);
                  }}
                >
                  {tri} trimester
                </Button>
              ))}
            </div>
          )}
          {!isPostpartum && (
            <div className="flex gap-1.5 flex-wrap max-h-24 overflow-y-auto">
              {trimesterWeeks.map((w) => (
                <Button
                  key={w}
                  size="sm"
                  variant={educationWeek === w ? 'default' : 'outline'}
                  className="h-7 text-xs px-2.5"
                  onClick={() => setEducationWeek(w)}
                >
                  Wk {w}
                </Button>
              ))}
            </div>
          )}
          {weekEducation && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{weekEducation.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{weekEducation.summary}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground mb-2">Tips for you</p>
                  <ul className="space-y-2">
                    {weekEducation.tips.map((tip) => (
                      <li key={tip} className="text-sm text-muted-foreground flex gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground mb-2">Nutrition focus</p>
                  <div className="flex flex-wrap gap-2">
                    {weekEducation.nutrition.map((n) => (
                      <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-destructive mb-2">When to call your team</p>
                  <ul className="space-y-1">
                    {weekEducation.warningSigns.map((w) => (
                      <li key={w} className="text-xs text-muted-foreground flex gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />{w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg bg-secondary/40 border border-primary/10 p-4">
                  <p className="text-xs font-semibold text-primary mb-2">For your care team</p>
                  <ul className="space-y-1">
                    {weekEducation.forCareTeam.map((t) => (
                      <li key={t} className="text-xs text-muted-foreground flex gap-2">
                        <Stethoscope className="w-3.5 h-3.5 text-primary shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4 space-y-4">
          {completedItems.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Completed tasks will appear here once you check them off.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Completed care tasks</CardTitle>
                <p className="text-xs text-muted-foreground">Uncheck any item to move it back to My Care · resets at midnight</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {completedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={saving}
                    onClick={() => handleToggleChecklistItem(item.id, item.done)}
                    className="flex items-center gap-3 w-full text-left disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[hsl(142_63%_35%)] shrink-0" />
                    <span className="text-sm line-through text-muted-foreground">{item.text}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="border-primary/15">
        <CardContent className="pt-5 pb-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Stethoscope className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Your care team</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nurse: {profile?.nurse ?? '—'} · Doctor: {profile?.doctor ?? '—'}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" asChild>
            <Link to="/dashboard/my-specialist">My Specialist</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="bg-[hsl(0_72%_96%)] border border-[hsl(0_72%_72%)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <p className="text-sm font-semibold text-destructive">When to seek immediate help</p>
        </div>
        <ul className="space-y-1 text-xs text-foreground">
          {(isPostpartum
            ? ['Heavy bleeding', 'Fever or foul-smelling discharge', 'Thoughts of harming yourself or baby']
            : ['Heavy bleeding', 'Severe headache or vision changes', 'No fetal movement for 12+ hours']
          ).map((t) => (
            <li key={t} className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-destructive mt-0.5" />{t}</li>
          ))}
        </ul>
      </div>

      <Dialog open={!!selectedAppt} onOpenChange={(open) => !open && setSelectedAppt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedAppt?.type ?? 'Appointment'}</DialogTitle>
          </DialogHeader>
          {selectedAppt && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {selectedAppt.date} · {selectedAppt.time} · {selectedAppt.clinician}
              </p>
              <p className="text-muted-foreground">{selectedAppt.location || 'Clinic visit'}</p>
              {selectedAppt.status === 'completed' && selectedAppt.clinicianConfirmed ? (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground mb-1">Visit notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedAppt.attendanceNote?.trim() ? selectedAppt.attendanceNote : 'empty'}
                  </p>
                  {selectedAppt.confirmedBy && (
                    <p className="text-[11px] text-muted-foreground mt-2">Confirmed by {selectedAppt.confirmedBy}</p>
                  )}
                </div>
              ) : selectedAppt.motherMarkedAttended && !selectedAppt.clinicianConfirmed ? (
                <p className="text-xs text-muted-foreground">You marked this visit as attended — awaiting clinician confirmation.</p>
              ) : (
                <p className="text-xs text-muted-foreground">No visit notes yet.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
