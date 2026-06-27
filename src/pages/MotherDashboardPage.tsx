import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyMotherProfile } from '@/hooks/use-mother';
import { ACTIVE_HOSPITAL } from '@/lib/hospitals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Baby, Calendar, Pill, MessageSquare, BookOpen, Phone,
  CheckCircle2, Clock, AlertTriangle, ChevronRight, Heart,
  Droplets, Apple, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MED_LIST = [
  { id: 'm1', name: 'Folic Acid', dosage: '400mcg', when: '7:30 AM · With breakfast', taken: true },
  { id: 'm2', name: 'Ferrous Sulfate', dosage: '200mg', when: '8:00 AM · After breakfast', taken: true },
  { id: 'm3', name: 'Vitamin D3', dosage: '1000 IU', when: '7:30 AM · With breakfast', taken: true },
  { id: 'm4', name: 'Ferrous Sulfate (2nd dose)', dosage: '200mg', when: '8:00 PM · After dinner', taken: false },
  { id: 'm5', name: 'Calcium Carbonate', dosage: '500mg', when: '9:00 PM · Evening', taken: false },
];

const CARE_CHECKLIST = [
  { done: true, text: 'Log today\'s symptoms' },
  { done: true, text: 'Morning medication taken' },
  { done: false, text: 'Drink 8 glasses of water today' },
  { done: false, text: 'Take evening medications' },
  { done: false, text: 'Log fetal movement (10 kicks by 10 PM)' },
];

const EDUCATION = [
  {
    title: 'Understanding fetal movement',
    body: 'At 24 weeks, your baby\'s movements will become more regular. You may feel kicks, rolls, or stretches. Track at least 10 movements within 2 hours each evening.',
  },
  {
    title: 'Managing back discomfort',
    body: 'Back pain is common in the second trimester as your posture changes. Sleep on your left side with a pillow between your knees. Avoid standing for long periods.',
  },
  {
    title: 'Preparing for your glucose test',
    body: 'Your glucose tolerance test (GTT) is due between weeks 24 and 28. Fast for 8 hours beforehand. The test takes about 2 hours at the clinic.',
  },
];

export default function MotherDashboardPage() {
  const { user } = useAuth();
  const { data: profile, loading } = useMyMotherProfile(user?.motherId);
  const [meds, setMeds] = useState(MED_LIST);
  const [checklist, setChecklist] = useState(CARE_CHECKLIST);

  const firstName = user?.firstName ?? user?.name?.split(' ')[0] ?? 'there';
  const weeks = profile?.gestationalWeek ?? user?.gestationalWeeks ?? 0;
  const trimester = profile?.trimester ?? 'Second';
  const progressPct = weeks > 0 ? Math.min(100, Math.round((weeks / 40) * 100)) : 0;

  const takenCount = meds.filter(m => m.taken).length;
  const adherencePct = Math.round((takenCount / meds.length) * 100);
  const checklistDone = checklist.filter(c => c.done).length;

  function toggleMed(id: string) {
    setMeds(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
    toast.success('Updated');
  }
  function toggleCheck(i: number) {
    setChecklist(prev => prev.map((c, idx) => idx === i ? { ...c, done: !c.done } : c));
  }

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Warm greeting */}
      <div data-tour="mother-dash-header" className="bg-primary/5 border border-primary/15 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Good morning, {firstName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {weeks > 0 ? (
                <>
                  You are <span className="font-semibold text-primary">{weeks} weeks pregnant</span> — {trimester.toLowerCase()} trimester.
                </>
              ) : (
                <>Welcome to your postpartum care journey.</>
              )}{' '}
              Your care team at {ACTIVE_HOSPITAL.shortName} is with you every step of the way.
            </p>
          </div>
        </div>
      </div>

      {/* Pregnancy week + baby note */}
      <div data-tour="mother-dash-reminders" className="grid grid-cols-2 gap-4">
        <Card className="border-primary/20">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pregnancy week</p>
            <p className="text-4xl font-bold text-primary tabular-nums">{weeks || '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">{trimester} trimester</p>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs font-medium text-foreground">~{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <Baby className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Your baby</p>
            </div>
            <p className="text-sm font-semibold text-foreground text-balance leading-snug">
              About the size of a corn cob
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 text-pretty leading-relaxed">
              Baby is developing hearing and can recognise your voice. Movements are getting stronger.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next appointment */}
      <Card data-tour="mother-dash-appointments" className="border-[hsl(142_63%_55%)] bg-[hsl(142_63%_97%)]">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[hsl(142_63%_88%)] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[hsl(142_63%_30%)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Next appointment</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">Routine 24-week check</p>
                <p className="text-xs text-muted-foreground mt-0.5">Saturday, 28 June 2026 · 10:00 AM · Dr. Tolu Adebayo</p>
                <p className="text-xs text-muted-foreground">Suite 3, Elara Women's Specialist Clinic</p>
              </div>
            </div>
            <Badge className="text-xs bg-[hsl(142_63%_35%)] text-white shrink-0">In 3 days</Badge>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-[hsl(142_63%_35%)] hover:bg-[hsl(142_63%_28%)] text-white" onClick={() => toast.success('Reminder set for June 27')}>
              <Bell className="w-3.5 h-3.5" /> Set reminder
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast.info('Opening appointment details')}>
              View details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's medications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Today's Medications</CardTitle>
            </div>
            <span className="text-xs font-medium text-primary">{takenCount}/{meds.length} taken · {adherencePct}%</span>
          </div>
          <Progress value={adherencePct} className="h-1.5 mt-2" />
        </CardHeader>
        <CardContent className="space-y-2.5">
          {meds.map(med => (
            <div
              key={med.id}
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 border transition-colors',
                med.taken ? 'bg-[hsl(142_63%_97%)] border-[hsl(142_63%_60%)]' : 'bg-muted/30 border-border'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button onClick={() => toggleMed(med.id)} className="shrink-0">
                  {med.taken
                    ? <CheckCircle2 className="w-4 h-4 text-[hsl(142_63%_35%)]" />
                    : <Clock className="w-4 h-4 text-muted-foreground" />}
                </button>
                <div className="min-w-0">
                  <p className={cn('text-sm font-medium truncate', med.taken ? 'text-muted-foreground line-through' : 'text-foreground')}>
                    {med.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{med.dosage} · {med.when}</p>
                </div>
              </div>
              {!med.taken && (
                <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => toggleMed(med.id)}>
                  Mark taken
                </Button>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground/60 italic pt-1">
            All medications prescribed by Dr. Tolu Adebayo. Do not change your schedule without consulting your care team.
          </p>
        </CardContent>
      </Card>

      {/* Nurse message */}
      <Card className="border-primary/20 bg-secondary/30">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">EO</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-foreground">Nurse Esther Okonkwo</p>
                <span className="text-xs text-muted-foreground">Jun 24</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                Hi Amina, just checking in. Make sure you're resting and drinking enough water. Your iron adherence has been great this week — keep it up!
                See you on Saturday. 😊
              </p>
              <Button size="sm" variant="outline" className="mt-3 h-8 text-xs gap-1.5" onClick={() => toast.info('Opening message thread')}>
                <MessageSquare className="w-3.5 h-3.5" /> Reply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Care checklist */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Today's Care Checklist</CardTitle>
            <span className="text-xs text-muted-foreground">{checklistDone}/{checklist.length} done</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {checklist.map((item, i) => (
            <button
              key={i}
              onClick={() => toggleCheck(i)}
              className="flex items-center gap-3 w-full text-left group"
            >
              <CheckCircle2 className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                item.done ? 'text-[hsl(142_63%_35%)]' : 'text-border group-hover:text-muted-foreground'
              )} />
              <span className={cn('text-sm text-pretty', item.done ? 'line-through text-muted-foreground' : 'text-foreground')}>
                {item.text}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Hydration + nutrition reminders */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[hsl(207_85%_92%)] flex items-center justify-center shrink-0">
              <Droplets className="w-4 h-4 text-[hsl(207_85%_40%)]" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Hydration</p>
              <p className="text-xs text-muted-foreground">Aim for 8–10 glasses today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[hsl(142_63%_92%)] flex items-center justify-center shrink-0">
              <Apple className="w-4 h-4 text-[hsl(142_63%_30%)]" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Nutrition</p>
              <p className="text-xs text-muted-foreground">Iron-rich foods encouraged</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Education this week */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Education for this week</h2>
        </div>
        <div className="space-y-3">
          {EDUCATION.map((e, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground mb-1 text-balance">{e.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{e.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hospital support */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Hospital Support</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Nurse Esther', value: '+234 802 345 6781' },
              { label: 'Clinic Line', value: '+234 700 ELARA WSC' },
              { label: 'Dr. Tolu Adebayo', value: '+234 805 678 9014' },
              { label: 'Emergency', value: '+234 700 EMS 0000' },
            ].map(c => (
              <div key={c.label}>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{c.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency guidance */}
      <div className="bg-[hsl(0_72%_96%)] border border-[hsl(0_72%_72%)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <p className="text-sm font-semibold text-destructive">When to seek immediate help</p>
        </div>
        <ul className="space-y-1.5">
          {[
            'Heavy vaginal bleeding',
            'Severe headache or vision changes',
            'Sudden swelling of face, hands, or feet',
            'No fetal movement for more than 12 hours',
            'Fever above 38°C',
            'Severe abdominal pain',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-foreground">
              <ChevronRight className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <Button
          className="mt-4 w-full h-9 text-xs bg-destructive hover:bg-destructive/90 text-white"
          onClick={() => toast.error('Calling emergency line: +234 700 EMS 0000')}
        >
          <Phone className="w-3.5 h-3.5 mr-2" /> Call Emergency Line
        </Button>
      </div>

      {/* Postpartum transition preview */}
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-2">
            <Baby className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground">After your baby arrives</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
            When Baby Bello is born, your Meds-inn app will transition to include their care journey — vaccinations, milestones, growth tracking, and postpartum support for you.
            Your care team will be with you through the first year.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">Estimated due date: <span className="font-medium text-muted-foreground">October 14, 2026</span></p>
        </CardContent>
      </Card>

      <div className="pb-4" />
    </div>
  );
}
