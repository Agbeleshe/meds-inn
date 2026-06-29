import { GetCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  dynamodb,
  TABLE_NAME,
  ENTITY_PREFIX,
  PARTITION_KEY,
  SORT_KEY,
  stripKeys,
} from "./dynamodb";
import { withTimeout } from "./fast-fallback";
import { toChatMessageItem, toChatThreadItem, prefixFilter } from "./items";
import { buildThreadId } from "../../src/lib/chat-demo-data";
import {
  getChatThreadSession,
  listChatMessageSessions,
  listChatThreadSessions,
  saveChatMessageSession,
  saveChatThreadSession,
  updateChatMessageSession,
} from "./chat-session-store";
import type { ChatMessage, ChatThread } from "../../src/types/clinical";

function normalizeThread(raw: Record<string, unknown>): ChatThread {
  return {
    id: String(raw.id),
    patientId: String(raw.patientId),
    patientName: String(raw.patientName ?? ""),
    specialistUserId: String(raw.specialistUserId),
    specialistName: String(raw.specialistName ?? ""),
    specialistRole: raw.specialistRole === "doctor" ? "doctor" : "nurse",
    hospitalId: String(raw.hospitalId ?? "ELR"),
    subject: String(raw.subject ?? "Care team chat"),
    preview: String(raw.preview ?? ""),
    lastMessageAt: String(raw.lastMessageAt ?? new Date().toISOString()),
    unreadForPatient: Boolean(raw.unreadForPatient),
    unreadForSpecialist: Boolean(raw.unreadForSpecialist),
    urgent: Boolean(raw.urgent),
  };
}

function normalizeMessage(raw: Record<string, unknown>): ChatMessage {
  const msg: ChatMessage = {
    id: String(raw.id),
    threadId: String(raw.threadId),
    patientId: String(raw.patientId),
    senderUserId: String(raw.senderUserId),
    senderName: String(raw.senderName),
    senderRole: String(raw.senderRole),
    text: String(raw.text ?? ""),
    createdAt: String(raw.createdAt),
    urgent: Boolean(raw.urgent),
  };
  if (raw.deleted) msg.deleted = true;
  if (raw.deletedAt) msg.deletedAt = String(raw.deletedAt);
  if (raw.edited) msg.edited = true;
  if (raw.editedAt) msg.editedAt = String(raw.editedAt);
  if (raw.originalText) msg.originalText = String(raw.originalText);
  if (Array.isArray(raw.editHistory)) {
    msg.editHistory = raw.editHistory.map(String);
  }
  return msg;
}

function mergeThreads(base: ChatThread[], extra: ChatThread[]) {
  const map = new Map<string, ChatThread>();
  for (const t of base) map.set(t.id, t);
  for (const t of extra) map.set(t.id, t);
  return Array.from(map.values()).sort(
    (a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
}

function mergeMessages(base: ChatMessage[], extra: ChatMessage[]) {
  const map = new Map<string, ChatMessage>();
  for (const m of base) map.set(m.id, m);
  for (const m of extra) map.set(m.id, m);
  return Array.from(map.values()).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export async function listChatThreadRecords(hospitalId?: string) {
  let dbThreads: ChatThread[] = [];
  try {
    dbThreads = await withTimeout(
      dynamodb
        .send(
          new ScanCommand({
            TableName: TABLE_NAME,
            Limit: 200,
            FilterExpression: "entityType = :type",
            ExpressionAttributeValues: { ":type": "CHAT_THREAD" },
          }),
        )
        .then((result) =>
          (result.Items ?? []).map((item) =>
            normalizeThread(stripKeys(item as Record<string, unknown>)),
          ),
        ),
      2000,
      [],
    );
  } catch (error) {
    console.warn("Chat thread scan failed:", error);
  }

  const session = listChatThreadSessions().filter(
    (t) => !hospitalId || t.hospitalId === hospitalId,
  );

  return mergeThreads(dbThreads, session).filter(
    (t) => !hospitalId || t.hospitalId === hospitalId,
  );
}

export async function getChatThreadRecord(threadId: string) {
  try {
    const item = await withTimeout(
      dynamodb
        .send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: {
              [PARTITION_KEY]: `${ENTITY_PREFIX.chat}${threadId}`,
              [SORT_KEY]: "METADATA",
            },
          }),
        )
        .then((result) => result.Item ?? null),
      1500,
      null,
    );
    if (item) {
      return normalizeThread(stripKeys(item as Record<string, unknown>));
    }
  } catch {
    /* fall through */
  }

  const session = getChatThreadSession(threadId);
  if (session) return session;

  return null;
}

export async function listChatMessageRecords(threadId: string) {
  let dbMessages: ChatMessage[] = [];
  try {
    dbMessages = await withTimeout(
      dynamodb
        .send(
          new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
            ExpressionAttributeNames: { "#pk": PARTITION_KEY, "#sk": SORT_KEY },
            ExpressionAttributeValues: {
              ":pk": `${ENTITY_PREFIX.chat}${threadId}`,
              ":prefix": "MSG#",
            },
          }),
        )
        .then((result) =>
          (result.Items ?? []).map((item) =>
            normalizeMessage(stripKeys(item as Record<string, unknown>)),
          ),
        ),
      2000,
      [],
    );
  } catch (error) {
    console.warn("Chat message query failed:", error);
  }

  const session = listChatMessageSessions(threadId);

  return mergeMessages(dbMessages, session);
}

export function putChatThreadRecord(thread: ChatThread) {
  saveChatThreadSession(thread);
  void dynamodb
    .send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toChatThreadItem(thread),
      }),
    )
    .catch((error) => console.warn("Chat thread put failed:", error));
  return thread;
}

export function putChatMessageRecord(message: ChatMessage) {
  saveChatMessageSession(message);
  void dynamodb
    .send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toChatMessageItem(message, message.threadId),
      }),
    )
    .catch((error) => console.warn("Chat message put failed:", error));
  return message;
}

export function updateChatMessageRecord(message: ChatMessage) {
  updateChatMessageSession(message);
  void dynamodb
    .send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toChatMessageItem(message, message.threadId),
      }),
    )
    .catch((error) => console.warn("Chat message update failed:", error));
  return message;
}

function sanitizeMessageForRole(
  message: ChatMessage,
  role: string,
): ChatMessage & { displayTime?: string } {
  const isAdmin = role === "admin";
  if (message.deleted && !isAdmin) {
    return { ...message, text: "" };
  }
  if (!isAdmin) {
    const { originalText: _o, editHistory: _h, ...rest } = message;
    return rest;
  }
  return message;
}

export { sanitizeMessageForRole };

export { buildThreadId };

export function formatMessageTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
