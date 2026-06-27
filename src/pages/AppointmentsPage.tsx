import React, { useState } from 'react';
import { useAppointments } from '@/hooks/use-appointments';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Calendar, Video, MapPin, Clock, Plus, Filter,
  CheckCircle2, XCircle, AlertCircle, RotateCcw, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

type View = 'list' | 'calendar';
type StatusFilter = 'all' | 'scheduled' | 'completed' | 'missed';

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-secondary text-primary border-primary/20' },
  completed: { label: 'Completed', color: 'bg-[hsl(142_63%_90%)] text-[hsl(142_63%_25%)] border-[hsl(142_63%_60%)]' },
  missed: { label: 'Missed', color: 'bg-[hsl(0_72%_92%)] text-[hsl(0_72%_36%)] border-[hsl(0_72%_70%)]' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground border-border' },
};

const JUNE_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

export default function AppointmentsPage() {
  const { appointments: allAppointments, source, loading } = useAppointments();
  const APPOINTMENTS = allAppointments;
  const APPT_DATES = new Set(APPOINTMENTS.map(a => parseInt(a.date.split('-')[2])));
  const HIGH_RISK_DATES = new Set([27, 28]);
  const [view, setView] = useState<View>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const filtered = APPOINTMENTS.filter(a =>
    statusFilter === 'all' || a.status === statusFilter
  );
  const calendarAppts = selectedDate
    ? APPOINTMENTS.filter(a => parseInt(a.date.split('-')[2]) === selectedDate)
    : [];

  function handleAction(action: string, patient: string) {
    const msgs: Record<string, string> = {
      attended: `${patient} marked as attended.`,
      reschedule: `Reschedule dialog opened for ${patient}.`,
      reminder: `Reminder sent to ${patient}.`,
      outcome: `Outcome note form opened for ${patient}.`,
      start: `Starting consultation with ${patient}…`,
    };
    toast.success(msgs[action] ?? 'Action triggered');
  }

  return (
    <div className="space-y-6">
      <div data-tour="appointments-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Appointments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Schedule, track, and follow up on all patient appointments.</p>
        </div>
        <DataSourceBadge source={source} loading={loading} />
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={v => setView(v as View)}>
            <TabsList className="h-9">
              <TabsTrigger value="list" className="text-xs px-3">List</TabsTrigger>
              <TabsTrigger value="calendar" className="text-xs px-3">Calendar</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => toast.success('Opening booking form')}>
            <Plus className="w-3.5 h-3.5" /> Book Appointment
          </Button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'scheduled', 'completed', 'missed'] as StatusFilter[]).map(s => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs capitalize"
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
            {s !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                {APPOINTMENTS.filter(a => a.status === s).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {view === 'calendar' ? (
        <div data-tour="appointments-calendar" className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">June 2026</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Offset for June 1 = Monday */}
                  {JUNE_DAYS.map(day => {
                    const hasAppt = APPT_DATES.has(day);
                    const isToday = day === 25;
                    const isSelected = selectedDate === day;
                    const isHighRisk = HIGH_RISK_DATES.has(day);
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(isSelected ? null : day)}
                        className={cn(
                          'relative h-9 w-full rounded-md text-sm transition-colors',
                          isToday ? 'bg-primary text-primary-foreground font-bold' :
                          isSelected ? 'bg-secondary text-primary font-semibold' :
                          'hover:bg-muted text-foreground',
                        )}
                      >
                        {day}
                        {hasAppt && !isToday && (
                          <span className={cn(
                            'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                            isHighRisk ? 'bg-destructive' : 'bg-primary'
                          )} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Selected day appointments */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  {selectedDate ? `June ${selectedDate} Appointments` : 'Select a date'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {calendarAppts.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    {selectedDate ? 'No appointments on this date.' : 'Click a date to see appointments.'}
                  </p>
                ) : (
                  calendarAppts.map(a => (
                    <div key={a.id} className="p-3 rounded-lg border border-border">
                      <p className="text-xs font-semibold text-foreground">{a.patient}</p>
                      <p className="text-xs text-muted-foreground">{a.type}</p>
                      <p className="text-xs text-muted-foreground">{a.time} · {a.clinician}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{a.mode === 'virtual' ? 'Video' : 'In-person'}</Badge>
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', STATUS_CONFIG[a.status].color)}>
                          {STATUS_CONFIG[a.status].label}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Patient', 'Type', 'Date & Time', 'Clinician', 'Mode', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={7} columns={7} />
                ) : filtered.map(a => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-medium text-foreground">{a.patient}</p>
                      <p className="text-xs text-muted-foreground">{a.reason.slice(0, 40)}…</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-foreground">{a.type}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-xs font-medium text-foreground">{a.date}</p>
                      <p className="text-xs text-muted-foreground">{a.time} · {a.duration}min</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">{a.clinician}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {a.mode === 'virtual' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {a.mode === 'virtual' ? 'Video' : 'In-person'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', STATUS_CONFIG[a.status].color)}>
                        {STATUS_CONFIG[a.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {a.status === 'scheduled' && (
                          <>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAction('attended', a.patient)}>Attended</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAction('reminder', a.patient)}>Remind</Button>
                            {a.mode === 'virtual' && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAction('start', a.patient)}>Start</Button>
                            )}
                          </>
                        )}
                        {a.status === 'missed' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAction('reschedule', a.patient)}>Reschedule</Button>
                        )}
                        {a.status === 'completed' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAction('outcome', a.patient)}>View note</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No appointments match your filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
