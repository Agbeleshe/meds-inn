import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSpecialistRequests } from '@/hooks/use-specialist-requests';
import { useNavBadges } from '@/hooks/use-nav-badges';
import { useMothers } from '@/hooks/use-mothers';
import { assignMotherStaff } from '@/lib/api-client';
import { DEMO_USERS } from '@/lib/demo-users';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { AsyncButton } from '@/components/common/AsyncButton';
import { MedCardListSkeleton } from '@/components/common/TableSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import type { SpecialistRequestType } from '@/types/clinical';

const STAFF_NURSES = DEMO_USERS.filter((u) => u.role === 'nurse');
const STAFF_DOCTORS = DEMO_USERS.filter((u) => u.role === 'doctor');

const REQUEST_LABELS: Record<SpecialistRequestType, string> = {
  request: 'Requested specialist',
  change: 'Change of specialist',
  report: 'Reported specialist',
};

export default function SpecialistWaitingListPage() {
  const { user } = useAuth();
  const { items, source, loading, refetch, pendingCount } = useSpecialistRequests();
  const { refreshWaitingList } = useNavBadges();
  const { mothers } = useMothers();
  const [draft, setDraft] = useState<Record<string, { nurseId: string; doctorId: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  if (user?.role !== 'admin') {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Admin access only.
      </div>
    );
  }

  async function saveAssignment(motherId: string, name: string) {
    const d = draft[motherId];
    if (!d) return;
    setSaving(motherId);
    try {
      const nurse = STAFF_NURSES.find((n) => n.id === d.nurseId);
      const doctor = STAFF_DOCTORS.find((doc) => doc.id === d.doctorId);
      await assignMotherStaff(motherId, {
        assignedNurseUserId: d.nurseId && d.nurseId !== '__none__' ? d.nurseId : null,
        assignedDoctorUserId: d.doctorId && d.doctorId !== '__none__' ? d.doctorId : null,
        nurse: nurse?.name ?? 'To be assigned',
        doctor: doctor?.name ?? 'To be assigned',
      });
      toast.success(`Assignment saved for ${name}. Staff will be notified.`);
      refetch();
      refreshWaitingList();
    } catch {
      toast.error('Could not save assignment');
    } finally {
      setSaving(null);
    }
  }

  const motherMap = new Map(mothers.map((m) => [m.id, m]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Specialist waiting list</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Mothers awaiting assignment or who submitted specialist requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceBadge source={source} loading={loading} />
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-xs">{pendingCount} pending</Badge>
          )}
        </div>
      </div>

      {loading ? (
        <MedCardListSkeleton count={3} />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No mothers in the waiting list right now.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const mother = motherMap.get(item.motherId);
            return (
              <Card key={item.motherId} className={item.pendingRequest ? 'border-destructive/40' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-primary" />
                        {item.motherName}
                        <Badge variant="outline" className="text-xs font-normal">{item.motherId}</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Week {item.gestationalWeek} · Nurse: {item.nurse} · Doctor: {item.doctor}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.pendingRequest && item.specialistRequestType && (
                        <Badge variant="destructive" className="text-xs">
                          {REQUEST_LABELS[item.specialistRequestType]}
                        </Badge>
                      )}
                      {item.unassigned && (
                        <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                          Unassigned
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.pendingRequest && (
                    <div className="rounded-lg bg-muted/50 border border-border px-3 py-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-medium text-foreground mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Mother request
                        {item.specialistRequestAt && (
                          <span className="font-normal text-muted-foreground">
                            · {new Date(item.specialistRequestAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {item.specialistRequestNote ? (
                        <p>{item.specialistRequestNote}</p>
                      ) : (
                        <p className="italic">No additional note provided.</p>
                      )}
                    </div>
                  )}

                  <div className="grid md:grid-cols-4 gap-3 items-end">
                    <Select
                      value={draft[item.motherId]?.nurseId ?? item.assignedNurseUserId ?? ''}
                      onValueChange={(v) =>
                        setDraft((p) => ({
                          ...p,
                          [item.motherId]: {
                            ...p[item.motherId],
                            nurseId: v,
                            doctorId: p[item.motherId]?.doctorId ?? item.assignedDoctorUserId ?? '',
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select nurse" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unassigned</SelectItem>
                        {STAFF_NURSES.map((n) => (
                          <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={draft[item.motherId]?.doctorId ?? item.assignedDoctorUserId ?? ''}
                      onValueChange={(v) =>
                        setDraft((p) => ({
                          ...p,
                          [item.motherId]: {
                            nurseId: p[item.motherId]?.nurseId ?? item.assignedNurseUserId ?? '',
                            doctorId: v,
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select doctor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unassigned</SelectItem>
                        {STAFF_DOCTORS.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AsyncButton
                      size="sm"
                      className="h-9 text-xs md:col-span-1"
                      loading={saving === item.motherId}
                      loadingText="Saving…"
                      onClick={() => saveAssignment(item.motherId, item.motherName)}
                    >
                      Assign & notify
                    </AsyncButton>
                    <Link
                      to={`/dashboard/care-plans?motherId=${item.motherId}`}
                      className="inline-flex items-center justify-center gap-1 text-xs text-primary hover:underline h-9"
                    >
                      Care plan <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        Assignments notify the selected nurse and doctor automatically.
      </p>
    </div>
  );
}
