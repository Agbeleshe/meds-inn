import type { VercelRequest, VercelResponse } from "@vercel/node";
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME } from "./lib/dynamodb";
import {
  toAppointmentItem,
  toCarePlanItem,
  toDocumentItem,
  toHospitalItem,
  toLabItem,
  toMedicationItem,
  toMessageItem,
  toMotherItem,
  toTeamItem,
  toTimelineItem,
  toUserItem,
  toUserLookupItem,
} from "./lib/items";
import { json, methodNotAllowed } from "./lib/handler";
import { DEMO_USERS, HOSPITALS } from "../src/lib/demo-users";
import {
  APPOINTMENTS,
  DOCUMENTS,
  LAB_RESULTS,
  MEDICATIONS,
  MESSAGES,
  PATIENTS,
  TEAM_MEMBERS,
} from "../src/lib/demo-data";
import { DEFAULT_TIMELINE_EVENTS } from "../src/lib/timeline-events";
import { buildDefaultCarePlan } from "../src/lib/care-plan-templates";

const CHUNK = 25;
const DEFAULT_PATIENT_ID = "MED-ELR-24018";

async function batchPut(items: Record<string, unknown>[]) {
  for (let i = 0; i < items.length; i += CHUNK) {
    const slice = items.slice(i, i + CHUNK);
    await dynamodb.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: slice.map((Item) => ({ PutRequest: { Item } })),
        },
      }),
    );
  }
}

/** POST /api/seed — load demo rows into DynamoDB (single-table PK/SK) */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    const mothers = PATIENTS.map((m) =>
      toMotherItem({
        ...m,
        hospitalId: "ELR",
        nurse: (m as any).nurse ?? "To be assigned",
        doctor: (m as any).doctor ?? "To be assigned",
        assignedNurseUserId: (m as any).assignedNurseUserId ?? null,
        assignedDoctorUserId: (m as any).assignedDoctorUserId ?? null,
        specialistRequestStatus: null,
        specialistRequestType: null,
      } as unknown as Record<string, unknown>),
    );
    const appointments = APPOINTMENTS.map((a) =>
      toAppointmentItem({ ...a, hospitalId: "ELR" } as unknown as Record<string, unknown>),
    );
    const teamMembers = TEAM_MEMBERS.map((t) =>
      toTeamItem({ ...t, hospitalId: "ELR" } as unknown as Record<string, unknown>),
    );
    const medications = MEDICATIONS.map((m) =>
      toMedicationItem({ ...m, hospitalId: "ELR" } as unknown as Record<string, unknown>),
    );
    const messages = MESSAGES.map((m) =>
      toMessageItem({ ...m, patientId: DEFAULT_PATIENT_ID } as unknown as Record<string, unknown>),
    );
    const documents = DOCUMENTS.map((d) =>
      toDocumentItem({ ...d, patientId: DEFAULT_PATIENT_ID } as unknown as Record<string, unknown>),
    );
    const labs = LAB_RESULTS.map((l) => toLabItem(l as unknown as Record<string, unknown>, DEFAULT_PATIENT_ID));
    const carePlan = toCarePlanItem(
      buildDefaultCarePlan(DEFAULT_PATIENT_ID) as unknown as Record<string, unknown>,
      DEFAULT_PATIENT_ID,
    );
    const timeline = DEFAULT_TIMELINE_EVENTS.map((e) =>
      toTimelineItem(e as unknown as Record<string, unknown>, DEFAULT_PATIENT_ID),
    );
    const hospital = HOSPITALS.map((h) => toHospitalItem(h as unknown as Record<string, unknown>));
    const users = DEMO_USERS.map((u) =>
      toUserItem({ ...u, username: u.username.toLowerCase() } as unknown as Record<string, unknown>),
    );
    const userLookups = DEMO_USERS.map((u) =>
      toUserLookupItem({ ...u, username: u.username.toLowerCase() } as unknown as Record<string, unknown>),
    );

    await batchPut(hospital);
    await batchPut(users);
    await batchPut(userLookups);
    await batchPut(mothers);
    await batchPut(appointments);
    await batchPut(teamMembers);
    await batchPut(medications);
    await batchPut(messages);
    await batchPut(documents);
    await batchPut(labs);
    await batchPut([carePlan]);
    await batchPut(timeline);

    return json(res, 200, {
      table: TABLE_NAME,
      seeded: {
        hospital: hospital.length,
        users: users.length,
        userLookups: userLookups.length,
        mothers: mothers.length,
        appointments: appointments.length,
        teamMembers: teamMembers.length,
        medications: medications.length,
        messages: messages.length,
        documents: documents.length,
        labs: labs.length,
        carePlans: 1,
        timelineEvents: timeline.length,
      },
    });
  } catch (error) {
    console.error("Seed failed:", error);
    return json(res, 500, {
      error: "Seed failed",
      hint: "Use `npm run dev` and ensure AWS_ROLE_ARN is in .env.local",
    });
  }
}
