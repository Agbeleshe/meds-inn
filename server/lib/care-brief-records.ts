import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  dynamodb,
  TABLE_NAME,
  ENTITY_PREFIX,
  PARTITION_KEY,
  SORT_KEY,
  stripKeys,
} from "./dynamodb";
import { getCareBriefSession, saveCareBriefSession } from "./care-brief-session-store.js";

export interface CareBriefRecord {
  id: string;
  motherId: string;
  motherName: string;
  generatedAt: string;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  clinicianNote?: string;
  summary: string;
  dataSources: Array<{ category: string; detail: string }>;
  riskCues: string[];
  adherenceSummary: {
    medication: number;
    appointment: number;
    checklist: number | null;
    missedVisits: number;
  };
  suggestedFollowups: string[];
}

function toItem(brief: CareBriefRecord) {
  return {
    [PARTITION_KEY]: `${ENTITY_PREFIX.careBrief}${brief.motherId}`,
    [SORT_KEY]: "LATEST",
    entityType: "CARE_BRIEF",
    ...brief,
  };
}

export function normalizeCareBrief(raw: Record<string, unknown>): CareBriefRecord {
  return {
    id: String(raw.id ?? ""),
    motherId: String(raw.motherId ?? ""),
    motherName: String(raw.motherName ?? ""),
    generatedAt: String(raw.generatedAt ?? new Date().toISOString()),
    reviewed: raw.reviewed === true,
    reviewedBy: raw.reviewedBy ? String(raw.reviewedBy) : undefined,
    reviewedAt: raw.reviewedAt ? String(raw.reviewedAt) : undefined,
    clinicianNote: raw.clinicianNote ? String(raw.clinicianNote) : undefined,
    summary: String(raw.summary ?? ""),
    dataSources: Array.isArray(raw.dataSources)
      ? raw.dataSources.map((s) => {
          const row = s as Record<string, unknown>;
          return { category: String(row.category ?? ""), detail: String(row.detail ?? "") };
        })
      : [],
    riskCues: Array.isArray(raw.riskCues) ? raw.riskCues.map(String) : [],
    adherenceSummary: {
      medication: Number((raw.adherenceSummary as Record<string, unknown>)?.medication ?? 0),
      appointment: Number((raw.adherenceSummary as Record<string, unknown>)?.appointment ?? 0),
      checklist:
        (raw.adherenceSummary as Record<string, unknown>)?.checklist != null
          ? Number((raw.adherenceSummary as Record<string, unknown>).checklist)
          : null,
      missedVisits: Number((raw.adherenceSummary as Record<string, unknown>)?.missedVisits ?? 0),
    },
    suggestedFollowups: Array.isArray(raw.suggestedFollowups)
      ? raw.suggestedFollowups.map(String)
      : [],
  };
}

export async function getCareBriefRecord(motherId: string) {
  const session = getCareBriefSession(motherId);
  if (session) return normalizeCareBrief(session);

  try {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          [PARTITION_KEY]: `${ENTITY_PREFIX.careBrief}${motherId}`,
          [SORT_KEY]: "LATEST",
        },
      }),
    );
    if (result.Item) return normalizeCareBrief(stripKeys(result.Item as Record<string, unknown>));
  } catch (error) {
    console.warn("DynamoDB getCareBriefRecord failed:", error);
  }
  return null;
}

export async function putCareBriefRecord(brief: CareBriefRecord) {
  const item = toItem(brief);
  const stripped = stripKeys(item);
  saveCareBriefSession(brief.motherId, stripped);

  try {
    await dynamodb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  } catch (error) {
    console.warn("DynamoDB putCareBriefRecord failed, kept in session:", error);
  }
  return normalizeCareBrief(stripped);
}
