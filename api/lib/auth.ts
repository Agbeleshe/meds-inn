import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX, PARTITION_KEY, SORT_KEY, stripKeys } from "./dynamodb";
import { findDemoUserRecord, getDemoUserRecordById } from "./demo-auth";

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
  return stripKeys(result.Item as Record<string, unknown>);
}

export async function getUserRecordById(userId: string) {
  try {
    const fromDb = await getUserFromDynamoDB(userId);
    if (fromDb) return fromDb;
  } catch (error) {
    console.warn("DynamoDB getUserById failed, trying demo fallback:", error);
  }

  return getDemoUserRecordById(userId);
}

async function findUserInDynamoDB(username: string, role: string, hospitalId: string) {
  const normalized = normalizeUsername(username);
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
    if (user) return user;
  }

  let lastKey: Record<string, unknown> | undefined;
  do {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression:
          "entityType = :type AND username = :username AND #role = :role AND hospitalId = :hospitalId",
        ExpressionAttributeNames: { "#role": "role" },
        ExpressionAttributeValues: {
          ":type": "USER",
          ":username": normalized,
          ":role": role,
          ":hospitalId": hospitalId,
        },
        ExclusiveStartKey: lastKey,
      }),
    );

    const item = result.Items?.[0];
    if (item) return stripKeys(item as Record<string, unknown>);

    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return null;
}

export async function findUserByCredentials(
  username: string,
  role: string,
  hospitalId: string,
) {
  try {
    const fromDb = await findUserInDynamoDB(username, role, hospitalId);
    if (fromDb) return fromDb;
  } catch (error) {
    console.warn("DynamoDB credential lookup failed, trying demo fallback:", error);
  }

  return findDemoUserRecord(username, role, hospitalId);
}

export async function usernameTaken(username: string, hospitalId: string, role: string) {
  const existing = await findUserByCredentials(username, role, hospitalId);
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
