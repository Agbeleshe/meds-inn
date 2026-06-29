import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppointments } from '@/hooks/use-appointments';
import { useAuth } from '@/contexts/AuthContext';
import type { Appointment } from '@/types/clinical';
import { PatientSearchCombobox } from '@/components/clinical/PatientSearchCombobox';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  MapPin, Plus, ChevronLeft, ChevronRight, Calendar, CalendarClock, Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sortAppointmentsByRecent } from '@/lib/appointment-sort';

const MOTHER_EMPTY_APPOINTMENTS =
  'Sorry, no appointments scheduled for you yet. When there is one, you will be notified.';

type View = 'list' | 'calendar';
type StatusFilter = 'all' | 'scheduled' | 'completed' | 'missed';

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-secondary text-primary border-primary/20' },
  completed: { label: 'Completed', color: 'bg-[hsl(142_63%_90%)] text-[hsl(142_63%_25%)] border-[hsl(142_63%_60%)]' },
  missed: { label: 'Missed', color: 'bg-[hsl(0_72%_92%)] text-[hsl(0_72%_36%)] border-[hsl(0_72%_70%)]' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground border-border' },
};

const RESCHEDULED_TAG = {
  label: 'Rescheduled',
  color: 'bg-[hsl(38_92%_90%)] text-[hsl(38_92%_28%)] border-[hsl(38_92%_55%)]',
};

function AppointmentStatusBadges({ appointment }: { appointment: Appointment }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        STATUS_CONFIG[appointment.status].color,
      )}>
        {STATUS_CONFIG[appointment.status].label}
      </span>
      {appointment.rescheduled && (
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
          RESCHEDULED_TAG.color,
        )}>
          {RESCHEDULED_TAG.label}
        </span>
      )}
    </div>
  );
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { offset, daysInMonth };
}

function toTimeInputValue(time: string): string {
  const raw = time.trim();
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '09:00';
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const isPm = match[3].toUpperCase() === 'PM';
  if (isPm && hour !== 12) hour += 12;
  if (!isPm && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusAppointmentId = searchParams.get('appointmentId');
  const prefillPatientId = searchParams.get('patientId');
  const openBook = searchParams.get('book') === '1';
  const {
    appointments,
    source,
    loading,
    syncing,
    error,
    bookAppointment,
    rescheduleAppointment,
    markAttended,
    confirmAttendance,
    canBook,
    mothers,
    refetch,
  } = useAppointments();

  const today = new Date();
  const [view, setView] = useState<View>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '09:00' });
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Appointment | null>(null);
  const [attendanceNote, setAttendanceNote] = useState('');
  const [motherNoteAppt, setMotherNoteAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState({
    patientId: '',
    date: '',
    time: '09:00',
    type: 'Check-up',
    reason: '',
    duration: '30',
    location: 'Clinic',
    mode: 'in-person',
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [listPatientFilter, setListPatientFilter] = useState('');

  useEffect(() => {
    if (!canBook || !prefillPatientId) return;
    const mother = mothers.find((m) => m.id === prefillPatientId);
    setForm((f) => ({ ...f, patientId: prefillPatientId }));
    setListPatientFilter(prefillPatientId);
    if (mother) setPatientSearch(mother.name);
    if (openBook) setFormOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('book');
    setSearchParams(next, { replace: true });
  }, [prefillPatientId, openBook, canBook, mothers, searchParams, setSearchParams]);

  const filtered = useMemo(
    () => {
      let items = appointments.filter(
        (a) => statusFilter === 'all' || a.status === statusFilter,
      );
      if (listPatientFilter && user?.role !== 'mother') {
        items = items.filter((a) => a.patientId === listPatientFilter);
      } else if (patientSearch.trim() && user?.role !== 'mother') {
        const q = patientSearch.trim().toLowerCase();
        items = items.filter(
          (a) =>
            a.patient.toLowerCase().includes(q) ||
            a.patientId?.toLowerCase().includes(q),
        );
      }
      return sortAppointmentsByRecent(items);
    },
    [appointments, statusFilter, patientSearch, listPatientFilter, user?.role],
  );

  const dateKey = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const apptDates = useMemo(
    () => new Set(appointments.map((a) => a.date)),
    [appointments],
  );

  const missedDates = useMemo(
    () => new Set(appointments.filter((a) => a.status === 'missed').map((a) => a.date)),
    [appointments],
  );

  const calendarAppts = useMemo(
    () =>
      selectedDate
        ? sortAppointmentsByRecent(appointments.filter((a) => a.date === selectedDate))
        : [],
    [appointments, selectedDate],
  );

  const { offset, daysInMonth } = getCalendarDays(calYear, calMonth);
  const todayStr = today.toISOString().slice(0, 10);

  const isMotherWithNoAppointments =
    user?.role === 'mother' && !loading && !syncing && appointments.length === 0;

  function isVideoAppointment(a: Appointment) {
    return a.mode === 'virtual' || a.mode === 'video';
  }

  function canJoinVideo(a: Appointment) {
    return isVideoAppointment(a) && a.status === 'scheduled';
  }

  function isInPerson(a: Appointment) {
    return !isVideoAppointment(a);
  }

  function canMarkAttended(a: Appointment) {
    return (
      user?.role === 'mother' &&
      isInPerson(a) &&
      a.date <= todayStr &&
      a.status !== 'completed' &&
      a.status !== 'cancelled' &&
      !a.motherMarkedAttended
    );
  }

  function canConfirmAttendance(a: Appointment) {
    return (
      user?.role !== 'mother' &&
      isInPerson(a) &&
      (a.motherMarkedAttended || a.status === 'scheduled' || a.status === 'missed') &&
      a.status !== 'completed' &&
      a.status !== 'cancelled'
    );
  }

  function openConfirmAttendance(a: Appointment) {
    setConfirmTarget(a);
    setAttendanceNote(a.attendanceNote ?? '');
    setConfirmOpen(true);
  }

  async function handleMarkAttended(a: Appointment) {
    setSubmitting(true);
    try {
      await markAttended(a.id);
      toast.success('Marked as attended — your clinician will confirm the visit.');
      refetch();
    } catch (err) {
      toast.error((err as Error).message || 'Could not mark attendance');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmAttendance() {
    if (!confirmTarget) return;
    setSubmitting(true);
    try {
      await confirmAttendance(confirmTarget.id, attendanceNote);
      toast.success('Attendance confirmed and visit notes saved.');
      setConfirmOpen(false);
      setConfirmTarget(null);
      refetch();
    } catch (err) {
      toast.error((err as Error).message || 'Could not confirm attendance');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!focusAppointmentId || loading) return;
    setView('list');
    const el = document.getElementById(`appointment-row-${focusAppointmentId}`);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [focusAppointmentId, loading, appointments]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patientId || !form.date || !form.time) {
      toast.error('Please select a patient, date, and time.');
      return;
    }
    setSubmitting(true);
    try {
      await bookAppointment({
        patientId: form.patientId,
        date: form.date,
        time: form.time,
        type: form.type,
        reason: form.reason || form.type,
        duration: Number(form.duration),
        location: form.mode === 'virtual' ? 'Video call' : form.location,
        mode: form.mode === 'virtual' ? 'virtual' : form.mode,
      });
      toast.success(
        form.mode === 'virtual'
          ? 'Video appointment booked — patient and specialist will be notified.'
          : 'Appointment booked — the mother will be notified.',
      );
      setFormOpen(false);
      setForm((f) => ({ ...f, reason: '', date: '', time: '09:00' }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  }

  function openReschedule(appointment: Appointment) {
    setRescheduleTarget(appointment);
    setRescheduleForm({ date: appointment.date, time: toTimeInputValue(appointment.time) });
    setRescheduleOpen(true);
  }

  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (!rescheduleTarget || !rescheduleForm.date || !rescheduleForm.time) {
      toast.error('Please choose a new date and time.');
      return;
    }
    setSubmitting(true);
    try {
      await rescheduleAppointment(
        rescheduleTarget.id,
        rescheduleForm.date,
        rescheduleForm.time,
      );
      toast.success('Appointment rescheduled — the mother will be notified.');
      setRescheduleOpen(false);
      setRescheduleTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reschedule appointment');
    } finally {
      setSubmitting(false);
    }
  }

  function canReschedule(appointment: Appointment) {
    return canBook && (appointment.status === 'scheduled' || appointment.status === 'missed');
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  }

  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  }

  return (
    <div className="space-y-6">
      <div data-tour="appointments-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {user?.role === 'mother' ? 'My Appointments' : 'Appointments'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user?.role === 'mother'
              ? 'View upcoming and past appointments with your care team.'
              : 'Schedule and track appointments for your assigned mothers.'}
          </p>
        </div>
        <DataSourceBadge source={source} loading={loading} error={error} />
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList className="h-9">
              <TabsTrigger value="list" className="text-xs px-3">List</TabsTrigger>
              <TabsTrigger value="calendar" className="text-xs px-3">Calendar</TabsTrigger>
            </TabsList>
          </Tabs>
          {canBook && (
            <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => setFormOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Book Appointment
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load appointments: {error.message}
          <Button variant="link" className="h-auto p-0 ml-2 text-destructive" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isMotherWithNoAppointments && user?.role !== 'mother' && mothers.length > 0 && (
        <div className="max-w-sm">
          <Label className="text-xs text-muted-foreground mb-1 block">Search by patient name</Label>
          <PatientSearchCombobox
            patients={mothers.map((m) => ({ id: m.id, name: m.name }))}
            value={listPatientFilter}
            onChange={(id) => {
              setListPatientFilter(id);
              const name = mothers.find((m) => m.id === id)?.name ?? '';
              setPatientSearch(name);
            }}
            placeholder="Search by patient name…"
          />
        </div>
      )}

      {!isMotherWithNoAppointments && (
      <div className="flex gap-2 flex-wrap">
        {(['all', 'scheduled', 'completed', 'missed'] as StatusFilter[]).map((s) => (
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
                {appointments.filter((a) => a.status === s).length}
              </span>
            )}
          </Button>
        ))}
      </div>
      )}

      {isMotherWithNoAppointments ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {MOTHER_EMPTY_APPOINTMENTS}
            </p>
          </CardContent>
        </Card>
      ) : view === 'calendar' ? (
        <div data-tour="appointments-calendar" className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  {MONTH_NAMES[calMonth]} {calYear}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: offset }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-9" />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const dk = dateKey(calYear, calMonth, day);
                    const hasAppt = apptDates.has(dk);
                    const isToday = dk === todayStr;
                    const isSelected = selectedDate === dk;
                    const isMissed = missedDates.has(dk);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDate(isSelected ? null : dk)}
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
                            isMissed ? 'bg-destructive' : 'bg-primary',
                          )} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  {selectedDate ? `${selectedDate} Appointments` : 'Select a date'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {calendarAppts.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    {selectedDate ? 'No appointments on this date.' : 'Click a date to see appointments.'}
                  </p>
                ) : (
                  calendarAppts.map((a) => (
                    <div key={a.id} className="p-3 rounded-lg border border-border">
                      <p className="text-xs font-semibold text-foreground">{a.patient}</p>
                      <p className="text-xs text-muted-foreground">{a.type}</p>
                      <p className="text-xs text-muted-foreground">{a.time} · {a.clinician}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <AppointmentStatusBadges appointment={a} />
                        {canReschedule(a) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => openReschedule(a)}
                          >
                            <CalendarClock className="w-3 h-3" />
                            Reschedule
                          </Button>
                        )}
                        {canJoinVideo(a) && (
                          <Button variant="default" size="sm" className="h-7 text-xs gap-1" asChild>
                            <Link to={`/dashboard/video/${a.id}`}>
                              <Video className="w-3 h-3" />
                              Join video
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {(user?.role === 'mother'
                    ? ['Type', 'Date & Time', 'Clinician', 'Location', 'Status', '']
                    : ['Patient', 'Type', 'Date & Time', 'Clinician', 'Location', 'Status', '']
                  ).map((h, i) => (
                    <th key={h || `col-${i}`} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={5} columns={user?.role === 'mother' ? 6 : 7} />
                ) : filtered.map((a) => (
                  <tr
                    key={a.id}
                    id={`appointment-row-${a.id}`}
                    className={cn(
                      'border-b border-border last:border-0 hover:bg-muted/20 transition-colors',
                      focusAppointmentId === a.id && 'bg-secondary/40 ring-2 ring-inset ring-primary/30',
                    )}
                  >
                    {user?.role !== 'mother' && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-sm font-medium text-foreground">{a.patient}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{a.reason}</p>
                      </td>
                    )}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-foreground">{a.type}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-xs font-medium text-foreground">{a.date}</p>
                      <p className="text-xs text-muted-foreground">{a.time} · {a.duration}min</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">{a.clinician}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {isVideoAppointment(a) ? (
                          <Video className="w-3 h-3 text-primary" />
                        ) : (
                          <MapPin className="w-3 h-3" />
                        )}
                        {a.location || (isVideoAppointment(a) ? 'Video call' : 'Clinic')}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <AppointmentStatusBadges appointment={a} />
                    </td>
                    {user?.role !== 'mother' && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {canReschedule(a) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              onClick={() => openReschedule(a)}
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                              Reschedule
                            </Button>
                          )}
                          {canJoinVideo(a) && (
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                              <Link to={`/dashboard/video/${a.id}`}>
                                <Video className="w-3.5 h-3.5" />
                                Join
                              </Link>
                            </Button>
                          )}
                          {canConfirmAttendance(a) && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 text-xs"
                              disabled={submitting}
                              onClick={() => openConfirmAttendance(a)}
                            >
                              Confirm attendance
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                    {user?.role === 'mother' && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 flex-wrap">
                          {canJoinVideo(a) && (
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                              <Link to={`/dashboard/video/${a.id}`}>
                                <Video className="w-3.5 h-3.5" />
                                Join video call
                              </Link>
                            </Button>
                          )}
                          {canMarkAttended(a) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              disabled={submitting}
                              onClick={() => handleMarkAttended(a)}
                            >
                              Mark attended
                            </Button>
                          )}
                          {a.motherMarkedAttended && !a.clinicianConfirmed && (
                            <span className="text-[10px] text-muted-foreground">Awaiting confirmation</span>
                          )}
                          {(a.status === 'completed' || a.motherMarkedAttended) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => setMotherNoteAppt(a)}
                            >
                              View notes
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={user?.role === 'mother' ? 6 : 7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      {user?.role === 'mother' && appointments.length === 0
                        ? MOTHER_EMPTY_APPOINTMENTS
                        : appointments.length === 0
                          ? 'No appointments yet. Book one for an assigned mother.'
                          : 'No appointments match your filter.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBook} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Mother</Label>
              <PatientSearchCombobox
                id="patient"
                patients={mothers.map((m) => ({ id: m.id, name: m.name }))}
                value={form.patientId}
                onChange={(id) => setForm((f) => ({ ...f, patientId: id }))}
                placeholder="Search patient name…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Appointment type</Label>
              <Input
                id="type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="e.g. Antenatal check-up"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Notes / reason</Label>
              <Textarea
                id="reason"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  step={15}
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mode">Visit mode</Label>
                <Select
                  value={form.mode}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      mode: v,
                      location: v === 'virtual' ? 'Video call' : f.location === 'Video call' ? 'Clinic' : f.location,
                      type: v === 'virtual' && f.type === 'Check-up' ? 'Video consultation' : f.type,
                    }))
                  }
                >
                  <SelectTrigger id="mode"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">In-person</SelectItem>
                    <SelectItem value="virtual">Video call (free)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.mode !== 'virtual' && (
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
            )}
            {form.mode === 'virtual' && (
              <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/30 px-3 py-2">
                Free secure video via Jitsi Meet. Patient and specialist receive notifications and reminders before the call.
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Booking…' : 'Book appointment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
          </DialogHeader>
          {rescheduleTarget && (
            <p className="text-sm text-muted-foreground -mt-2">
              {rescheduleTarget.patient} · {rescheduleTarget.type}
            </p>
          )}
          <form onSubmit={handleReschedule} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="reschedule-date">New date</Label>
                <Input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule-time">New time</Label>
                <Input
                  id="reschedule-time"
                  type="time"
                  value={rescheduleForm.time}
                  onChange={(e) => setRescheduleForm((f) => ({ ...f, time: e.target.value }))}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRescheduleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save new date'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm attendance</DialogTitle>
          </DialogHeader>
          {confirmTarget && (
            <p className="text-sm text-muted-foreground -mt-2">
              {confirmTarget.patient} · {confirmTarget.date} · {confirmTarget.type}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="attendance-note">Visit notes (optional)</Label>
            <Textarea
              id="attendance-note"
              value={attendanceNote}
              onChange={(e) => setAttendanceNote(e.target.value)}
              placeholder="Outcome, observations, follow-up instructions…"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button disabled={submitting} onClick={handleConfirmAttendance}>
              {submitting ? 'Saving…' : 'Confirm & save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!motherNoteAppt} onOpenChange={(open) => !open && setMotherNoteAppt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{motherNoteAppt?.type ?? 'Appointment notes'}</DialogTitle>
          </DialogHeader>
          {motherNoteAppt && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {motherNoteAppt.date} · {motherNoteAppt.time} · {motherNoteAppt.clinician}
              </p>
              {motherNoteAppt.clinicianConfirmed ? (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1">Visit notes</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {motherNoteAppt.attendanceNote?.trim() ? motherNoteAppt.attendanceNote : 'empty'}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Awaiting clinician confirmation.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
