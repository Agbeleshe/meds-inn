import { useCallback, useMemo } from "react";
import type { Appointment, Mother } from "@/types/clinical";
import { createAppointment, fetchAppointments, rescheduleAppointment, confirmAppointmentAttendance, markAppointmentAttended, type AppointmentPayload } from "@/lib/api-client";
import { useApiListQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/AuthContext";
import { useMothers } from "@/hooks/use-mothers";
import { sortAppointmentsByRecent } from "@/lib/appointment-sort";
import { ACTIVE_HOSPITAL_ID } from "@/lib/hospitals";

export function useAppointments(patientId?: string) {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId ?? ACTIVE_HOSPITAL_ID;
  const { mothers } = useMothers();

  const demoData = useMemo(() => [] as Appointment[], []);

  const fetchItems = useCallback(
    () => fetchAppointments(patientId ? { patientId } : undefined),
    [patientId],
  );

  const { data, source, loading, error, refetch } = useApiListQuery<Appointment>({
    demoData,
    fetchItems,
    queryKey: `${hospitalId}-${user?.id ?? "anon"}-${user?.role ?? "guest"}-${patientId ?? "all"}`,
  });

  const initialLoading = loading && data.length === 0;

  const appointments = useMemo(
    () => sortAppointmentsByRecent(data),
    [data],
  );

  return {
    appointments,
    source,
    loading: initialLoading,
    syncing: loading && data.length > 0,
    error,
    refetch,
    async bookAppointment(payload: AppointmentPayload) {
      const res = await createAppointment(payload);
      const created = res.item as unknown as Appointment;
      refetch();
      return created;
    },
    async rescheduleAppointment(id: string, date: string, time: string) {
      const res = await rescheduleAppointment(id, { date, time });
      const updated = res.item as unknown as Appointment;
      refetch();
      return updated;
    },
    async markAttended(id: string) {
      const res = await markAppointmentAttended(id);
      const updated = res.item as unknown as Appointment;
      refetch();
      return updated;
    },
    async confirmAttendance(id: string, attendanceNote?: string) {
      const res = await confirmAppointmentAttendance(id, attendanceNote);
      const updated = res.item as unknown as Appointment;
      refetch();
      return updated;
    },
    canBook: user?.role !== "mother",
    mothers: mothers as Mother[],
  };
}
