import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MessageSquare,
  Calendar, Clock, FileText, CheckCircle2, Plus, ChevronRight, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APPOINTMENTS } from '@/lib/demo-data';

const UPCOMING = APPOINTMENTS.filter(a => a.mode === 'virtual' && a.status === 'scheduled').slice(0, 5);

const AGENDA_ITEMS = [
  { done: true, text: 'Check current symptoms and general wellbeing' },
  { done: true, text: 'Review lab results from June 20 visit' },
  { done: false, text: 'Discuss glucose tolerance test scheduling' },
  { done: false, text: 'Address reported dizziness and fatigue' },
  { done: false, text: 'Review iron supplement adherence' },
  { done: false, text: 'Confirm next in-person appointment date' },
];

export default function VideoConsultationsPage() {
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [note, setNote] = useState('');
  const [agendaItems, setAgendaItems] = useState(AGENDA_ITEMS);

  function toggleAgenda(i: number) {
    setAgendaItems(prev => prev.map((item, idx) => idx === i ? { ...item, done: !item.done } : item));
  }

  return (
    <div className="space-y-6">
      <div data-tour="video-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Video Consultations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Conduct and manage virtual care consultations.</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5 text-xs self-start md:self-auto" onClick={() => toast.success('Opening scheduling form')}>
          <Plus className="w-3.5 h-3.5" /> Schedule Consultation
        </Button>
      </div>

      {!inCall ? (
        <div data-tour="video-sessions" className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <Badge className="text-xs mb-2 bg-[hsl(142_63%_35%)] text-white">Next up in 45 minutes</Badge>
                  <h2 className="text-base font-semibold text-foreground">Video Consultation — Amina Bello</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">25-week check-in · Dr. Tolu Adebayo</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />June 25, 2026</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />4:00 PM · 30 minutes</span>
                  </div>
                </div>
                <Button className="gap-2 shrink-0" onClick={() => setInCall(true)}>
                  <Video className="w-4 h-4" /> Join Call
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">MED-ELR-24018</Badge>
                <Badge variant="outline">24 weeks</Badge>
                <Badge variant="outline">Moderate risk</Badge>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Upcoming Consultations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {UPCOMING.map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{a.patient}</p>
                      <p className="text-xs text-muted-foreground">{a.type}</p>
                      <p className="text-xs text-muted-foreground">{a.date} · {a.time} · {a.clinician}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toast.info(`Reminder sent for ${a.patient}`)}>Remind</Button>
                      <Button size="sm" className="h-7 text-xs" onClick={() => setInCall(true)}>Join</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Summary sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Session Agenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {agendaItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => toggleAgenda(i)}
                    className="flex items-start gap-2 text-left w-full group"
                  >
                    <CheckCircle2 className={cn('w-3.5 h-3.5 mt-0.5 shrink-0 transition-colors', item.done ? 'text-[hsl(142_63%_35%)]' : 'text-border group-hover:text-muted-foreground')} />
                    <span className={cn('text-xs text-pretty leading-relaxed', item.done ? 'line-through text-muted-foreground' : 'text-foreground')}>{item.text}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Past Consultation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <p className="text-muted-foreground font-medium">June 1, 2026 — 20-week review</p>
                  <p className="text-muted-foreground text-pretty leading-relaxed">Amina reported no major symptoms. Anomaly scan results reviewed — all normal. Reminder sent for GTT scheduling. Next appointment in 4 weeks.</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">Reviewed</Badge>
                    <Badge variant="outline" className="text-xs">Follow-up sent</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ── IN-CALL VIEW ── */
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Video panels */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Patient video */}
              <div className="aspect-video bg-[hsl(220_13%_13%)] rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                <Avatar className="w-16 h-16 mb-2">
                  <AvatarFallback className="text-2xl bg-secondary text-primary font-bold">AB</AvatarFallback>
                </Avatar>
                <p className="text-white text-sm font-medium relative z-10">Amina Bello</p>
                <p className="text-white/60 text-xs relative z-10">Patient</p>
                <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/40 rounded px-2 py-1">
                  <div className="w-2 h-2 rounded-full bg-[hsl(142_63%_50%)] animate-pulse" />
                  <span className="text-white text-xs">Connected</span>
                </div>
              </div>
              {/* Clinician video */}
              <div className={cn('aspect-video rounded-xl flex flex-col items-center justify-center relative overflow-hidden', cameraOff ? 'bg-muted' : 'bg-[hsl(173_79%_10%)]')}>
                {cameraOff ? (
                  <VideoOff className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                    <Avatar className="w-12 h-12 mb-2">
                      <AvatarFallback className="text-xl bg-primary text-primary-foreground font-bold">TA</AvatarFallback>
                    </Avatar>
                    <p className="text-white text-sm font-medium relative z-10">Dr. Tolu Adebayo</p>
                    <p className="text-white/60 text-xs relative z-10">Obstetrician</p>
                  </>
                )}
                <div className="absolute top-2 right-2">
                  <Badge className="text-xs bg-black/40 text-white border-0">You</Badge>
                </div>
              </div>
            </div>

            {/* Call controls */}
            <div className="flex items-center justify-center gap-3 bg-card border border-border rounded-xl p-3">
              <Button
                variant="outline"
                size="icon"
                className={cn('w-11 h-11 rounded-full', muted && 'bg-destructive/10 border-destructive/30 text-destructive')}
                onClick={() => { setMuted(m => !m); toast.info(muted ? 'Unmuted' : 'Muted'); }}
              >
                {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn('w-11 h-11 rounded-full', cameraOff && 'bg-destructive/10 border-destructive/30 text-destructive')}
                onClick={() => { setCameraOff(c => !c); toast.info(cameraOff ? 'Camera on' : 'Camera off'); }}
              >
                {cameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-11 h-11 rounded-full"
                onClick={() => toast.info('Screen sharing started')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                className="w-14 h-11 rounded-full bg-destructive hover:bg-destructive/90"
                onClick={() => { setInCall(false); toast.success('Call ended'); }}
              >
                <PhoneOff className="w-4 h-4 text-white" />
              </Button>
            </div>

            {/* Consultation summary form */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Consultation Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Type consultation notes here… (auto-saved)"
                  className="min-h-[100px] text-sm"
                />
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="h-8 text-xs" onClick={() => toast.success('Notes saved')}>Save notes</Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast.success('Follow-up action added')}>Add follow-up</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" /> In this call
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { name: 'Amina Bello', role: 'Patient', initials: 'AB', status: 'connected' },
                  { name: 'Dr. Tolu Adebayo', role: 'Obstetrician', initials: 'TA', status: 'connected' },
                ].map(p => (
                  <div key={p.name} className="flex items-center gap-2">
                    <Avatar className="w-7 h-7"><AvatarFallback className="text-xs bg-secondary text-primary font-semibold">{p.initials}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.role}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-[hsl(142_63%_35%)]" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Agenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {agendaItems.map((item, i) => (
                  <button key={i} onClick={() => toggleAgenda(i)} className="flex items-start gap-2 text-left w-full group">
                    <CheckCircle2 className={cn('w-3.5 h-3.5 mt-0.5 shrink-0 transition-colors', item.done ? 'text-[hsl(142_63%_35%)]' : 'text-border')} />
                    <span className={cn('text-xs text-pretty leading-relaxed', item.done ? 'line-through text-muted-foreground' : 'text-foreground')}>{item.text}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
