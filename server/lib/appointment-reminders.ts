import {
  findMotherUserId,
  notifyAppointmentReminder,
} from "./appointment-notify";
import { putAppointmentRecord, normalizeAppointment } from "./appointment-records.js";

function parseAppointmentDateTime(date: string, time: string): Date | null {
  const timeVal = time.trim();
  let hours = 9;
  let minutes = 0;
  const match24 = timeVal.match(/^(\d{1,2}):(\d{2})$/);
  const match12 = timeVal.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match24) {
    hours = parseInt(match24[1], 10);
    minutes = parseInt(match24[2], 10);
  } else if (match12) {
    hours = parseInt(match12[1], 10);
    minutes = parseInt(match12[2], 10);
    const isPm = match12[3].toUpperCase() === "PM";
    if (isPm && hours !== 12) hours += 12;
    if (!isPm && hours === 12) hours = 0;
  }
  const dt = new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Send 24h reminders for upcoming scheduled appointments (once per appointment). */
export async function processAppointmentReminders(
  appointments: ReturnType<typeof normalizeAppointment>[],
  mothers: Array<Record<string, unknown>>,
) {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  for (const apt of appointments) {
    if (apt.status !== "scheduled" || apt.reminderSent) continue;
    const dt = parseAppointmentDateTime(apt.date, apt.time);
    if (!dt || dt < now || dt > in24h) continue;

    const mother = mothers.find((m) => String(m.id) === apt.patientId);
    const motherUserId = await findMotherUserId(apt.patientId);
    const clinicianIds = [
      apt.createdByUserId,
      mother?.assignedDoctorUserId,
      mother?.assignedNurseUserId,
    ].filter(Boolean).map(String);

    await notifyAppointmentReminder({
      appointmentId: apt.id,
      patientId: apt.patientId,
      patientName: apt.patient,
      type: apt.type,
      date: apt.date,
      time: apt.time,
      clinician: apt.clinician,
      mode: apt.mode,
      motherUserId,
      clinicianUserIds: [...new Set(clinicianIds)],
      hospitalId: apt.hospitalId,
    });

    await putAppointmentRecord({ ...apt, reminderSent: true });
  }
}
