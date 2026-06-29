import React, { useEffect, useMemo, useState } from "react";
import type { Appointment, Mother } from "@/types/clinical";
import { ACTIVE_HOSPITAL } from "@/lib/hospitals";
import {
  formatAppointmentWhen,
  getLastCompletedVisit,
  getNextScheduledAppointment,
} from "@/lib/appointment-visits";
import { eddFromGestationalWeek, trimesterFromWeeks } from "@/lib/pregnancy-dates";
import { RiskBadge } from "@/components/common/Badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Heart, Phone, Stethoscope, User, Pencil, Save } from "lucide-react";

interface MotherProfileHeaderProps {
  patient: Mother;
  appointments: Appointment[];
  canEdit?: boolean;
  onSave?: (payload: Record<string, unknown>) => Promise<unknown>;
  /** Simpler layout for Settings → Profile (no adherence panel). */
  variant?: "full" | "settings";
}

export function MotherProfileHeader({
  patient,
  appointments,
  canEdit = false,
  onSave,
  variant = "full",
}: MotherProfileHeaderProps) {
  const patientAppointments = useMemo(
    () => appointments.filter((a) => a.patientId === patient.id),
    [appointments, patient.id],
  );

  const lastVisitAppt = useMemo(
    () => getLastCompletedVisit(patientAppointments),
    [patientAppointments],
  );
  const nextAppt = useMemo(
    () => getNextScheduledAppointment(patientAppointments),
    [patientAppointments],
  );

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [eddManual, setEddManual] = useState(false);
  const [form, setForm] = useState({
    age: String(patient.age ?? ""),
    gestationalWeek: String(patient.gestationalWeek ?? ""),
    edd: patient.edd ?? "",
    bloodGroup: patient.bloodGroup ?? "",
    allergies: patient.allergies ?? "",
    lastCheckIn: patient.lastCheckIn ?? lastVisitAppt?.date ?? "",
  });

  useEffect(() => {
    setEddManual(false);
    setForm({
      age: String(patient.age ?? ""),
      gestationalWeek: String(patient.gestationalWeek ?? ""),
      edd: patient.edd ?? "",
      bloodGroup: patient.bloodGroup ?? "",
      allergies: patient.allergies ?? "",
      lastCheckIn: patient.lastCheckIn ?? lastVisitAppt?.date ?? "",
    });
  }, [patient, lastVisitAppt?.date]);

  const weeks = Number(form.gestationalWeek) || 0;
  const trimester = trimesterFromWeeks(weeks);
  const isPostpartum =
    patient.careStage === "postpartum" || patient.status === "postpartum";

  const lastVisitDisplay = lastVisitAppt
    ? formatAppointmentWhen(lastVisitAppt)
    : form.lastCheckIn || patient.lastCheckIn || "—";

  function handleWeekChange(value: string) {
    const w = Number(value);
    setForm((f) => ({
      ...f,
      gestationalWeek: value,
      edd: !eddManual && w > 0 ? eddFromGestationalWeek(w) : f.edd,
    }));
  }

  async function handleSave() {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave({
        age: Number(form.age) || patient.age,
        gestationalWeek: weeks,
        trimester: trimesterFromWeeks(weeks),
        edd: form.edd.trim(),
        bloodGroup: form.bloodGroup.trim(),
        allergies: form.allergies.trim(),
        lastCheckIn: form.lastCheckIn.trim(),
      });
      toast.success("Profile updated");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  const fields = editing
    ? [
        {
          label: "Age",
          node: (
            <Input
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              className="h-8 text-sm"
              type="number"
              min={14}
              max={60}
            />
          ),
        },
        { label: "Hospital", value: ACTIVE_HOSPITAL.name },
        ...(isPostpartum
          ? []
          : [
              {
                label: "Pregnancy week",
                node: (
                  <Input
                    value={form.gestationalWeek}
                    onChange={(e) => handleWeekChange(e.target.value)}
                    placeholder="Weeks"
                    className="h-8 text-sm"
                    type="number"
                    min={1}
                    max={42}
                  />
                ),
              },
              { label: "Trimester", value: `${trimester} trimester` },
              {
                label: "EDD",
                node: (
                  <Input
                    type="date"
                    value={form.edd}
                    onChange={(e) => {
                      setEddManual(true);
                      setForm((f) => ({ ...f, edd: e.target.value }));
                    }}
                    className="h-8 text-sm"
                  />
                ),
              },
            ]),
        {
          label: "Blood group",
          node: (
            <Input
              value={form.bloodGroup}
              onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}
              className="h-8 text-sm"
            />
          ),
        },
        {
          label: "Allergies",
          node: (
            <Input
              value={form.allergies}
              onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
              placeholder="None"
              className="h-8 text-sm"
            />
          ),
        },
        {
          label: "Last visit",
          node: (
            <Input
              type="date"
              value={form.lastCheckIn}
              onChange={(e) => setForm((f) => ({ ...f, lastCheckIn: e.target.value }))}
              className="h-8 text-sm"
            />
          ),
        },
        {
          label: "Next appointment",
          value: nextAppt ? formatAppointmentWhen(nextAppt) : "None scheduled",
        },
      ]
    : [
        { label: "Age", value: `${patient.age} years` },
        { label: "Hospital", value: ACTIVE_HOSPITAL.name },
        ...(isPostpartum
          ? [{ label: "Care stage", value: "Postpartum / delivered" }]
          : [
              {
                label: "Pregnancy week",
                value: weeks > 0 ? `${weeks} weeks` : "—",
              },
              { label: "Trimester", value: weeks > 0 ? `${trimester} trimester` : patient.trimester || "—" },
              { label: "EDD", value: patient.edd || "—" },
            ]),
        { label: "Blood group", value: patient.bloodGroup || "—" },
        { label: "Allergies", value: patient.allergies || "None" },
        { label: "Last visit", value: lastVisitDisplay },
        {
          label: "Next appointment",
          value: nextAppt ? formatAppointmentWhen(nextAppt) : "None scheduled",
        },
      ];

  const editControls = canEdit && onSave && (
    <div className="flex items-center gap-2 ml-auto">
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs gap-1"
        onClick={() => (editing ? handleSave() : setEditing(true))}
        disabled={saving}
      >
        {editing ? <Save className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
        {editing ? (saving ? "Saving…" : "Save") : "Edit profile"}
      </Button>
      {editing && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => {
            setEditing(false);
            setEddManual(false);
          }}
        >
          Cancel
        </Button>
      )}
    </div>
  );

  if (variant === "settings") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar className="w-12 h-12 shrink-0">
            <AvatarFallback className="text-base font-bold bg-secondary text-primary">
              {patient.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{patient.name}</p>
            <p className="text-xs text-muted-foreground">ID: {patient.id}</p>
          </div>
          {editControls}
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {fields.map((item) => (
            <div key={item.label}>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              {"node" in item && item.node ? (
                <div className="mt-1">{item.node}</div>
              ) : (
                <p className="text-sm font-medium text-foreground">{item.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <Avatar className="w-16 h-16 shrink-0">
          <AvatarFallback className="text-xl font-bold bg-secondary text-primary">
            {patient.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-xl font-bold text-foreground">{patient.name}</h1>
            <RiskBadge level={patient.riskLevel} />
            <Badge variant="outline" className="text-xs">
              ID: {patient.id}
            </Badge>
            {editControls}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 text-sm mt-3">
            {fields.map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                {"node" in item && item.node ? (
                  <div className="mt-1">{item.node}</div>
                ) : (
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Nurse:</span>
              <span className="text-xs font-medium text-foreground">{patient.nurse}</span>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Doctor:</span>
              <span className="text-xs font-medium text-foreground">{patient.doctor}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">{patient.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Emergency:</span>
              <span className="text-xs font-medium text-foreground">{patient.emergencyContact}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 bg-secondary rounded-xl px-6 py-4 shrink-0">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Adherence</span>
          <span className="text-3xl font-bold text-primary">{patient.adherence}%</span>
          <Progress value={patient.adherence} className="w-24 h-1.5 mt-1" />
          <span className="text-xs text-muted-foreground">Medication</span>
        </div>
      </div>
    </div>
  );
}
