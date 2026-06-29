import { ENTITY_PREFIX, PARTITION_KEY, SORT_KEY } from "./dynamodb.js";

function withKeys(
  pk: string,
  sk: string,
  entityType: string,
  record: Record<string, unknown>,
) {
  return {
    [PARTITION_KEY]: pk,
    [SORT_KEY]: sk,
    entityType,
    ...record,
  };
}

export function toHospitalItem(hospital: Record<string, unknown>) {
  const id = String(hospital.id);
  return withKeys(`${ENTITY_PREFIX.hospital}${id}`, "METADATA", "HOSPITAL", hospital);
}

export function toUserItem(user: Record<string, unknown>) {
  const id = String(user.id);
  return withKeys(`${ENTITY_PREFIX.user}${id}`, "PROFILE", "USER", user);
}

/** O(1) login lookup — PK encodes email + hospital + role */
export function userLookupPk(email: string, role: string, hospitalId: string) {
  const normalized = String(email).trim().toLowerCase();
  return `${ENTITY_PREFIX.userLookup}${normalized}#${hospitalId}#${role}`;
}

export function toUserLookupItem(user: Record<string, unknown>) {
  const id = String(user.id);
  const email = String(user.email);
  const role = String(user.role);
  const hospitalId = String(user.hospitalId);
  return withKeys(userLookupPk(email, role, hospitalId), "PROFILE", "USER_LOOKUP", {
    userId: id,
  });
}

export function toMotherItem(mother: Record<string, unknown>) {
  const id = String(mother.id);
  return withKeys(`${ENTITY_PREFIX.mother}${id}`, "PROFILE", "MOTHER", mother);
}

export function toAppointmentItem(appointment: Record<string, unknown>) {
  const id = String(appointment.id);
  return withKeys(`${ENTITY_PREFIX.appointment}${id}`, "METADATA", "APPOINTMENT", appointment);
}

export function toTeamItem(member: Record<string, unknown>) {
  const id = String(member.id);
  return withKeys(`${ENTITY_PREFIX.team}${id}`, "PROFILE", "TEAM", member);
}

export function toMedicationDoseItem(dose: Record<string, unknown>, patientId: string) {
  const id = String(dose.id);
  const date = String(dose.date);
  return withKeys(
    `${ENTITY_PREFIX.mother}${patientId}`,
    `MEDDOSE#${date}#${id}`,
    "MEDDOSE",
    { ...dose, patientId },
  );
}

export function toMedicationItem(medication: Record<string, unknown>) {
  const id = String(medication.id);
  return withKeys(`${ENTITY_PREFIX.medication}${id}`, "METADATA", "MEDICATION", medication);
}

export function toMessageItem(message: Record<string, unknown>) {
  const id = String(message.id);
  return withKeys(`${ENTITY_PREFIX.message}${id}`, "METADATA", "MESSAGE", message);
}

export function toChatThreadItem(thread: object) {
  const t = thread as Record<string, unknown>;
  const id = String(t.id);
  return withKeys(`${ENTITY_PREFIX.chat}${id}`, "METADATA", "CHAT_THREAD", t);
}

export function toChatMessageItem(message: object, threadId: string) {
  const m = message as Record<string, unknown>;
  const id = String(m.id);
  const createdAt = String(m.createdAt);
  return withKeys(
    `${ENTITY_PREFIX.chat}${threadId}`,
    `MSG#${createdAt}#${id}`,
    "CHAT_MSG",
    { ...m, threadId },
  );
}

export function toDocumentItem(document: object) {
  const d = document as Record<string, unknown>;
  const id = String(d.id);
  return withKeys(`${ENTITY_PREFIX.document}${id}`, "METADATA", "DOCUMENT", d);
}

export function toSymptomItem(symptom: Record<string, unknown>, patientId: string) {
  const id = String(symptom.id);
  const date = String(symptom.date);
  return withKeys(
    `${ENTITY_PREFIX.mother}${patientId}`,
    `SYMPTOM#${date}#${id}`,
    "SYMPTOM",
    { ...symptom, patientId },
  );
}

export function toClinicalNoteItem(note: Record<string, unknown>, patientId: string) {
  const id = String(note.id);
  const date = String(note.date);
  return withKeys(
    `${ENTITY_PREFIX.mother}${patientId}`,
    `CLINNOTE#${date}#${id}`,
    "CLINNOTE",
    { ...note, patientId },
  );
}

export function toActivityItem(activity: object) {
  const a = activity as Record<string, unknown>;
  const id = String(a.id);
  const createdAt = String(a.createdAt);
  const hospitalId = String(a.hospitalId);
  return withKeys(
    `${ENTITY_PREFIX.hospital}${hospitalId}`,
    `ACTIVITY#${createdAt}#${id}`,
    "ACTIVITY",
    a,
  );
}

export function toVideoSessionItem(session: Record<string, unknown>, patientId: string) {
  const appointmentId = String(session.appointmentId);
  return withKeys(
    `${ENTITY_PREFIX.mother}${patientId}`,
    `VIDEOSESSION#${appointmentId}`,
    "VIDEOSESSION",
    { ...session, patientId },
  );
}

/** Lab results are stored under the mother partition key */
export function toLabItem(lab: Record<string, unknown>, patientId: string) {
  const id = String(lab.id);
  const date = String(lab.date);
  return withKeys(
    `${ENTITY_PREFIX.mother}${patientId}`,
    `LAB#${date}#${id}`,
    "LAB",
    { ...lab, patientId },
  );
}

export function toTimelineItem(event: Record<string, unknown>, motherId: string) {
  const id = String(event.id);
  const date = String(event.date);
  return withKeys(
    `${ENTITY_PREFIX.mother}${motherId}`,
    `TIMELINE#${date}#${id}`,
    "TIMELINE",
    { ...event, patientId: motherId },
  );
}

export function toCarePlanItem(carePlan: Record<string, unknown>, motherId: string) {
  return withKeys(`${ENTITY_PREFIX.carePlan}${motherId}`, "METADATA", "CAREPLAN", {
    ...carePlan,
    motherId,
  });
}

export function toWaitlistItem(entry: Record<string, unknown>) {
  const email = String(entry.email).trim().toLowerCase();
  return withKeys(`${ENTITY_PREFIX.waitlist}${email}`, "METADATA", "WAITLIST", {
    ...entry,
    email,
    type: "hospital",
  });
}

export function motherListFilter() {
  return {
    FilterExpression: "begins_with(#pk, :prefix) AND entityType = :entityType",
    ExpressionAttributeNames: { "#pk": "PK" },
    ExpressionAttributeValues: {
      ":prefix": ENTITY_PREFIX.mother,
      ":entityType": "MOTHER",
    },
  };
}

export function prefixFilter(prefix: string) {
  return {
    FilterExpression: "begins_with(#pk, :prefix)",
    ExpressionAttributeNames: { "#pk": "PK" },
    ExpressionAttributeValues: { ":prefix": prefix },
  };
}

export function entityTypeFilter(entityType: string) {
  return {
    FilterExpression: "entityType = :entityType",
    ExpressionAttributeValues: { ":entityType": entityType },
  };
}
