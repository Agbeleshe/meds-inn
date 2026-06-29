import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX, PARTITION_KEY, SORT_KEY, stripKeys } from "./dynamodb.js";
import { toCarePlanItem } from "./items.js";
import { buildDefaultCarePlan } from "../../src/lib/care-plan-templates.js";
import { getCarePlanSession, saveCarePlanSession } from "./care-plan-session-store.js";

export async function getCarePlanRecord(motherId: string) {
  const session = getCarePlanSession(motherId);
  if (session) return session;

  try {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          [PARTITION_KEY]: `${ENTITY_PREFIX.carePlan}${motherId}`,
          [SORT_KEY]: "METADATA",
        },
      }),
    );
    if (!result.Item) return null;
    return stripKeys(result.Item as Record<string, unknown>);
  } catch (error) {
    console.warn("DynamoDB getCarePlanRecord failed:", error);
    return getCarePlanSession(motherId);
  }
}

export async function putCarePlanRecord(
  motherId: string,
  patch: {
    sections?: unknown[];
    motherChecklist?: unknown[];
    education?: unknown[];
    dailyChecklist?: unknown;
  },
) {
  const existing = await getCarePlanRecord(motherId);
  const base = existing ?? buildDefaultCarePlan(motherId);
  const payload = {
    ...base,
    ...patch,
    motherId,
    updatedAt: new Date().toISOString(),
  };
  const item = toCarePlanItem(payload as unknown as Record<string, unknown>, motherId);
  const stripped = stripKeys(item);
  saveCarePlanSession(motherId, stripped);

  try {
    await dynamodb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  } catch (error) {
    console.warn("DynamoDB putCarePlanRecord failed, kept in session:", error);
  }
  return stripped;
}

export async function listTimelineEvents(motherId: string) {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
      ExpressionAttributeNames: {
        "#pk": PARTITION_KEY,
        "#sk": SORT_KEY,
      },
      ExpressionAttributeValues: {
        ":pk": `${ENTITY_PREFIX.mother}${motherId}`,
        ":prefix": "TIMELINE#",
      },
    }),
  );
  const items = (result.Items ?? []).map((item) =>
    stripKeys(item as Record<string, unknown>),
  );
  return items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
