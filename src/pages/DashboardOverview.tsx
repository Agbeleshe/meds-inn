import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { useActivityLog } from '@/hooks/use-activity-log';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { MetricCardsSkeleton, TableSkeleton, ListItemsSkeleton } from '@/components/common/TableSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { ACTIVE_HOSPITAL } from '@/lib/hospitals';
import { MetricCard } from '@/components/common/MetricCard';
import { RiskBadge, AdherenceBadge } from '@/components/common/Badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Users, Activity, AlertTriangle, Calendar, AlertCircle,
  Baby, Pill, HeartPulse, ArrowRight, Sparkles, Bell, Stethoscope,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from 'recharts';

const TEAL = 'hsl(173, 79%, 24%)';
const GOLD = 'hsl(38, 53%, 47%)';
const RED = 'hsl(0, 72%, 50%)';

function greetingName(fullName: string) {
  const hour = new Date().getHours();
  const first = fullName.split(' ')[0];
  if (hour < 12) return `Good morning, ${first}`;
  if (hour < 17) return `Good afternoon, ${first}`;
  return `Good evening, ${first}`;
}

export default function DashboardOverview() {
  const { currentUser } = useApp();
  const {
    metrics,
    scope,
    assignedPatients,
    needFollowUp,
    upcomingAppointments,
    teamSnapshot,
    recentAlerts,
    source,
    loading,
    error,
    refetch,
  } = useDashboardMetrics();

  const isAdmin = scope === 'hospital';
  const { items: activityLog, loading: activityLoading } = useActivityLog(isAdmin ? 30 : 0);
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const adherenceChartData = assignedPatients.slice(0, 8).map((p) => ({
    name: p.name.split(' ')[0],
    medication: p.medicationAdherence,
    appointment: p.appointmentAdherence ?? metrics.appointmentAdherence,
    fullName: p.name,
  }));

  return (
    <div className="space-y-6">
      <div data-tour="overview-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{greetingName(currentUser.name)}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {today} · {ACTIVE_HOSPITAL.name}
            {!isAdmin && (
              <span className="ml-1.5 text-primary font-medium">· Your assigned patients</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceBadge source={source} loading={loading} />
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-primary/20">
            <HeartPulse className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Care Score</span>
            {loading ? (
              <Skeleton className="h-6 w-8" />
            ) : (
              <>
                <span className="text-lg font-bold text-primary">{metrics.careContinuityScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load dashboard: {error.message}
          <Button variant="link" className="h-auto p-0 ml-2 text-destructive" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <>
          <div data-tour="metric-cards" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCardsSkeleton count={5} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCardsSkeleton count={5} />
          </div>
        </>
      ) : isAdmin ? (
        <>
          <div data-tour="metric-cards" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="Enrolled Mothers" value={metrics.totalMothers} icon={<Users className="w-4 h-4" />} />
            <MetricCard label="Active Pregnancies" value={metrics.activePregnancies} icon={<Activity className="w-4 h-4" />} />
            <MetricCard label="High-Risk Cases" value={metrics.highRiskCases} highlight icon={<AlertTriangle className="w-4 h-4" />} />
            <MetricCard label="Today's Appointments" value={metrics.todayAppointments} icon={<Calendar className="w-4 h-4" />} />
            <MetricCard label="Needs Follow-up" value={metrics.missedFollowUps} icon={<AlertCircle className="w-4 h-4" />} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="Postpartum" value={metrics.postpartumMothers} icon={<Baby className="w-4 h-4" />} />
            <MetricCard label="Team Members" value={metrics.teamMembers} icon={<Stethoscope className="w-4 h-4" />} />
            <MetricCard label="Med Adherence" value={`${metrics.medicationAdherence}%`} icon={<Pill className="w-4 h-4" />} />
            <MetricCard label="Appt Attendance" value={`${metrics.appointmentAdherence}%`} icon={<Calendar className="w-4 h-4" />} />
            <MetricCard label="Care Score" value={metrics.careContinuityScore} highlight icon={<HeartPulse className="w-4 h-4" />} />
          </div>
        </>
      ) : (
        <>
          <div data-tour="metric-cards" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="Assigned Mothers" value={metrics.totalMothers} icon={<Users className="w-4 h-4" />} />
            <MetricCard label="Today's Appointments" value={metrics.todayAppointments} icon={<Calendar className="w-4 h-4" />} />
            <MetricCard label="Needs Follow-up" value={metrics.missedFollowUps} icon={<AlertCircle className="w-4 h-4" />} />
            <MetricCard label="High-Risk" value={metrics.highRiskCases} highlight icon={<AlertTriangle className="w-4 h-4" />} />
            <MetricCard label="Care Score" value={metrics.careContinuityScore} icon={<HeartPulse className="w-4 h-4" />} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="Med Adherence" value={`${metrics.medicationAdherence}%`} icon={<Pill className="w-4 h-4" />} />
            <MetricCard label="Appt Attendance" value={`${metrics.appointmentAdherence}%`} icon={<Calendar className="w-4 h-4" />} />
            <MetricCard label="Active Pregnancies" value={metrics.activePregnancies} icon={<Activity className="w-4 h-4" />} />
            <MetricCard label="Postpartum" value={metrics.postpartumMothers} icon={<Baby className="w-4 h-4" />} />
            <MetricCard label="Upcoming Visits" value={upcomingAppointments.length} icon={<Calendar className="w-4 h-4" />} />
          </div>
        </>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold">
                {isAdmin ? 'Mothers Who Need Attention' : 'Your Patients — Adherence'}
              </CardTitle>
              <Link to="/dashboard/mothers">
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                  View all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-border">
                      {['Patient', 'Stage', 'Risk', 'Med Adherence', 'Appt Attendance', 'Overall', ''].map((h) => (
                        <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableSkeleton rows={5} columns={7} showAvatar />
                    ) : (isAdmin ? needFollowUp : assignedPatients).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          {isAdmin
                            ? 'No mothers flagged for follow-up right now.'
                            : 'No patients assigned to you yet.'}
                        </td>
                      </tr>
                    ) : (
                      (isAdmin ? needFollowUp : assignedPatients).map((p) => (
                        <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="text-xs bg-secondary text-primary font-semibold">{p.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-foreground">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{p.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                            {p.gestationalWeek > 0 ? `Wk ${p.gestationalWeek}` : 'Postpartum'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap"><RiskBadge level={p.riskLevel} /></td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <AdherenceBadge value={p.medicationAdherence} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                            {p.appointmentAdherence != null ? `${p.appointmentAdherence}%` : '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap"><AdherenceBadge value={p.adherence} /></td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link to={`/dashboard/mothers/${p.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">View</Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {adherenceChartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {isAdmin ? 'Adherence by Patient' : 'Your Caseload — Medication Adherence'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={adherenceChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{ border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }}
                      formatter={(v: number, name: string) => [
                        `${v}%`,
                        name === 'medication' ? 'Medication' : 'Appointments',
                      ]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.fullName ?? ''
                      }
                    />
                    <Bar dataKey="medication" name="medication" radius={[4, 4, 0, 0]}>
                      {adherenceChartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.medication >= 80 ? TEAL : entry.medication >= 70 ? GOLD : RED}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card data-tour="alerts-panel">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Alerts</CardTitle>
              <Bell className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              {loading ? (
                <ListItemsSkeleton count={3} />
              ) : recentAlerts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No alerts right now.</p>
              ) : (
                recentAlerts.map((a, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                      a.severity === 'high' ? 'bg-destructive' :
                      a.severity === 'medium' ? 'bg-[hsl(38_92%_50%)]' : 'bg-[hsl(142_63%_35%)]'
                    }`} />
                    <div className="min-w-0 flex-1">
                      {a.patientId ? (
                        <Link to={`/dashboard/mothers/${a.patientId}`} className="text-xs font-semibold text-foreground hover:text-primary">
                          {a.patient}
                        </Link>
                      ) : (
                        <p className="text-xs font-semibold text-foreground">{a.patient}</p>
                      )}
                      <p className="text-xs text-muted-foreground text-pretty leading-relaxed mt-0.5">{a.note}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{a.time}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card data-tour="upcoming-appointments">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                {isAdmin ? 'Upcoming Appointments' : 'Your Upcoming Visits'}
              </CardTitle>
              <Link to="/dashboard/appointments">
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                  All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              {loading ? (
                <ListItemsSkeleton count={4} />
              ) : upcomingAppointments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No upcoming appointments.</p>
              ) : (
                upcomingAppointments.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{a.patient}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.type}</p>
                      <p className="text-xs text-muted-foreground/60">{a.date} · {a.time}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{a.location || 'Clinic'}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {isAdmin && teamSnapshot.length > 0 && (
            <Card data-tour="nurse-activity">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Care Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4">
                {teamSnapshot.map((member) => {
                  const name = String(member.name ?? 'Staff');
                  const initials = String(member.initials ?? name.slice(0, 2).toUpperCase());
                  const caseload = Number(member.caseload ?? member.mothers ?? 0);
                  const responded = Number(member.responded ?? caseload);
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-secondary text-primary font-semibold">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-foreground">{name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{String(member.role ?? '')}</span>
                      </div>
                      {caseload > 0 && (
                        <Progress value={Math.min(100, (responded / caseload) * 100)} className="h-1.5" />
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card data-tour="activity-log">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Activity Log</CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 max-h-72 overflow-y-auto">
                {activityLoading ? (
                  <ListItemsSkeleton count={4} />
                ) : activityLog.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No activity recorded yet.</p>
                ) : (
                  activityLog.map((entry) => (
                    <div key={entry.id} className="flex gap-3 items-start border-b border-border/50 last:border-0 pb-3 last:pb-0">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                        {entry.category === 'video-call' ? (
                          <Stethoscope className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground">{entry.action}</p>
                        <p className="text-xs text-muted-foreground text-pretty leading-relaxed mt-0.5">{entry.detail}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {entry.actorName} · {new Date(entry.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {!isAdmin && assignedPatients.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Caseload Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Patients on track (≥80%)</span>
                  <span className="font-medium text-foreground">
                    {assignedPatients.filter((p) => p.adherence >= 80).length} / {assignedPatients.length}
                  </span>
                </div>
                <Progress
                  value={
                    assignedPatients.length
                      ? (assignedPatients.filter((p) => p.adherence >= 80).length / assignedPatients.length) * 100
                      : 0
                  }
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Average medication adherence across your assigned mothers is {metrics.medicationAdherence}%.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-primary/20 bg-secondary/50">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-primary">
                {isAdmin ? 'Programme Snapshot' : 'Your Practice Snapshot'}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground text-pretty leading-relaxed mb-3">
                {loading ? 'Loading…' : isAdmin
                  ? `${metrics.totalMothers} mothers enrolled · ${metrics.highRiskCases} high-risk · ${metrics.missedFollowUps} need follow-up · ${metrics.medicationAdherence}% average medication adherence.`
                  : `You have ${metrics.totalMothers} assigned patient${metrics.totalMothers !== 1 ? 's' : ''} · ${metrics.todayAppointments} visit${metrics.todayAppointments !== 1 ? 's' : ''} today · ${metrics.medicationAdherence}% medication adherence across your caseload.`}
              </p>
              <Link to={isAdmin ? '/dashboard/analytics' : '/dashboard/medications'}>
                <Button size="sm" className="w-full h-8 text-xs gap-1">
                  {isAdmin ? 'View analytics' : 'Review medications'} <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
