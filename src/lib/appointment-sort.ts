import type { Appointment } from "@/types/clinical";

/** Parse "10:00 AM", "09:00", "2:00 PM" into minutes since midnight for sorting. */
function timeToMinutes(time: string): number {
  const raw = time.trim().toUpperCase();
  const match = raw.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function appointmentDateTimeMs(a: Pick<Appointment, "date" | "time">): number {
  if (!a.date) return 0;
  const [y, m, d] = a.date.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const mins = timeToMinutes(a.time ?? "00:00");
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return new Date(y, m - 1, d, hours, minutes).getTime();
}

/** Newest bookings first (createdAt / apt-{timestamp} id), then latest visit date/time. */
export function getAppointmentCreatedMs(a: Appointment): number {
  if (a.createdAt) {
    const t = new Date(a.createdAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const idMatch = a.id.match(/^apt-(\d+)$/);
  if (idMatch) return Number(idMatch[1]);
  return 0;
}

export function compareAppointmentsByRecent(a: Appointment, b: Appointment): number {
  const createdDiff = getAppointmentCreatedMs(b) - getAppointmentCreatedMs(a);
  if (createdDiff !== 0) return createdDiff;
  return appointmentDateTimeMs(b) - appointmentDateTimeMs(a);
}

export function sortAppointmentsByRecent<T extends Appointment>(items: T[]): T[] {
  return [...items].sort(compareAppointmentsByRecent);
}
