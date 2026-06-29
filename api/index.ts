import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json } from "./lib/handler";

// Static imports of all routes
import authLogin from "./_auth/login";
import authSignup from "./_auth/signup";
import onboardingComplete from "./_onboarding/complete";
import pregnancyMother from "./_pregnancy/[motherId]";
import dashboardMetrics from "./_dashboard/metrics";
import careBriefsIndex from "./_care-briefs/index";
import careBriefsMother from "./_care-briefs/[motherId]";
import carePlansIndex from "./_care-plans/index";
import carePlansMother from "./_care-plans/[motherId]";
import appointmentsId from "./_appointments/[id]";
import appointmentsIndex from "./_appointments";
import messagesThreadsId from "./_messages/threads/[id]";
import messagesThreadsIndex from "./_messages/threads";
import messagesIndex from "./_messages";
import mothersAssign from "./_mothers/[id]/assign";
import mothersEscalate from "./_mothers/[id]/escalate";
import mothersSpecialistRequest from "./_mothers/[id]/specialist-request";
import mothersId from "./_mothers/[id]";
import mothersIndex from "./_mothers";
import medicationsDoses from "./_medications/doses";
import medicationsIndex from "./_medications";
import documentsId from "./_documents/[id]";
import documentsIndex from "./_documents";
import notificationsId from "./_notifications/[id]";
import notificationsIndex from "./_notifications";
import activityLog from "./_activity-log";
import analytics from "./_analytics";
import babyChecklist from "./_baby-checklist";
import babyMedications from "./_baby-medications";
import babySymptoms from "./_baby-symptoms";
import baby from "./_baby";
import clinicalNotes from "./_clinical-notes";
import escalations from "./_escalations";
import health from "./_health";
import hospitals from "./_hospitals";
import labs from "./_labs";
import me from "./_me";
import seed from "./_seed";
import specialistRequests from "./_specialist-requests";
import symptoms from "./_symptoms";
import team from "./_team";
import timeline from "./_timeline";
import videoRequests from "./_video-requests";
import videoSessions from "./_video-sessions";
import waitlist from "./_waitlist";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extract path without query parameters
  const url = req.url || "/";
  const pathname = url.split("?")[0].replace(/\/$/, ""); // Strip query and trailing slash

  let match;

  if (pathname === "/api/auth/login") return authLogin(req, res);
  if (pathname === "/api/auth/signup") return authSignup(req, res);
  if (pathname === "/api/onboarding/complete") return onboardingComplete(req, res);
  if (pathname === "/api/dashboard/metrics") return dashboardMetrics(req, res);

  if (pathname === "/api/care-briefs") return careBriefsIndex(req, res);
  match = pathname.match(/^\/api\/care-briefs\/([^/]+)$/);
  if (match) {
    req.query.motherId = match[1];
    return careBriefsMother(req, res);
  }

  if (pathname === "/api/care-plans") return carePlansIndex(req, res);
  match = pathname.match(/^\/api\/care-plans\/([^/]+)$/);
  if (match) {
    req.query.motherId = match[1];
    return carePlansMother(req, res);
  }

  match = pathname.match(/^\/api\/pregnancy\/([^/]+)$/);
  if (match) {
    req.query.motherId = match[1];
    return pregnancyMother(req, res);
  }

  if (pathname === "/api/appointments") return appointmentsIndex(req, res);
  match = pathname.match(/^\/api\/appointments\/([^/]+)$/);
  if (match) {
    req.query.id = match[1];
    return appointmentsId(req, res);
  }

  if (pathname === "/api/messages/threads") return messagesThreadsIndex(req, res);
  match = pathname.match(/^\/api\/messages\/threads\/([^/]+)$/);
  if (match) {
    req.query.id = match[1];
    return messagesThreadsId(req, res);
  }
  if (pathname === "/api/messages") return messagesIndex(req, res);

  match = pathname.match(/^\/api\/mothers\/([^/]+)\/assign$/);
  if (match) {
    req.query.id = match[1];
    return mothersAssign(req, res);
  }
  match = pathname.match(/^\/api\/mothers\/([^/]+)\/escalate$/);
  if (match) {
    req.query.id = match[1];
    return mothersEscalate(req, res);
  }
  match = pathname.match(/^\/api\/mothers\/([^/]+)\/specialist-request$/);
  if (match) {
    req.query.id = match[1];
    return mothersSpecialistRequest(req, res);
  }
  match = pathname.match(/^\/api\/mothers\/([^/]+)$/);
  if (match) {
    req.query.id = match[1];
    return mothersId(req, res);
  }
  if (pathname === "/api/mothers") return mothersIndex(req, res);

  if (pathname === "/api/medications/doses") return medicationsDoses(req, res);
  if (pathname === "/api/medications") return medicationsIndex(req, res);

  if (pathname === "/api/documents") return documentsIndex(req, res);
  match = pathname.match(/^\/api\/documents\/([^/]+)$/);
  if (match) {
    req.query.id = match[1];
    return documentsId(req, res);
  }

  if (pathname === "/api/notifications") return notificationsIndex(req, res);
  match = pathname.match(/^\/api\/notifications\/([^/]+)$/);
  if (match) {
    req.query.id = match[1];
    return notificationsId(req, res);
  }

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
