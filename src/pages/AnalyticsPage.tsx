import React, { useState } from 'react';
import { MetricCard } from '@/components/common/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import {
  Users, Activity, Calendar, Pill, Heart, MessageSquare, Clock, BarChart3, Loader2
} from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';
import type { AnalyticsRange } from '@/lib/api-client';

const TEAL = 'hsl(173, 79%, 24%)';
const GOLD = 'hsl(38, 53%, 47%)';
const BLUE = 'hsl(207, 85%, 45%)';

const DEFAULT_RISK = [
  { name: 'Low Risk', value: 0, color: 'hsl(142, 63%, 35%)' },
  { name: 'Moderate', value: 0, color: 'hsl(38, 53%, 47%)' },
  { name: 'High Risk', value: 0, color: 'hsl(0, 72%, 50%)' },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<AnalyticsRange>('6m');
  const { data, loading, error } = useAnalytics(dateRange);

  const { metrics, adherenceTrend, riskDistribution, appointmentAttendance, nurseResponseTrend, engagementRows } = data;
  const riskData = riskDistribution.length > 0 ? riskDistribution : DEFAULT_RISK;
  const avgResponse = metrics.avgNurseResponseHours;

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Failed to load analytics: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div data-tour="analytics-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Elara Women&apos;s Specialist Clinic · Programme performance overview</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as AnalyticsRange)}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Last month</SelectItem>
            <SelectItem value="3m">Last 3 months</SelectItem>
            <SelectItem value="6m">Last 6 months</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading analytics…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="Enrolled Mothers" value={metrics.enrolledMothers} icon={<Users className="w-4 h-4" />} />
            <MetricCard label="Active Care Plans" value={metrics.activeCarePlans} icon={<Activity className="w-4 h-4" />} />
            <MetricCard label="Missed Appt Rate" value={`${metrics.missedApptRate}%`} icon={<Calendar className="w-4 h-4" />} />
            <MetricCard label="Med Adherence" value={`${metrics.medicationAdherence}%`} icon={<Pill className="w-4 h-4" />} />
            <MetricCard label="Care Score" value={`${metrics.careContinuityScore}`} highlight icon={<Heart className="w-4 h-4" />} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="Postpartum Follow-up" value={`${metrics.postpartumFollowUp}%`} icon={<Heart className="w-4 h-4" />} />
            <MetricCard label="Message Response Rate" value={`${metrics.messageResponseRate}%`} icon={<MessageSquare className="w-4 h-4" />} />
            <MetricCard label="Avg Nurse Response" value={avgResponse != null ? `${avgResponse}h` : '—'} icon={<Clock className="w-4 h-4" />} />
            <MetricCard
              label="Checklist Adherence"
              value={metrics.checklistAdherence != null ? `${metrics.checklistAdherence}%` : '—'}
              icon={<Activity className="w-4 h-4" />}
            />
            <MetricCard label="High-Risk Cases" value={metrics.highRiskCases} icon={<BarChart3 className="w-4 h-4" />} />
          </div>

          <div data-tour="analytics-charts" className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Adherence Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {adherenceTrend.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-16 text-center">No trend data for this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={adherenceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} formatter={(v: number, name: string) => [`${v}%`, name === 'medication' ? 'Medication' : name === 'appointment' ? 'Appointments' : 'Checklist']} />
                      <Legend layout="horizontal" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={(v: string) => v === 'medication' ? 'Medication' : v === 'appointment' ? 'Appointments' : 'Checklist'} />
                      <Line type="monotone" dataKey="medication" stroke={TEAL} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="appointment" stroke={GOLD} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="checklist" stroke={BLUE} strokeWidth={2} dot={false} strokeDasharray="2 2" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {riskData.every((r) => r.value === 0) ? (
                  <p className="text-sm text-muted-foreground py-16 text-center">No patients in scope.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={riskData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                          {riskData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 justify-center mt-2 flex-wrap">
                      {riskData.map(r => (
                        <div key={r.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                          <span>{r.name} ({r.value})</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Appointment Attendance — Monthly</CardTitle>
              </CardHeader>
              <CardContent>
                {appointmentAttendance.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">No appointment data.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={appointmentAttendance} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} />
                      <Legend layout="horizontal" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={(v: string) => v === 'attended' ? 'Attended' : 'Missed'} />
                      <Bar dataKey="attended" fill={TEAL} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="missed" fill="hsl(0, 72%, 50%)" radius={[3, 3, 0, 0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Avg Nurse Response Time (hours)</CardTitle>
              </CardHeader>
              <CardContent>
                {nurseResponseTrend.every((w) => w.avg == null) ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">No messaging response data yet.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={nurseResponseTrend.filter((w) => w.avg != null)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} formatter={(v: number) => [`${v}h`, 'Avg response']} />
                        <Line type="monotone" dataKey="avg" stroke={GOLD} strokeWidth={2.5} dot={{ r: 3, fill: GOLD }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Target: under 4 hours
                      {avgResponse != null ? ` · Current: ${avgResponse}h avg` : ''}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Patient Engagement Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {engagementRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No engagement metrics available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="border-b border-border">
                        {['Metric', 'Current', 'Target', 'Status'].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {engagementRows.map(row => (
                        <tr key={row.metric} className="border-b border-border last:border-0">
                          <td className="px-3 py-3 text-sm font-medium text-foreground whitespace-nowrap">{row.metric}</td>
                          <td className="px-3 py-3 text-sm font-semibold text-foreground whitespace-nowrap">{row.current}</td>
                          <td className="px-3 py-3 text-xs whitespace-nowrap text-muted-foreground">{row.target}</td>
                          <td className="px-3 py-3 text-xs whitespace-nowrap">
                            <span className={row.ok ? 'text-[hsl(142_63%_30%)]' : 'text-[hsl(38_70%_35%)]'}>
                              {row.ok ? 'On target' : 'Below target'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
