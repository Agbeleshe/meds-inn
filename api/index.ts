import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json } from "../server/lib/handler.js";

// Static imports of all route handlers from server/
import authLogin from "../server/auth/login.js";
import authSignup from "../server/auth/signup.js";
import onboardingComplete from "../server/onboarding/complete.js";
import pregnancyMother from "../server/pregnancy/[motherId].js";
import dashboardMetrics from "../server/dashboard/metrics.js";
import careBriefsIndex from "../server/care-briefs/index.js";
import careBriefsMother from "../server/care-briefs/[motherId].js";
import carePlansIndex from "../server/care-plans/index.js";
import carePlansMother from "../server/care-plans/[motherId].js";
import appointmentsId from "../server/appointments/[id].js";
import appointmentsIndex from "../server/appointments.js";
import messagesThreadsId from "../server/messages/threads/[id].js";
import messagesThreadsIndex from "../server/messages/threads.js";
import messagesIndex from "../server/messages.js";
import mothersAssign from "../server/mothers/[id]/assign.js";
import mothersEscalate from "../server/mothers/[id]/escalate.js";
import mothersSpecialistRequest from "../server/mothers/[id]/specialist-request.js";
import mothersId from "../server/mothers/[id].js";
import mothersIndex from "../server/mothers.js";
import medicationsDoses from "../server/medications/doses.js";
import medicationsIndex from "../server/medications.js";
import documentsId from "../server/documents/[id].js";
import documentsIndex from "../server/documents.js";
import notificationsId from "../server/notifications/[id].js";
import notificationsIndex from "../server/notifications.js";
import activityLog from "../server/activity-log.js";
import analytics from "../server/analytics.js";
import babyChecklist from "../server/baby-checklist.js";
import babyMedications from "../server/baby-medications.js";
import babySymptoms from "../server/baby-symptoms.js";
import baby from "../server/baby.js";
import clinicalNotes from "../server/clinical-notes.js";
import escalations from "../server/escalations.js";
import health from "../server/health.js";
import hospitals from "../server/hospitals.js";
import labs from "../server/labs.js";
import me from "../server/me.js";
import seed from "../server/seed.js";
import specialistRequests from "../server/specialist-requests.js";
import symptoms from "../server/symptoms.js";
import team from "../server/team.js";
import timeline from "../server/timeline.js";
import videoRequests from "../server/video-requests.js";
import videoSessions from "../server/video-sessions.js";
import waitlist from "../server/waitlist.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url || "/";
  const pathname = url.split("?")[0].replace(/\/$/, "");

  let match;

  if (pathname === "/api/auth/login") return authLogin(req, res);
  if (pathname === "/api/auth/signup") return authSignup(req, res);
  if (pathname === "/api/onboarding/complete") return onboardingComplete(req, res);
  if (pathname === "/api/dashboard/metrics") return dashboardMetrics(req, res);

  if (pathname === "/api/care-briefs") return careBriefsIndex(req, res);
  match = pathname.match(/^\/api\/care-briefs\/([^/]+)$/);
  if (match) { req.query.motherId = match[1]; return careBriefsMother(req, res); }

  if (pathname === "/api/care-plans") return carePlansIndex(req, res);
  match = pathname.match(/^\/api\/care-plans\/([^/]+)$/);
  if (match) { req.query.motherId = match[1]; return carePlansMother(req, res); }

  match = pathname.match(/^\/api\/pregnancy\/([^/]+)$/);
  if (match) { req.query.motherId = match[1]; return pregnancyMother(req, res); }

  if (pathname === "/api/appointments") return appointmentsIndex(req, res);
  match = pathname.match(/^\/api\/appointments\/([^/]+)$/);
  if (match) { req.query.id = match[1]; return appointmentsId(req, res); }

  if (pathname === "/api/messages/threads") return messagesThreadsIndex(req, res);
  match = pathname.match(/^\/api\/messages\/threads\/([^/]+)$/);
  if (match) { req.query.id = match[1]; return messagesThreadsId(req, res); }
  if (pathname === "/api/messages") return messagesIndex(req, res);

  match = pathname.match(/^\/api\/mothers\/([^/]+)\/assign$/);
  if (match) { req.query.id = match[1]; return mothersAssign(req, res); }
  match = pathname.match(/^\/api\/mothers\/([^/]+)\/escalate$/);
  if (match) { req.query.id = match[1]; return mothersEscalate(req, res); }
  match = pathname.match(/^\/api\/mothers\/([^/]+)\/specialist-request$/);
  if (match) { req.query.id = match[1]; return mothersSpecialistRequest(req, res); }
  match = pathname.match(/^\/api\/mothers\/([^/]+)$/);
  if (match) { req.query.id = match[1]; return mothersId(req, res); }
  if (pathname === "/api/mothers") return mothersIndex(req, res);

  if (pathname === "/api/medications/doses") return medicationsDoses(req, res);
  if (pathname === "/api/medications") return medicationsIndex(req, res);

  if (pathname === "/api/documents") return documentsIndex(req, res);
  match = pathname.match(/^\/api\/documents\/([^/]+)$/);
  if (match) { req.query.id = match[1]; return documentsId(req, res); }

  if (pathname === "/api/notifications") return notificationsIndex(req, res);
  match = pathname.match(/^\/api\/notifications\/([^/]+)$/);
  if (match) { req.query.id = match[1]; return notificationsId(req, res); }

  if (pathname === "/api/activity-log") return activityLog(req, res);
  if (pathname === "/api/analytics") return analytics(req, res);
  if (pathname === "/api/baby-checklist") return babyChecklist(req, res);
  if (pathname === "/api/baby-medications") return babyMedications(req, res);
  if (pathname === "/api/baby-symptoms") return babySymptoms(req, res);
  if (pathname === "/api/baby") return baby(req, res);
  if (pathname === "/api/clinical-notes") return clinicalNotes(req, res);
  if (pathname === "/api/escalations") return escalations(req, res);
  if (pathname === "/api/health") return health(req, res);
  if (pathname === "/api/hospitals") return hospitals(req, res);
  if (pathname === "/api/labs") return labs(req, res);
  if (pathname === "/api/me") return me(req, res);
  if (pathname === "/api/seed") return seed(req, res);
  if (pathname === "/api/specialist-requests") return specialistRequests(req, res);
  if (pathname === "/api/symptoms") return symptoms(req, res);
  if (pathname === "/api/team") return team(req, res);
  if (pathname === "/api/timeline") return timeline(req, res);
  if (pathname === "/api/video-requests") return videoRequests(req, res);
  if (pathname === "/api/video-sessions") return videoSessions(req, res);
  if (pathname === "/api/waitlist") return waitlist(req, res);

  return json(res, 404, { error: `Not Found: ${pathname}` });
}
