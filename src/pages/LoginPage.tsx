import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROLES, HOSPITAL } from '@/lib/demo-data';
import type { Role } from '@/lib/demo-data';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { HeartPulse, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_COLORS: Record<Role, { ring: string; bg: string; badge: string }> = {
  admin:  { ring: 'ring-primary', bg: 'bg-primary/5', badge: 'bg-secondary text-primary' },
  nurse:  { ring: 'ring-[hsl(207_85%_45%)]', bg: 'bg-[hsl(207_85%_95%)]', badge: 'bg-[hsl(207_85%_92%)] text-[hsl(207_85%_30%)]' },
  doctor: { ring: 'ring-accent', bg: 'bg-[hsl(38_53%_95%)]', badge: 'bg-[hsl(38_53%_92%)] text-[hsl(38_53%_30%)]' },
  mother: { ring: 'ring-[hsl(142_63%_35%)]', bg: 'bg-[hsl(142_63%_95%)]', badge: 'bg-[hsl(142_63%_90%)] text-[hsl(142_63%_25%)]' },
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as Role) ?? 'admin';
  const [selected, setSelected] = useState<Role>(initialRole);
  const { setRole } = useApp();
  const navigate = useNavigate();

  function handleEnter(role: Role) {
    setRole(role);
    if (role === 'mother') navigate('/dashboard/mother');
    else navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <HeartPulse className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-2xl tracking-tight">Meds-inn</span>
      </div>

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Choose your demo role</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Experience Meds-inn as a hospital admin, nurse, doctor, or mother. Each role shows a different view of the same care platform.
          </p>
          <p className="text-xs text-muted-foreground mt-1 italic">{HOSPITAL.name}</p>
        </div>

        <div className="space-y-3 mb-6">
          {ROLES.map(r => {
            const c = ROLE_COLORS[r.id];
            const isSelected = selected === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={cn(
                  'w-full text-left rounded-xl border-2 p-5 transition-all duration-150',
                  'hover:shadow-[var(--shadow-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                  isSelected ? `${c.ring} ring-2 ${c.bg}` : 'border-border bg-card hover:border-primary/30'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold mt-0.5', c.bg,
                      isSelected ? 'ring-2 ring-offset-1 ' + c.ring : '')}>
                      <span className="text-foreground/70">{r.initials}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{r.name}</span>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', c.badge)}>{r.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-pretty leading-relaxed">{r.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <Button
          size="lg"
          className="w-full gap-2 text-base"
          onClick={() => handleEnter(selected)}
        >
          Enter as {ROLES.find(r => r.id === selected)?.label}
          <ArrowRight className="w-4 h-4" />
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Demo prototype. All patient data is fictional and for demonstration purposes only.
        </p>
      </div>
    </div>
  );
}
