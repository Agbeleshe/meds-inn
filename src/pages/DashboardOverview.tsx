import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { MetricCardsSkeleton, TableSkeleton, ListItemsSkeleton } from '@/components/common/TableSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { ACTIVE_HOSPITAL } from '@/lib/hospitals';
import { MetricCard } from '@/components/common/MetricCard';
import { RiskBadge, AdherenceBadge, StatusDot } from '@/components/common/Badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Users, Activity, AlertTriangle, Calendar, AlertCircle,
  Baby, Syringe, Clock, Pill, HeartPulse, ArrowRight, Sparkles, Bell
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { ANALYTICS_DATA } from '@/lib/demo-data';

const ALERTS = [
  { patient: 'Kemi Adewale', note: 'Blood pressure elevated at last visit. Appointment scheduled tomorrow.', severity: 'high', time: '2h ago' },
  { patient: 'Adaobi Eze', note: 'Missed appointment on June 14. Follow-up call not yet completed.', severity: 'medium', time: '3 days ago' },
  { patient: 'Blessing Okoro', note: 'Missed 2 consecutive check-ins. Medication adherence dropped to 70%.', severity: 'medium', time: '5 days ago' },
  { patient: 'Sarah Ibrahim', note: 'Gestational diabetes monitoring — glucose review pending.', severity: 'low', time: '1 day ago' },
];

const NURSE_ACTIVITY = [
  { name: 'Esther Okonkwo', role: 'Senior Midwife', mothers: 14, responded: 12, initials: 'EO' },
  { name: 'Mariam Sule', role: 'Maternal Care Nurse', mothers: 11, responded: 11, initials: 'MS' },
  { name: 'Linda James', role: 'Postpartum Care', mothers: 9, responded: 7, initials: 'LJ' },
];

export default function DashboardOverview() {
  const { currentUser } = useApp();
  const { metrics, needFollowUp, upcomingAppointments, teamSnapshot, source, loading } = useDashboardMetrics();
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div data-tour="overview-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Good morning, {currentUser.name.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today} · {ACTIVE_HOSPITAL.name}</p>
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

      {/* Metric cards */}
      {loading ? (
        <>
          <div data-tour="metric-cards" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCardsSkeleton count={5} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCardsSkeleton count={5} />
          </div>
        </>
      ) : (
        <>
          <div data-tour="metric-cards" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="Enrolled Mothers" value={metrics.totalMothers} trend="up" trendValue="+5 this month" icon={<Users className="w-4 h-4" />} />
            <MetricCard label="Active Pregnancies" value={metrics.activePregnancies} icon={<Activity className="w-4 h-4" />} />
            <MetricCard label="High-Risk Cases" value={metrics.highRiskCases} highlight icon={<AlertTriangle className="w-4 h-4" />} />
            <MetricCard label="Today's Appointments" value={metrics.todayAppointments} icon={<Calendar className="w-4 h-4" />} />
            <MetricCard label="Missed Follow-ups" value={metrics.missedFollowUps} trend="down" trendValue="-2 this week" icon={<AlertCircle className="w-4 h-4" />} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="Postpartum Mothers" value={metrics.postpartumMothers} icon={<HeartPulse className="w-4 h-4" />} />
            <MetricCard label="Team members" value={metrics.teamMembers} icon={<Baby className="w-4 h-4" />} />
            <MetricCard label="Vaccination Adherence" value="92%" trend="up" trendValue="+3%" icon={<Syringe className="w-4 h-4" />} />
            <MetricCard label="Avg Nurse Response" value="2.4h" icon={<Clock className="w-4 h-4" />} />
            <MetricCard label="Medication Adherence" value={`${metrics.medicationAdherence}%`} trend="up" trendValue="+2%" icon={<Pill className="w-4 h-4" />} />
          </div>
        </>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mothers needing follow-up */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold">Mothers Who Need Attention</CardTitle>
              <Link to="/dashboard/mothers">
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">View all <ArrowRight className="w-3 h-3" /></Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-border">
                      {['Patient', 'Stage', 'Risk', 'Last Check-in', 'Adherence', ''].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableSkeleton rows={5} columns={6} showAvatar />
                    ) : needFollowUp.map(p => (
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
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">{p.lastCheckIn}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><AdherenceBadge value={p.adherence} /></td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link to={`/dashboard/mothers/${p.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {!loading && needFollowUp.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No mothers need follow-up right now.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Adherence trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Adherence Trends — Last 6 Months</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={ANALYTICS_DATA.adherenceTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }}
                    formatter={(v: number, name: string) => [`${v}%`, name === 'medication' ? 'Medication' : 'Appointment']}
                  />
                  <Line type="monotone" dataKey="medication" stroke="hsl(173 79% 24%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="appointment" stroke="hsl(38 53% 47%)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-5 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-primary" /><span className="text-xs text-muted-foreground">Medication</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-accent" /><span className="text-xs text-muted-foreground">Appointment</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Alerts */}
          <Card data-tour="alerts-panel">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Alerts</CardTitle>
              <Bell className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              {ALERTS.map((a, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${a.severity === 'high' ? 'bg-destructive' : a.severity === 'medium' ? 'bg-[hsl(38_92%_50%)]' : 'bg-[hsl(142_63%_35%)]'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{a.patient}</p>
                    <p className="text-xs text-muted-foreground text-pretty leading-relaxed mt-0.5">{a.note}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{a.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming appointments */}
          <Card data-tour="upcoming-appointments">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Upcoming Consultations</CardTitle>
              <Link to="/dashboard/appointments">
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">All <ArrowRight className="w-3 h-3" /></Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              {loading ? (
                <ListItemsSkeleton count={4} />
              ) : upcomingAppointments.map(a => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{a.patient}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.type}</p>
                    <p className="text-xs text-muted-foreground/60">{a.date} · {a.time}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{a.mode === 'virtual' ? 'Video' : 'In-person'}</Badge>
                </div>
              ))}
              {!loading && upcomingAppointments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No upcoming consultations.</p>
              )}
            </CardContent>
          </Card>

          {/* Nurse activity */}
          <Card data-tour="nurse-activity">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Nurse Activity Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              {NURSE_ACTIVITY.map(n => (
                <div key={n.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-secondary text-primary font-semibold">{n.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-foreground">{n.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{n.responded}/{n.mothers} responded</span>
                  </div>
                  <Progress value={(n.responded / n.mothers) * 100} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Summary */}
          <Card className="border-primary/20 bg-secondary/50">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-primary">AI Operations Summary</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground text-pretty leading-relaxed mb-3">
                5 mothers have not been contacted in over 7 days. 9 AI care briefs are ready for clinician review. Kemi Adewale and Sarah Ibrahim are flagged as high priority before tomorrow's appointments.
              </p>
              <Link to="/dashboard/ai-briefs">
                <Button size="sm" className="w-full h-8 text-xs gap-1">
                  Review care briefs <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
