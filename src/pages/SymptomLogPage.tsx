import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyMotherProfile } from '@/hooks/use-mother';
import { useSymptoms } from '@/hooks/use-symptoms';
import { patchMother } from '@/lib/api-client';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Activity, AlertCircle, Plus, Save } from 'lucide-react';

export default function SymptomLogPage() {
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useMyMotherProfile(user?.motherId);
  const patientId = user?.motherId ?? profile?.id;
  const { symptoms, source, loading, addSymptom, refetch } = useSymptoms(patientId);

  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [concernsText, setConcernsText] = useState('');
  const [savingConcerns, setSavingConcerns] = useState(false);

  React.useEffect(() => {
    if (profile?.concerns?.length) {
      setConcernsText(profile.concerns.join(' · '));
    }
  }, [profile?.concerns]);

  async function handleLogSymptom(e: React.FormEvent) {
    e.preventDefault();
    if (!symptom.trim() || !patientId) return;
    setSubmitting(true);
    try {
      await addSymptom({
        symptom: symptom.trim(),
        severity,
        notes: notes.trim(),
        updateConcerns: true,
      });
      toast.success('Symptom logged — your care team can see this in your profile');
      setSymptom('');
      setNotes('');
      setSeverity('mild');
      refetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log symptom');
    } finally {
      setSubmitting(false);
    }
  }

  async function saveConcerns() {
    if (!patientId) return;
    const concerns = concernsText
      .split(/[,·\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    setSavingConcerns(true);
    try {
      await patchMother(patientId, { concerns });
      toast.success('Current concerns updated');
      refetchProfile();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save concerns');
    } finally {
      setSavingConcerns(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Symptom Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log anything you feel — your specialist and AI care brief use this to prepare for your visits.
          </p>
        </div>
        <DataSourceBadge source={source} loading={loading} />
      </div>

      <Card className="border-[hsl(38_92%_80%)] bg-[hsl(38_92%_97%)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[hsl(38_70%_30%)]">
            <AlertCircle className="w-4 h-4" />
            Current concerns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Summarise what you are experiencing now (e.g. Fatigue · Occasional dizziness). This appears on your specialist&apos;s profile view.
          </p>
          <Textarea
            value={concernsText}
            onChange={(e) => setConcernsText(e.target.value)}
            placeholder="Fatigue · Occasional dizziness"
            rows={2}
          />
          <Button size="sm" className="gap-1.5" disabled={savingConcerns} onClick={saveConcerns}>
            <Save className="w-3.5 h-3.5" />
            {savingConcerns ? 'Saving…' : 'Save current concerns'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Log a symptom</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogSymptom} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="symptom">What are you feeling?</Label>
              <Input
                id="symptom"
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                placeholder="e.g. Headache, nausea, back pain"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe — notifies your care team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="When it started, triggers, etc."
                rows={3}
              />
            </div>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              <Plus className="w-4 h-4" />
              {submitting ? 'Logging…' : 'Log symptom'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Your symptom history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : symptoms.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No logs yet — log your first symptom above.</p>
          ) : (
            symptoms.map((s) => (
              <div key={s.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{s.date}</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{s.symptom}</p>
                  {s.notes && <p className="text-xs text-muted-foreground mt-0.5">{s.notes}</p>}
                </div>
                <Badge variant="outline" className="text-xs shrink-0">{s.severity}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
