import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX, PARTITION_KEY, SORT_KEY, stripKeys } from "./dynamodb";
import { findDemoUserRecord, getDemoUserRecordById } from "./demo-auth";
import { withTimeout } from "./fast-fallback";

const SESSION_PREFIX = "Bearer ";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string) {
  return EMAIL_RE.test(email.trim());
}

export function getBearerToken(req: { headers: Record<string, string | string[] | undefined> }) {
  const header = req.headers.authorization ?? req.headers.Authorization;
  if (!header || typeof header !== "string") return null;
  if (!header.startsWith(SESSION_PREFIX)) return null;
  return header.slice(SESSION_PREFIX.length).trim() || null;
}

export function stripSensitive(user: Record<string, unknown>) {
  const { password: _password, ...rest } = user;
  return rest;
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function getUserById(userId: string) {
  const record = await getUserRecordById(userId);
  if (!record) return null;
  return stripSensitive(record);
}

async function getUserFromDynamoDB(userId: string) {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: `${ENTITY_PREFIX.user}${userId}`,
        [SORT_KEY]: "PROFILE",
      },
    }),
  );
  if (!result.Item) return null;
  const user = stripKeys(result.Item as Record<string, unknown>);
  if (!user.id) {
    user.id = user.userId || userId;
  }
  return user;
}

export async function getUserRecordById(userId: string) {
  const demo = getDemoUserRecordById(userId);
  // Try DynamoDB with a generous timeout; retry once for newly created accounts
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fromDb = await withTimeout(getUserFromDynamoDB(userId), 5000, null);
      if (fromDb) return fromDb;
    } catch (error) {
      console.warn(`DynamoDB getUserById failed (attempt ${attempt + 1}):`, error);
    }
    // Brief wait before retry (only runs on first failed attempt)
    if (attempt === 0) await new Promise((r) => setTimeout(r, 800));
  }

  return demo;
}

async function findUserInDynamoDB(email: string, role: string, hospitalId: string) {
  const normalized = email.trim().toLowerCase();
  const lookupKey = `${ENTITY_PREFIX.userLookup}${normalized}#${hospitalId}#${role}`;

  const lookup = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: lookupKey,
        [SORT_KEY]: "PROFILE",
      },
    }),
  );

  if (lookup.Item?.userId) {
    const user = await getUserFromDynamoDB(String(lookup.Item.userId));
    if (user) {
      if (!user.id) {
        user.id = String(lookup.Item.userId);
      }
      return user;
    }
  }

  let lastKey: Record<string, unknown> | undefined;
  do {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression:
          "entityType = :type AND (email = :email OR username = :email) AND #role = :role AND hospitalId = :hospitalId",
        ExpressionAttributeNames: { "#role": "role" },
        ExpressionAttributeValues: {
          ":type": "USER",
          ":email": normalized,
          ":role": role,
          ":hospitalId": hospitalId,
        },
        ExclusiveStartKey: lastKey,
      }),
    );

    const item = result.Items?.[0];
    if (item) {
      const user = stripKeys(item as Record<string, unknown>);
      if (!user.id && item[PARTITION_KEY]) {
        const pk = String(item[PARTITION_KEY]);
        if (pk.startsWith(ENTITY_PREFIX.user)) {
          user.id = pk.slice(ENTITY_PREFIX.user.length);
        }
      }
      if (!user.id) {
        user.id = user.userId;
      }
      return user;
    }

    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return null;
}

export async function findUserByCredentials(
  email: string,
  role: string,
  hospitalId: string,
) {
  try {
    const fromDb = await findUserInDynamoDB(email, role, hospitalId);
    if (fromDb) return fromDb;
  } catch (error) {
    console.warn("DynamoDB credential lookup failed, trying demo fallback:", error);
  }

  return findDemoUserRecord(email, role, hospitalId);
}

export async function emailTaken(email: string, hospitalId: string, role: string) {
  const existing = await findUserByCredentials(email, role, hospitalId);
  return Boolean(existing);
}

export async function putUserItem(item: Record<string, unknown>) {
  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );
}

export async function putUserWithLookup(
  userItem: Record<string, unknown>,
  lookupItem: Record<string, unknown>,
) {
  await putUserItem(userItem);
  await putUserItem(lookupItem);
}

export async function putWaitlistEntry(email: string) {
  const normalized = email.trim().toLowerCase();
  const item = {
    [PARTITION_KEY]: `${ENTITY_PREFIX.waitlist}${normalized}`,
    [SORT_KEY]: "METADATA",
    entityType: "WAITLIST",
    email: normalized,
    type: "hospital",
    createdAt: new Date().toISOString(),
  };
  await dynamodb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}
