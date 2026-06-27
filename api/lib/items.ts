import { ENTITY_PREFIX, PARTITION_KEY, SORT_KEY } from "./dynamodb";

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

/** O(1) login lookup — PK encodes username + hospital + role */
export function userLookupPk(username: string, role: string, hospitalId: string) {
  const normalized = String(username).trim().toLowerCase().replace(/\s+/g, " ");
  return `${ENTITY_PREFIX.userLookup}${normalized}#${hospitalId}#${role}`;
}

export function toUserLookupItem(user: Record<string, unknown>) {
  const id = String(user.id);
  const username = String(user.username);
  const role = String(user.role);
  const hospitalId = String(user.hospitalId);
  return withKeys(userLookupPk(username, role, hospitalId), "PROFILE", "USER_LOOKUP", {
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

export function toMedicationItem(medication: Record<string, unknown>) {
  const id = String(medication.id);
  return withKeys(`${ENTITY_PREFIX.medication}${id}`, "METADATA", "MEDICATION", medication);
}

export function toMessageItem(message: Record<string, unknown>) {
  const id = String(message.id);
  return withKeys(`${ENTITY_PREFIX.message}${id}`, "METADATA", "MESSAGE", message);
}

export function toDocumentItem(document: Record<string, unknown>) {
  const id = String(document.id);
  return withKeys(`${ENTITY_PREFIX.document}${id}`, "METADATA", "DOCUMENT", document);
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
