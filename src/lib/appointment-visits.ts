import type { Appointment } from "@/types/clinical.js";
import { appointmentDateTimeMs } from "@/lib/appointment-sort.js";

const UPCOMING_STATUSES = new Set(["scheduled"]);

export function getLastCompletedVisit(appointments: Appointment[]) {
  return appointments
    .filter((a) => a.status === "completed")
    .sort((a, b) => appointmentDateTimeMs(b) - appointmentDateTimeMs(a))[0];
}

export function getNextScheduledAppointment(appointments: Appointment[]) {
  const today = new Date().toISOString().slice(0, 10);
  return appointments
    .filter((a) => UPCOMING_STATUSES.has(a.status) && a.date >= today)
    .sort((a, b) => appointmentDateTimeMs(a) - appointmentDateTimeMs(b))[0];
}

export function formatAppointmentWhen(appt: Appointment) {
  const parts = [appt.date, appt.time].filter(Boolean);
  if (appt.location) parts.push(appt.location);
  return parts.join(" · ");
}

export function hasUpcomingAppointment(appointments: Appointment[], today = new Date()) {
  const todayStr = today.toISOString().slice(0, 10);
  return appointments.some(
    (a) => UPCOMING_STATUSES.has(a.status) && a.date >= todayStr,
  );
}

export function getTodayAppointments(
  appointments: Appointment[],
  today = new Date(),
) {
  const todayStr = today.toISOString().slice(0, 10);
  return appointments
    .filter((a) => UPCOMING_STATUSES.has(a.status) && a.date === todayStr)
    .sort((a, b) => appointmentDateTimeMs(a) - appointmentDateTimeMs(b));
}
