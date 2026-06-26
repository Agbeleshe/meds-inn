import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLES, HOSPITAL } from '@/lib/demo-data';
import type { Role } from '@/lib/demo-data';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  HeartPulse, ArrowRight, ArrowLeft, Check,
  Stethoscope, Baby, ShieldCheck, UserRound, Hospital,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

type Path  = 'professional' | 'mother';
type Step  = 'path' | 'pro-role' | 'pro-details' | 'mother-details';
type ProRole = 'admin' | 'nurse' | 'doctor';

// ── Static data ────────────────────────────────────────────────────────────────

const PRO_ROLES: { id: ProRole; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'admin',
    label: 'Hospital Admin',
    desc: 'Manage the care programme, patient enrolment, and team assignments.',
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    id: 'nurse',
    label: 'Nurse / Midwife',
    desc: 'Follow up between visits, review care briefs, and track adherence.',
    icon: <Stethoscope className="w-5 h-5" />,
  },
  {
    id: 'doctor',
    label: 'Doctor',
    desc: 'Review patient status, conduct video consultations, and approve plans.',
    icon: <UserRound className="w-5 h-5" />,
  },
];

const SPECIALTIES = [
  'Obstetrics & Gynaecology',
  'Midwifery',
  'General Practice',
  'Paediatrics',
  'Neonatology',
  'Hospital Administration',
];

import type { Variants } from 'framer-motion';

// ── Animation variants ─────────────────────────────────────────────────────────

const slideIn: Variants = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0,   transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Top logo + optional back button */
function Header({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-8 relative">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute left-0 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      <div className="mx-auto flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <HeartPulse className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-xl tracking-tight">Meds-inn</span>
      </div>
    </div>
  );
}

/** Step progress dots */
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full transition-all duration-300',
            i < current
              ? 'w-5 h-1.5 bg-primary'
              : i === current
              ? 'w-5 h-1.5 bg-primary/60'
              : 'w-1.5 h-1.5 bg-border'
          )}
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { setRole } = useApp();
  const navigate    = useNavigate();

  // Flow state
  const [step, setStep]       = useState<Step>('path');
  const [path, setPath]       = useState<Path | null>(null);
  const [proRole, setProRole] = useState<ProRole>('admin');

  // Professional form
  const [proName,     setProName]     = useState(ROLES.find(r => r.id === 'admin')?.name ?? '');
  const [proHospital, setProHospital] = useState(HOSPITAL.name);
  const [proSpec,     setProSpec]     = useState(SPECIALTIES[0]);

  // Mother form
  const [moName,    setMoName]    = useState(ROLES.find(r => r.id === 'mother')?.name ?? '');
  const [moStatus,  setMoStatus]  = useState<'pregnant' | 'postpartum'>('pregnant');
  const [moWeeks,   setMoWeeks]   = useState('24');
  const [moHospital,setMoHospital]= useState(HOSPITAL.name);

  // When pro role card changes, update the pre-filled name
  function handleProRoleSelect(r: ProRole) {
    setProRole(r);
    const match = ROLES.find(x => x.id === r);
    if (match) setProName(match.name);
  }

  function handleEnter() {
    const role: Role = path === 'mother' ? 'mother' : proRole;
    setRole(role);
    navigate('/dashboard');
  }

  // ── Step: path picker ──────────────────────────────────────────────────────
  function StepPath() {
    return (
      <motion.div key="path" variants={slideIn} initial="hidden" animate="visible" exit="exit">
        <Header />
        <StepDots total={3} current={0} />
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2 text-balance">Welcome to Meds-inn</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Tell us who you are so we can personalise your demo experience.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Healthcare professional */}
          <button
            onClick={() => { setPath('professional'); setStep('pro-role'); }}
            className={cn(
              'group w-full text-left rounded-2xl border-2 border-border bg-card p-6',
              'hover:border-primary/50 hover:shadow-md transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/30'
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-base mb-0.5">I am a Healthcare Professional</p>
                <p className="text-sm text-muted-foreground text-pretty">
                  Doctor, nurse, midwife, or hospital administrator.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
            </div>
          </button>

          {/* Mother / patient */}
          <button
            onClick={() => { setPath('mother'); setStep('mother-details'); }}
            className={cn(
              'group w-full text-left rounded-2xl border-2 border-border bg-card p-6',
              'hover:border-[hsl(142_63%_35%)]/50 hover:shadow-md transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[hsl(142_63%_35%)]/30'
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[hsl(142_63%_35%)]/10 flex items-center justify-center shrink-0 group-hover:bg-[hsl(142_63%_35%)]/15 transition-colors">
                <Baby className="w-6 h-6 text-[hsl(142_63%_35%)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-base mb-0.5">I am a Mother / Patient</p>
                <p className="text-sm text-muted-foreground text-pretty">
                  Expectant or new mother enrolled in a Meds-inn programme.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-[hsl(142_63%_35%)] transition-colors" />
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 italic">
          Demo prototype — all data is fictional.
        </p>
      </motion.div>
    );
  }

  // ── Step: professional role picker ─────────────────────────────────────────
  function StepProRole() {
    return (
      <motion.div key="pro-role" variants={slideIn} initial="hidden" animate="visible" exit="exit">
        <Header onBack={() => setStep('path')} />
        <StepDots total={3} current={1} />
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground mb-1.5">What is your role?</h1>
          <p className="text-sm text-muted-foreground">Select the role that best describes you.</p>
        </div>

        <div className="space-y-3 mb-6">
          {PRO_ROLES.map(r => {
            const sel = proRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleProRoleSelect(r.id)}
                className={cn(
                  'w-full text-left rounded-xl border-2 p-4 transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary',
                  sel
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-border bg-card hover:border-primary/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                    sel ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{r.label}</p>
                    <p className="text-xs text-muted-foreground text-pretty leading-snug mt-0.5">{r.desc}</p>
                  </div>
                  {sel && (
                    <div className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <Button
          size="lg" className="w-full gap-2"
          onClick={() => setStep('pro-details')}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  // ── Step: professional details ─────────────────────────────────────────────
  function StepProDetails() {
    const roleLabel = PRO_ROLES.find(r => r.id === proRole)?.label ?? 'Professional';
    return (
      <motion.div key="pro-details" variants={slideIn} initial="hidden" animate="visible" exit="exit">
        <Header onBack={() => setStep('pro-role')} />
        <StepDots total={3} current={2} />
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground mb-1.5">Set up your profile</h1>
          <p className="text-sm text-muted-foreground">
            As <span className="font-medium text-foreground">{roleLabel}</span> — confirm or adjust a few details.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <Label className="text-sm font-normal mb-1.5 block">Your name</Label>
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={proName}
                onChange={e => setProName(e.target.value)}
                className="pl-9"
                placeholder="Dr. Jane Smith"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-normal mb-1.5 block">Hospital / Clinic</Label>
            <div className="relative">
              <Hospital className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={proHospital}
                onChange={e => setProHospital(e.target.value)}
                className="pl-9"
                placeholder="Hospital name"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-normal mb-1.5 block">Specialty / Department</Label>
            <select
              value={proSpec}
              onChange={e => setProSpec(e.target.value)}
              className={cn(
                'w-full h-10 rounded-md border border-input bg-background px-3 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground'
              )}
            >
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <Button size="lg" className="w-full gap-2 mb-3" onClick={handleEnter}>
          Enter as {roleLabel} <ArrowRight className="w-4 h-4" />
        </Button>
        <button
          onClick={handleEnter}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip setup and enter directly
        </button>
      </motion.div>
    );
  }

  // ── Step: mother details ───────────────────────────────────────────────────
  function StepMotherDetails() {
    return (
      <motion.div key="mother-details" variants={slideIn} initial="hidden" animate="visible" exit="exit">
        <Header onBack={() => setStep('path')} />
        <StepDots total={2} current={1} />
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-[hsl(142_63%_35%)]/10 items-center justify-center mb-3">
            <Baby className="w-6 h-6 text-[hsl(142_63%_35%)]" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1.5">Your care profile</h1>
          <p className="text-sm text-muted-foreground">Help us personalise your demo experience.</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <Label className="text-sm font-normal mb-1.5 block">Your name</Label>
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={moName}
                onChange={e => setMoName(e.target.value)}
                className="pl-9"
                placeholder="Your name"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-normal mb-2 block">Your current stage</Label>
            <div className="grid grid-cols-2 gap-3">
              {(['pregnant', 'postpartum'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setMoStatus(s)}
                  className={cn(
                    'rounded-xl border-2 py-3 px-4 text-sm font-medium transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[hsl(142_63%_35%)]',
                    moStatus === s
                      ? 'border-[hsl(142_63%_35%)] bg-[hsl(142_63%_35%)]/10 text-[hsl(142_63%_25%)]'
                      : 'border-border bg-card text-muted-foreground hover:border-[hsl(142_63%_35%)]/40'
                  )}
                >
                  {s === 'pregnant' ? '🤰 Pregnant' : '🍼 Postpartum'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-normal mb-1.5 block">
              {moStatus === 'pregnant' ? 'Weeks pregnant' : "Baby's age (weeks)"}
            </Label>
            <Input
              type="number"
              min={1}
              max={moStatus === 'pregnant' ? 42 : 52}
              value={moWeeks}
              onChange={e => setMoWeeks(e.target.value)}
              placeholder={moStatus === 'pregnant' ? 'e.g. 24' : 'e.g. 8'}
            />
          </div>

          <div>
            <Label className="text-sm font-normal mb-1.5 block">Hospital / Clinic</Label>
            <div className="relative">
              <Hospital className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={moHospital}
                onChange={e => setMoHospital(e.target.value)}
                className="pl-9"
                placeholder="Your enrolled clinic"
              />
            </div>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full gap-2 mb-3 bg-[hsl(142_63%_35%)] hover:bg-[hsl(142_63%_30%)] text-white"
          onClick={handleEnter}
        >
          Enter your care space <ArrowRight className="w-4 h-4" />
        </Button>
        <button
          onClick={handleEnter}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip and explore the demo
        </button>
      </motion.div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'path'           && <StepPath         key="path"           />}
          {step === 'pro-role'       && <StepProRole       key="pro-role"       />}
          {step === 'pro-details'    && <StepProDetails    key="pro-details"    />}
          {step === 'mother-details' && <StepMotherDetails key="mother-details" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
