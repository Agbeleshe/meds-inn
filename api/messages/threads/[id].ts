import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../../lib/auth";
import { createNotification } from "../../lib/notifications";
import { resolveMotherUserId } from "../../lib/fast-fallback";
import { getMotherRecordResolved } from "../../lib/mothers";
import {
  formatMessageTime,
  getChatThreadRecord,
  listChatMessageRecords,
  putChatMessageRecord,
  putChatThreadRecord,
  sanitizeMessageForRole,
  updateChatMessageRecord,
} from "../../lib/chat-records";
import { canAccessChatThread, canStartChatWithSpecialist } from "../../../src/lib/chat-access";
import { firstMessageSubject } from "../../../src/lib/chat-display";
import { CHAT_EDIT_WINDOW_MS } from "../../../src/lib/chat-constants";
import { getSpecialistProfile } from "../../../src/lib/specialist-profiles";
import { json, methodNotAllowed, readBody } from "../../lib/handler";
import type { ChatMessage, ChatThread } from "../../../src/types/clinical";

const PLACEHOLDER_SUBJECTS = new Set(["", "New conversation", "Care team chat"]);

function threadNeedsSubject(thread: ChatThread) {
  return !thread.subject || PLACEHOLDER_SUBJECTS.has(thread.subject);
}

async function resolveThreadAccess(
  threadId: string,
  userRef: {
    id: string;
    role: "admin" | "nurse" | "doctor" | "mother";
    motherId?: string;
    hospitalId: string;
  },
): Promise<ChatThread | null> {
  const existing = await getChatThreadRecord(threadId);
  if (existing) {
    if (!canAccessChatThread(userRef, existing)) return null;
    return existing;
  }

  const parts = threadId.split("#");
  if (parts.length !== 2) return null;
  const [patientId, specialistUserId] = parts;

  const mother = await getMotherRecordResolved(patientId);
  if (!mother) return null;

  if (
    !canStartChatWithSpecialist(
      userRef,
      mother as Parameters<typeof canStartChatWithSpecialist>[1],
      specialistUserId,
    )
  ) {
    return null;
  }

  const specialist = getSpecialistProfile(specialistUserId);
  return {
    id: threadId,
    patientId,
    patientName: String(mother.name ?? "Patient"),
    specialistUserId,
    specialistName: specialist?.name ?? "Care team",
    specialistRole: specialist?.role ?? "nurse",
    hospitalId: String(mother.hospitalId ?? userRef.hospitalId),
    subject: "",
    preview: "",
    lastMessageAt: new Date(0).toISOString(),
    unreadForPatient: false,
    unreadForSpecialist: false,
    urgent: false,
  };
}

/** GET/POST/PATCH/PUT /api/messages/threads/[id] */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const threadId =
    typeof req.query.id === "string" ? decodeURIComponent(req.query.id) : undefined;
  if (!threadId) return json(res, 400, { error: "Thread id is required" });

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const userRef = {
    id: String(user.id),
    role: user.role as "admin" | "nurse" | "doctor" | "mother",
    motherId: user.motherId as string | undefined,
    hospitalId: String(user.hospitalId ?? "ELR"),
  };

  const thread = await resolveThreadAccess(threadId, userRef);
  if (!thread) return json(res, 404, { error: "Conversation not found" });

  if (req.method === "GET") {
    try {
      const messages = await listChatMessageRecords(threadId);
      const role = String(user.role);
      return json(res, 200, {
        thread,
        items: messages.map((m) => ({
          ...sanitizeMessageForRole(m, role),
          displayTime: formatMessageTime(m.createdAt),
        })),
        source: "dynamodb",
      });
    } catch (error) {
      console.error("Chat messages GET failed:", error);
      return json(res, 500, { error: "Failed to load messages" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = await readBody<{ text?: string; urgent?: boolean }>(req);
      const text = body?.text?.trim();
      if (!text) return json(res, 400, { error: "text is required" });

      const now = new Date().toISOString();
      const message: ChatMessage = {
        id: `chat-${Date.now()}`,
        threadId,
        patientId: thread.patientId,
        senderUserId: userRef.id,
        senderName: String(user.name),
        senderRole: String(user.role),
        text,
        createdAt: now,
        urgent: Boolean(body?.urgent),
      };
      putChatMessageRecord(message);

      const persisted = await getChatThreadRecord(threadId);
      const subject = threadNeedsSubject(thread) ? firstMessageSubject(text) : thread.subject;
      const updatedThread: ChatThread = {
        ...thread,
        subject: persisted && !threadNeedsSubject(persisted) ? persisted.subject : subject,
        preview: text.slice(0, 120),
        lastMessageAt: now,
        unreadForPatient: userRef.role !== "mother",
        unreadForSpecialist: userRef.role === "mother",
        urgent: Boolean(body?.urgent) || thread.urgent,
      };
      putChatThreadRecord(updatedThread);

      const recipientId =
        userRef.role === "mother"
          ? thread.specialistUserId
          : resolveMotherUserId(thread.patientId);

      if (recipientId && recipientId !== userRef.id) {
        void createNotification({
          userId: recipientId,
          type: "message",
          title: `New message from ${user.name}`,
          body: text.slice(0, 200),
          motherId: thread.patientId,
        }).catch(() => undefined);
      }

      return json(res, 201, {
        item: { ...message, displayTime: formatMessageTime(now) },
        thread: updatedThread,
        source: "dynamodb",
      });
    } catch (error) {
      console.error("Chat messages POST failed:", error);
      return json(res, 500, { error: "Failed to send message" });
    }
  }

  if (req.method === "PUT") {
    try {
      const body = await readBody<{
        messageId?: string;
        action?: "edit" | "delete";
        text?: string;
      }>(req);

      const messageId = body?.messageId?.trim();
      const action = body?.action;
      if (!messageId || !action) {
        return json(res, 400, { error: "messageId and action are required" });
      }

      const messages = await listChatMessageRecords(threadId);
      const message = messages.find((m) => m.id === messageId);
      if (!message) return json(res, 404, { error: "Message not found" });

      if (message.senderUserId !== userRef.id) {
        return json(res, 403, { error: "You can only modify your own messages" });
      }

      const now = new Date().toISOString();

      if (action === "edit") {
        const text = body?.text?.trim();
        if (!text) return json(res, 400, { error: "text is required" });
        if (message.deleted) {
          return json(res, 400, { error: "Deleted messages cannot be edited" });
        }
        const elapsed = Date.now() - new Date(message.createdAt).getTime();
        if (elapsed > CHAT_EDIT_WINDOW_MS) {
          return json(res, 400, { error: "Edit window expired (5 minutes)" });
        }

        const priorHistory = message.editHistory ?? [];
        const updated: ChatMessage = {
          ...message,
          originalText: message.originalText ?? message.text,
          editHistory: message.edited ? [...priorHistory, message.text] : priorHistory,
          text,
          edited: true,
          editedAt: now,
        };
        updateChatMessageRecord(updated);

        return json(res, 200, {
          item: {
            ...sanitizeMessageForRole(updated, String(user.role)),
            displayTime: formatMessageTime(updated.createdAt),
          },
          source: "dynamodb",
        });
      }

      if (action === "delete") {
        const updated: ChatMessage = {
          ...message,
          deleted: true,
          deletedAt: now,
          originalText: message.originalText ?? message.text,
        };
        updateChatMessageRecord(updated);

        return json(res, 200, {
          item: {
            ...sanitizeMessageForRole(updated, String(user.role)),
            displayTime: formatMessageTime(updated.createdAt),
          },
          source: "dynamodb",
        });
      }

      return json(res, 400, { error: "Invalid action" });
    } catch (error) {
      console.error("Chat message PUT failed:", error);
      return json(res, 500, { error: "Failed to update message" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const isPatient = userRef.role === "mother";
      const updated: ChatThread = {
        ...thread,
        unreadForPatient: isPatient ? false : thread.unreadForPatient,
        unreadForSpecialist: !isPatient ? false : thread.unreadForSpecialist,
      };
      putChatThreadRecord(updated);
      return json(res, 200, { thread: updated, source: "dynamodb" });
    } catch (error) {
      console.error("Chat thread PATCH failed:", error);
      return json(res, 500, { error: "Failed to update conversation" });
    }
  }

  return methodNotAllowed(res, ["GET", "POST", "PATCH", "PUT"]);
}
