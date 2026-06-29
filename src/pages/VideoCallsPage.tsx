import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/hooks/use-appointments';
import { useMyMotherProfile } from '@/hooks/use-mother';
import { useVideoRequests } from '@/hooks/use-video-requests';
import { useNavBadges } from '@/hooks/use-nav-badges';
import {
  submitVideoCallRequest,
  resolveVideoCallRequest,
} from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Video, Calendar, Clock, UserPlus } from 'lucide-react';
import type { Appointment } from '@/types/clinical';

function isVideoAppointment(a: Appointment) {
  return a.mode === 'virtual' || a.mode === 'video';
}

export default function VideoCallsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMother = user?.role === 'mother';
  const isClinical = user?.role === 'admin' || user?.role === 'nurse' || user?.role === 'doctor';

  const { appointments, loading: apptLoading, bookAppointment, canBook } = useAppointments();
  const { data: motherProfile, refetch: refetchMother } = useMyMotherProfile(user?.motherId);
  const { items: videoRequests, loading: requestsLoading, refetch: refetchRequests } = useVideoRequests(isClinical);
  const { refreshVideoRequests } = useNavBadges();

  const [requestNote, setRequestNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  const videoAppointments = useMemo(
    () =>
      appointments
        .filter((a) => isVideoAppointment(a) && a.status === 'scheduled')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [appointments],
  );

  const completedVideoAppointments = useMemo(
    () =>
      appointments
        .filter((a) => isVideoAppointment(a) && a.status === 'completed')
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8),
    [appointments],
  );

  const pendingMotherRequest = motherProfile?.videoCallRequestStatus === 'pending';

  async function handleRequestVideo() {
    setSubmitting(true);
    try {
      await submitVideoCallRequest(requestNote.trim() || undefined);
      toast.success('Video call request sent — your specialist will schedule a time');
      setRequestNote('');
      refetchMother();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send request');
    } finally {
      setSubmitting(false);
    }
  }

  async function quickSchedule(request: { motherId: string; motherName: string }) {
    setSchedulingId(request.motherId);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const date = tomorrow.toISOString().slice(0, 10);
      await bookAppointment({
        patientId: request.motherId,
        date,
        time: '10:00',
        type: 'Video consultation',
        reason: request.note || 'Scheduled from video call request',
        duration: 30,
        location: 'Video call',
        mode: 'virtual',
      });
      await resolveVideoCallRequest(request.motherId, 'scheduled');
      toast.success(`Video call scheduled with ${request.motherName} — mother has been notified`);
      refetchRequests();
      refreshVideoRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not schedule');
    } finally {
      setSchedulingId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          Video Calls
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Free secure consultations — request a call or join an upcoming session.
        </p>
      </div>

      {isMother && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Request a video call</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingMotherRequest ? (
              <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <Clock className="w-4 h-4 shrink-0" />
                Your request is pending — your specialist will schedule a time soon.
              </div>
            ) : (
              <>
                <Textarea
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Optional note: what would you like to discuss?"
                  rows={2}
                  className="text-sm"
                />
                <Button
                  className="gap-1.5"
                  disabled={submitting}
                  onClick={handleRequestVideo}
                >
                  <Video className="w-4 h-4" />
                  {submitting ? 'Sending…' : 'Request video call'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {isClinical && (
        <Card className={videoRequests.length > 0 ? 'border-primary/30' : undefined}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold">Meeting requests</CardTitle>
            {videoRequests.length > 0 && (
              <Badge variant="default" className="text-[10px]">{videoRequests.length} pending</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {requestsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : videoRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No pending video meeting requests.</p>
            ) : (
              videoRequests.map((r) => (
                <div
                  key={r.motherId}
                  className="flex flex-col gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {r.motherName} would love to have a meeting with you
                    </p>
                    {r.note ? (
                      <p className="text-sm text-muted-foreground mt-2 italic">&ldquo;{r.note}&rdquo;</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      {r.requestedAt ? new Date(r.requestedAt).toLocaleString() : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1"
                      disabled={schedulingId === r.motherId}
                      onClick={() => quickSchedule(r)}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {schedulingId === r.motherId ? 'Scheduling…' : 'Schedule now'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() =>
                        navigate(
                          `/dashboard/appointments?patientId=${encodeURIComponent(r.motherId)}&book=1`,
                        )
                      }
                    >
                      Pick custom time
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Upcoming video calls</CardTitle>
          {canBook && (
            <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
              <Link to="/dashboard/appointments?book=1">Book video call</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {apptLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : videoAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No upcoming video calls.
              {isMother && !pendingMotherRequest && ' Request one above.'}
              {isClinical && ' Book one from Appointments or schedule a pending request.'}
            </p>
          ) : (
            videoAppointments.map((a) => (
              <div
                key={a.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{isMother ? a.clinician : a.patient}</p>
                    <Badge variant="outline" className="text-[10px]">Video</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.type} · {a.date} at {a.time}
                  </p>
                </div>
                <Button size="sm" className="h-8 text-xs gap-1.5 shrink-0" asChild>
                  <Link to={`/dashboard/video/${a.id}`}>
                    <Video className="w-3.5 h-3.5" />
                    Join call
                  </Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {completedVideoAppointments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Past video visits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedVideoAppointments.map((a) => (
              <div
                key={a.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border bg-muted/20"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{isMother ? a.clinician : a.patient}</p>
                    <Badge variant="outline" className="text-[10px]">Completed</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.type} · {a.date}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" asChild>
                  <Link to={`/dashboard/video/${a.id}`}>View notes</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isClinical && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <UserPlus className="w-3.5 h-3.5" />
          During a call you can invite another specialist from the join screen.
        </p>
      )}
    </div>
  );
}
