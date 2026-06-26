import React, { useState } from 'react';
import { ANALYTICS_DATA, DASHBOARD_METRICS } from '@/lib/demo-data';
import { MetricCard } from '@/components/common/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import {
  Users, Activity, Calendar, Pill, Heart, Video, Baby, Syringe, Clock, BarChart3
} from 'lucide-react';

const TEAL = 'hsl(173, 79%, 24%)';
const GOLD = 'hsl(38, 53%, 47%)';
const BLUE = 'hsl(207, 85%, 45%)';
const GREEN = 'hsl(142, 63%, 35%)';
const RED = 'hsl(0, 72%, 50%)';

const RISK_DATA = [
  { name: 'Low Risk', value: 5, color: GREEN },
  { name: 'Moderate', value: 6, color: GOLD },
  { name: 'High Risk', value: 1, color: RED },
];

const APPOINTMENT_DATA = [
  { month: 'Jan', attended: 24, missed: 3 },
  { month: 'Feb', attended: 28, missed: 2 },
  { month: 'Mar', attended: 31, missed: 4 },
  { month: 'Apr', attended: 29, missed: 2 },
  { month: 'May', attended: 34, missed: 3 },
  { month: 'Jun', attended: 38, missed: 2 },
];

const NURSE_RESPONSE_DATA = [
  { week: 'Wk 1', avg: 5.2 },
  { week: 'Wk 2', avg: 4.8 },
  { week: 'Wk 3', avg: 3.9 },
  { week: 'Wk 4', avg: 3.7 },
  { week: 'Wk 5', avg: 3.4 },
  { week: 'Wk 6', avg: 3.2 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('6m');

  return (
    <div className="space-y-6">
      <div data-tour="analytics-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Elara Women's Specialist Clinic · Programme performance overview</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
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

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard label="Enrolled Mothers" value={DASHBOARD_METRICS.totalMothers} trend="up" trendValue="+5" icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Active Care Plans" value="10" trend="up" trendValue="+2" icon={<Activity className="w-4 h-4" />} />
        <MetricCard label="Missed Appt Rate" value="7.4%" trend="down" trendValue="-1.2%" icon={<Calendar className="w-4 h-4" />} />
        <MetricCard label="Med Adherence" value={`${DASHBOARD_METRICS.medicationAdherence}%`} trend="up" trendValue="+2%" icon={<Pill className="w-4 h-4" />} />
        <MetricCard label="Care Score" value={`${DASHBOARD_METRICS.careContinuityScore}`} trend="up" trendValue="+3pts" icon={<Heart className="w-4 h-4" />} highlight />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard label="Postpartum Follow-up" value="84%" trend="up" trendValue="+6%" icon={<Heart className="w-4 h-4" />} />
        <MetricCard label="Video Consult Rate" value="78%" trend="up" trendValue="+4%" icon={<Video className="w-4 h-4" />} />
        <MetricCard label="Avg Nurse Response" value={DASHBOARD_METRICS.avgNurseResponseTime} trend="down" trendValue="-0.8h" icon={<Clock className="w-4 h-4" />} />
        <MetricCard label="Vaccination Adherence" value={`${DASHBOARD_METRICS.vaccinationAdherence}%`} trend="up" trendValue="+3%" icon={<Syringe className="w-4 h-4" />} />
        <MetricCard label="High-Risk Cases" value={DASHBOARD_METRICS.highRiskCases} icon={<BarChart3 className="w-4 h-4" />} />
      </div>

      {/* Charts row 1 */}
      <div data-tour="analytics-charts" className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Adherence Trends — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ANALYTICS_DATA.adherenceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} formatter={(v: number, name: string) => [`${v}%`, name === 'medication' ? 'Medication' : name === 'appointment' ? 'Appointments' : 'Vaccination']} />
                <Legend layout="horizontal" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={(v: string) => v === 'medication' ? 'Medication' : v === 'appointment' ? 'Appointments' : 'Vaccination'} />
                <Line type="monotone" dataKey="medication" stroke={TEAL} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="appointment" stroke={GOLD} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="vaccination" stroke={BLUE} strokeWidth={2} dot={false} strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={RISK_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {RISK_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-2">
              {RISK_DATA.map(r => (
                <div key={r.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                  <span>{r.name} ({r.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Appointment Attendance — Monthly</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={APPOINTMENT_DATA} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} />
                <Legend layout="horizontal" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={(v: string) => v === 'attended' ? 'Attended' : 'Missed'} />
                <Bar dataKey="attended" fill={TEAL} radius={[3, 3, 0, 0]} />
                <Bar dataKey="missed" fill={RED} radius={[3, 3, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Avg Nurse Response Time (hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={NURSE_RESPONSE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 8]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} formatter={(v: number) => [`${v}h`, 'Avg response']} />
                <Line type="monotone" dataKey="avg" stroke={GOLD} strokeWidth={2.5} dot={{ r: 3, fill: GOLD }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2 text-center">Target: under 4 hours · Current: 3.2h avg</p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Patient Engagement Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-border">
                  {['Metric', 'This month', 'Last month', 'Change', 'Target'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { metric: 'Medication adherence', current: '87%', prev: '85%', change: '+2%', target: '90%', ok: true },
                  { metric: 'Appointment attendance', current: '92.6%', prev: '91.4%', change: '+1.2%', target: '95%', ok: true },
                  { metric: 'Nurse follow-up completion', current: '88%', prev: '84%', change: '+4%', target: '90%', ok: true },
                  { metric: 'Vaccination adherence', current: '91%', prev: '88%', change: '+3%', target: '95%', ok: true },
                  { metric: 'Postpartum check-in rate', current: '84%', prev: '78%', change: '+6%', target: '90%', ok: false },
                  { metric: 'Video consult completion', current: '78%', prev: '74%', change: '+4%', target: '85%', ok: false },
                ].map(row => (
                  <tr key={row.metric} className="border-b border-border last:border-0">
                    <td className="px-3 py-3 text-sm font-medium text-foreground whitespace-nowrap">{row.metric}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-foreground whitespace-nowrap">{row.current}</td>
                    <td className="px-3 py-3 text-sm text-muted-foreground whitespace-nowrap">{row.prev}</td>
                    <td className="px-3 py-3 text-sm font-medium text-[hsl(142_63%_30%)] whitespace-nowrap">{row.change}</td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">
                      <span className={row.ok ? 'text-[hsl(142_63%_30%)]' : 'text-[hsl(38_70%_35%)]'}>{row.target}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
