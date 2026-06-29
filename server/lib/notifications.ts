import { QueryCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME, PARTITION_KEY, SORT_KEY, stripKeys, ENTITY_PREFIX } from "./dynamodb.js";
import { DEMO_USERS } from "../../src/lib/demo-users.js";
import {
  appendNotificationSession,
  listNotificationSessions,
  markNotificationSessionRead,
} from "./notification-session-store";

export function toNotificationItem(
  notification: Record<string, unknown>,
  userId: string,
) {
  const id = String(notification.id);
  const createdAt = String(notification.createdAt);
  return {
    [PARTITION_KEY]: `USER#${userId}`,
    [SORT_KEY]: `NOTIFICATION#${createdAt}#${id}`,
    entityType: "NOTIFICATION",
    ...notification,
    userId,
  };
}

export async function listNotifications(userId: string) {
  const sessionItems = listNotificationSessions(userId);

  try {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
        ExpressionAttributeNames: { "#pk": PARTITION_KEY, "#sk": SORT_KEY },
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":prefix": "NOTIFICATION#",
        },
        ScanIndexForward: false,
        Limit: 50,
      }),
    );
    const fromDb = (result.Items ?? []).map((item) =>
      stripKeys(item as Record<string, unknown>),
    );
    if (fromDb.length > 0) {
      const byId = new Map<string, Record<string, unknown>>();
      for (const item of [...fromDb, ...sessionItems]) {
        byId.set(String(item.id), item);
      }
      return [...byId.values()].sort(
        (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
      );
    }
  } catch (error) {
    console.warn("DynamoDB listNotifications failed, using session:", error);
  }

  return sessionItems.sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt)),
  );
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const sessionUpdated = markNotificationSessionRead(userId, notificationId);
  if (sessionUpdated) return sessionUpdated;

  const items = await listNotifications(userId);
  const found = items.find((n) => String(n.id) === notificationId);
  if (!found) return null;
  if (found.read === true) return found;

  const updated = { ...found, read: true };
  try {
    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toNotificationItem(updated, userId),
      }),
    );
  } catch (error) {
    console.warn("DynamoDB markNotificationRead failed:", error);
    markNotificationSessionRead(userId, notificationId);
  }
  return updated;
}

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  motherId?: string;
  appointmentId?: string;
}) {
  const id = `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = new Date().toISOString();
  const record = {
    id,
    type: input.type,
    title: input.title,
    body: input.body,
    read: false,
    motherId: input.motherId,
    appointmentId: input.appointmentId,
    createdAt,
  };
  const item = toNotificationItem(record, input.userId);
  appendNotificationSession(input.userId, stripKeys(item));

  try {
    await dynamodb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  } catch (error) {
    console.warn("DynamoDB createNotification failed, kept in session:", error);
  }
  return stripKeys(item);
}

export async function notifyHospitalAdmins(
  hospitalId: string,
  input: Omit<Parameters<typeof createNotification>[0], "userId">,
) {
  const adminIds: string[] = [];

  try {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "entityType = :entityType AND #role = :role AND hospitalId = :hospitalId",
        ExpressionAttributeNames: { "#role": "role" },
        ExpressionAttributeValues: {
          ":entityType": "USER",
          ":role": "admin",
          ":hospitalId": hospitalId,
        },
      }),
    );
    for (const item of result.Items ?? []) {
      const id = String(item.id ?? "").trim();
      if (id) adminIds.push(id);
    }
  } catch (error) {
    console.warn("Admin scan failed, using demo admins:", error);
  }

  if (adminIds.length === 0) {
    for (const user of DEMO_USERS) {
      if (user.role === "admin" && user.hospitalId === hospitalId) {
        adminIds.push(user.id);
      }
    }
  }

  const unique = [...new Set(adminIds)];
  for (const userId of unique) {
    try {
      await createNotification({ ...input, userId });
    } catch (err) {
      console.warn("Admin notification failed for", userId, err);
    }
  }
}
