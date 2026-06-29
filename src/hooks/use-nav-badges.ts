import { useCallback, useEffect, useState } from "react";
import { fetchEscalations, fetchBabyProfile, fetchVideoRequests, fetchSpecialistRequests } from "@/lib/api-client";
import { useChatThreads } from "@/hooks/use-chat";
import { useAppointments } from "@/hooks/use-appointments";
import { useAuth } from "@/contexts/AuthContext";
import { useMyMotherProfile } from "@/hooks/use-mother";
import { hasUpcomingAppointment } from "@/lib/appointment-visits";

export function useNavBadges() {
  const { user } = useAuth();
  const { threads } = useChatThreads();
  const { appointments } = useAppointments();
  const { data: motherProfile } = useMyMotherProfile(
    user?.role === "mother" ? user.motherId : undefined,
  );
  const [escalationCount, setEscalationCount] = useState(0);
  const [babyProfileIncomplete, setBabyProfileIncomplete] = useState(false);
  const [videoRequestCount, setVideoRequestCount] = useState(0);
  const [waitingListCount, setWaitingListCount] = useState(0);

  const loadEscalations = useCallback(() => {
    if (!user || !["admin", "nurse", "doctor"].includes(user.role)) {
      setEscalationCount(0);
      return;
    }
    fetchEscalations()
      .then((res) => setEscalationCount(res.items.length))
      .catch(() => setEscalationCount(0));
  }, [user?.role]);

  useEffect(() => {
    loadEscalations();
  }, [loadEscalations]);

  const loadVideoRequests = useCallback(() => {
    if (!user || !["admin", "nurse", "doctor"].includes(user.role)) {
      setVideoRequestCount(0);
      return;
    }
    fetchVideoRequests()
      .then((res) => setVideoRequestCount(res.items?.length ?? 0))
      .catch(() => setVideoRequestCount(0));
  }, [user?.role]);

  useEffect(() => {
    loadVideoRequests();
    const interval = window.setInterval(loadVideoRequests, 60_000);
    return () => window.clearInterval(interval);
  }, [loadVideoRequests]);

  const loadWaitingList = useCallback(() => {
    if (!user || user.role !== "admin") {
      setWaitingListCount(0);
      return;
    }
    fetchSpecialistRequests()
      .then((res) => setWaitingListCount(res.items?.length ?? 0))
      .catch(() => setWaitingListCount(0));
  }, [user?.role]);

  useEffect(() => {
    loadWaitingList();
    const interval = window.setInterval(loadWaitingList, 60_000);
    return () => window.clearInterval(interval);
  }, [loadWaitingList]);

  useEffect(() => {
    if (user?.role !== "mother" || !user.motherId) {
      setBabyProfileIncomplete(false);
      return;
    }
    const postpartum =
      motherProfile?.careStage === "postpartum" ||
      motherProfile?.status === "postpartum" ||
      motherProfile?.status === "delivered";
    if (!postpartum) {
      setBabyProfileIncomplete(false);
      return;
    }
    fetchBabyProfile(user.motherId)
      .then((res) => {
        const item = res.item as { babyName?: string; birthDate?: string } | null;
        setBabyProfileIncomplete(!item?.babyName?.trim() || !item?.birthDate?.trim());
      })
      .catch(() => setBabyProfileIncomplete(true));
  }, [user?.role, user?.motherId, motherProfile?.careStage, motherProfile?.status]);

  const unreadMessages = user
    ? threads.filter((t) =>
        user.role === "mother" ? t.unreadForPatient : t.unreadForSpecialist,
      ).length
    : 0;

  const upcomingAppointments =
    user?.role === "mother" ? hasUpcomingAppointment(appointments) : false;

  return {
    unreadMessages,
    upcomingAppointments,
    escalationCount,
    babyProfileIncomplete,
    videoRequestCount,
    waitingListCount,
    refreshEscalations: loadEscalations,
    refreshVideoRequests: loadVideoRequests,
    refreshWaitingList: loadWaitingList,
  };
}
