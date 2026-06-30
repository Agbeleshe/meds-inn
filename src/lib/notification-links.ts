import type { AppNotification } from "@/types/clinical.js";

/** Deep link for actionable notifications. */
export function notificationHref(n: AppNotification): string | null {
  if (n.type === "appointment" && n.appointmentId) {
    return `/dashboard/appointments?appointmentId=${encodeURIComponent(n.appointmentId)}`;
  }
  if (n.title?.toLowerCase().includes("video")) {
    return "/dashboard/video-calls";
  }
  if (n.type === "care-plan") {
    return "/dashboard/care-tasks";
  }
  if (n.type === "document") {
    return "/dashboard/documents";
  }
  if (n.type === "escalation") {
    return "/dashboard/escalated";
  }
  return null;
}
