import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppointments } from '@/hooks/use-appointments';
import { useAuth } from '@/contexts/AuthContext';
import { useCareBrief } from '@/hooks/use-care-brief';
import { useMother } from '@/hooks/use-mother';
import { CareBriefPanel } from '@/components/clinical/CareBriefPanel';
import { VideoTermsDialog, useVideoTermsAccepted } from '@/components/video/VideoTermsGate';
import { VideoNoteTaker } from '@/components/video/VideoNoteTaker';
import { VideoSessionSummary } from '@/components/video/VideoSessionSummary';
import { completeVideoSession, fetchVideoSession } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useTeam } from '@/hooks/use-team';
import { ArrowLeft, Video, UserPlus, Copy, ExternalLink, UserCircle, PhoneOff } from 'lucide-react';
import type { VideoSessionNotes } from '@/types/clinical';

export default function VideoCallPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appointments, loading, refetch } = useAppointments();

  const appointment = useMemo(
    () => appointments.find((a) => a.id === appointmentId),
    [appointments, appointmentId],
  );

  const patientId = appointment?.patientId;
  const isClinical = user?.role === 'admin' || user?.role === 'nurse' || user?.role === 'doctor';
  const isMother = user?.role === 'mother';
  const { accepted: termsAccepted, accept: acceptTerms } = useVideoTermsAccepted(user?.id);
  const [showTerms, setShowTerms] = useState(true);
  const [joined, setJoined] = useState(false);
  const [inviteSpecialistId, setInviteSpecialistId] = useState('');
  const [invited, setInvited] = useState<string[]>([]);
  const [transcript, setTranscript] = useState('');
  const [ending, setEnding] = useState(false);
  const [sessionNotes, setSessionNotes] = useState<VideoSessionNotes | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const appendTranscript = useCallback((chunk: string) => {
    setTranscript((prev) => (prev ? `${prev.trimEnd()} ${chunk}` : chunk));
  }, []);

  const { team } = useTeam();
  const availableSpecialists = useMemo(
    () => team.filter((m) => m.role === 'doctor' || m.role === 'nurse'),
    [team],
  );
  const { brief, canEdit: canEditBrief, loading: briefLoading, busy: briefBusy, regenerate, markReviewed } =
    useCareBrief(isClinical ? patientId : undefined);
  const { data: patientProfile } = useMother(isClinical ? patientId : undefined);
  const selectedSpecialist = availableSpecialists.find((s) => s.id === inviteSpecialistId);

  const roomName =
    appointment?.videoRoomId ??
    (appointmentId ? `medsinn-${appointmentId.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()}` : '');

  const displayName = encodeURIComponent(user?.name ?? 'Guest');
  const jitsiBase = `https://meet.jit.si/${roomName}`;
  const jitsiUrl = `${jitsiBase}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false`;

  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/dashboard/video/${appointmentId}`
      : jitsiBase;

  const isCompleted = appointment?.status === 'completed' || Boolean(sessionNotes);

  const loadSession = useCallback(async () => {
    if (!appointmentId) return;
    try {
      const res = await fetchVideoSession(appointmentId);
      if (res.item) {
        setSessionNotes(res.item as unknown as VideoSessionNotes);
        if (res.item.transcript) setTranscript(String(res.item.transcript));
      }
    } catch {
      // no saved session yet
    } finally {
      setSessionLoaded(true);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (appointmentId) void loadSession();
  }, [appointmentId, loadSession]);

  function handleAcceptTerms() {
    acceptTerms();
    setShowTerms(false);
    setJoined(true);
  }

  function handleDeclineTerms() {
    navigate('/dashboard/video-calls');
  }

  async function endSession() {
    if (!appointmentId) return;
    setEnding(true);
    try {
      const res = await completeVideoSession(appointmentId, transcript);
      setSessionNotes(res.item as unknown as VideoSessionNotes);
      await refetch();
      toast.success('Session ended — appointment marked complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not end session');
    } finally {
      setEnding(false);
    }
  }

  function copyInvite() {
    const specialistLabel = selectedSpecialist
      ? `${selectedSpecialist.name} (${selectedSpecialist.email})`
      : '';
    const text = specialistLabel
      ? `Join Meds-inn video consultation: ${inviteLink}\nRoom: ${jitsiBase}\nInvited specialist: ${specialistLabel}`
      : `Join Meds-inn video consultation: ${inviteLink}\nRoom: ${jitsiBase}`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Invite link copied');
      if (selectedSpecialist) {
        setInvited((prev) => [...prev, selectedSpecialist.name]);
        setInviteSpecialistId('');
      }
    });
  }

  if (loading && !appointment) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!appointmentId || !roomName) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <p>Video call not found.</p>
        <Link to="/dashboard/video-calls" className="text-primary text-sm hover:underline mt-2 inline-block">
          Back to video calls
        </Link>
      </div>
    );
  }

  if (!sessionLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (isCompleted && sessionNotes) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-4">
        <VideoSessionSummary session={sessionNotes} isMother={isMother} />
      </div>
    );
  }

  if (isCompleted && !sessionNotes) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-4 text-center">
        <p className="text-sm text-muted-foreground">This video appointment is complete.</p>
        <Button size="sm" variant="outline" asChild>
          <Link to="/dashboard/video-calls">Back to video calls</Link>
        </Button>
      </div>
    );
  }

  const readyToJoin = termsAccepted || joined;

  return (
    <div className="space-y-4 flex flex-col min-h-[calc(100vh-8rem)]">
      <VideoTermsDialog
        open={!termsAccepted && showTerms && !isCompleted}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />

      <div className="flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div>
          <Link
            to="/dashboard/video-calls"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Video calls
          </Link>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            {appointment?.type ?? 'Video consultation'}
          </h1>
          {appointment && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {appointment.date} at {appointment.time}
              {isClinical ? ` · ${appointment.patient}` : ` · ${appointment.clinician}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {readyToJoin && !isCompleted && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              disabled={ending}
              onClick={endSession}
            >
              <PhoneOff className="w-3.5 h-3.5" />
              {ending ? 'Ending…' : 'End session'}
            </Button>
          )}
          {readyToJoin && (
            <Button variant="outline" size="sm" asChild>
              <a href={jitsiUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Open in tab
              </a>
            </Button>
          )}
        </div>
      </div>

      {!readyToJoin ? (
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Accept the video terms to join your consultation.
          </CardContent>
        </Card>
      ) : (
        <div className="flex-1 min-h-0 grid gap-4 lg:grid-cols-[1fr_minmax(300px,380px)]">
          <div className="flex flex-col min-h-0 gap-3">
            {isClinical && (
              <div className="flex flex-wrap items-end gap-2 shrink-0 p-3 rounded-lg border border-border bg-muted/20">
                <UserPlus className="w-4 h-4 text-primary shrink-0 mb-2" />
                <Select value={inviteSpecialistId} onValueChange={setInviteSpecialistId}>
                  <SelectTrigger className="h-9 text-sm flex-1 min-w-[200px]">
                    <SelectValue placeholder="Invite specialist…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSpecialists.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} · {s.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-9 gap-1"
                  disabled={!inviteSpecialistId}
                  onClick={copyInvite}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy invite
                </Button>
                {invited.map((name) => (
                  <Badge key={name} variant="outline" className="text-xs w-full sm:w-auto">
                    Invited: {name}
                  </Badge>
                ))}
              </div>
            )}

            <Card className="flex-1 min-h-[400px] overflow-hidden">
              <CardContent className="p-0 h-full min-h-[400px]">
                <iframe
                  title="Video consultation"
                  src={jitsiUrl}
                  allow="camera; microphone; fullscreen; display-capture"
                  className="w-full h-full min-h-[400px] border-0"
                />
              </CardContent>
            </Card>
          </div>

          <aside className="min-h-0 overflow-y-auto rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
            {isClinical && patientId ? (
              <>
                <div className="flex items-center justify-between gap-2 shrink-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    AI patient briefing
                  </p>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
                    <Link to={`/dashboard/mothers/${patientId}`}>
                      <UserCircle className="w-3.5 h-3.5" />
                      View profile
                    </Link>
                  </Button>
                </div>
                {patientProfile && (
                  <div className="text-xs text-muted-foreground shrink-0 -mt-2">
                    {patientProfile.name} · Week {patientProfile.gestationalWeek} ·{' '}
                    <span className="capitalize">{patientProfile.riskLevel} risk</span>
                  </div>
                )}
                <CareBriefPanel
                  brief={brief}
                  canEdit={canEditBrief}
                  busy={briefBusy}
                  loading={briefLoading}
                  patientId={patientId}
                  riskLevel={patientProfile?.riskLevel}
                  compact
                  onRegenerate={canEditBrief ? () => regenerate() : undefined}
                  onMarkReviewed={canEditBrief ? () => markReviewed() : undefined}
                />
              </>
            ) : (
              <VideoNoteTaker
                transcript={transcript}
                onTranscriptChange={setTranscript}
                onAppendTranscript={appendTranscript}
                disabled={ending}
              />
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
