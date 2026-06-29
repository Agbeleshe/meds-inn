import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../lib/auth";
import { getMotherRecordResolved } from "../lib/mothers";
import { createNotification } from "../lib/notifications";
import { resolveMotherUserId } from "../lib/fast-fallback";
import {
  buildThreadId,
  formatMessageTime,
  getChatThreadRecord,
  listChatMessageRecords,
  listChatThreadRecords,
  putChatMessageRecord,
  putChatThreadRecord,
} from "../lib/chat-records";
import {
  canAccessChatThread,
  canStartChatWithSpecialist,
  filterChatThreadsForUser,
} from "../../src/lib/chat-access";
import { getSpecialistProfile } from "../../src/lib/specialist-profiles";
import { firstMessageSubject } from "../../src/lib/chat-display";
import { json, methodNotAllowed, readBody } from "../lib/handler";
import type { ChatMessage, ChatThread } from "../../src/types/clinical";

/** GET/POST /api/messages/threads */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const hospitalId = String(user.hospitalId ?? "ELR");
  const userRef = {
    id: String(user.id),
    role: user.role as "admin" | "nurse" | "doctor" | "mother",
    motherId: user.motherId as string | undefined,
    hospitalId,
  };

  if (req.method === "GET") {
    try {
      const threads = filterChatThreadsForUser(
        await listChatThreadRecords(hospitalId),
        userRef,
      );
      return json(res, 200, { items: threads, source: "dynamodb" });
    } catch (error) {
      console.error("Chat threads GET failed:", error);
      return json(res, 500, { error: "Failed to load chat threads" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = await readBody<{
        patientId?: string;
        specialistUserId?: string;
        subject?: string;
        text?: string;
      }>(req);

      const patientId = body?.patientId?.trim();
      const specialistUserId = body?.specialistUserId?.trim();
      const text = body?.text?.trim();
      const subject = body?.subject?.trim() || "";

      if (!patientId || !specialistUserId || !text) {
        return json(res, 400, {
          error: "patientId, specialistUserId, and text are required",
        });
      }

      const mother = await getMotherRecordResolved(patientId);
      if (!mother) return json(res, 404, { error: "Patient not found" });

      if (
        !canStartChatWithSpecialist(userRef, mother as Parameters<typeof canStartChatWithSpecialist>[1], specialistUserId)
      ) {
        return json(res, 403, { error: "You cannot start this conversation" });
      }

      const threadId = buildThreadId(patientId, specialistUserId);
      let thread = await getChatThreadRecord(threadId);
      const specialist = getSpecialistProfile(specialistUserId);
      const now = new Date().toISOString();

      if (!thread) {
        thread = {
          id: threadId,
          patientId,
          patientName: String(mother.name ?? "Patient"),
          specialistUserId,
          specialistName: specialist?.name ?? "Care team",
          specialistRole: specialist?.role ?? "nurse",
          hospitalId,
          subject: subject || firstMessageSubject(text),
          preview: text.slice(0, 120),
          lastMessageAt: now,
          unreadForPatient: userRef.role !== "mother",
          unreadForSpecialist: userRef.role === "mother",
          urgent: false,
        } satisfies ChatThread;
        putChatThreadRecord(thread);
      }

      const message: ChatMessage = {
        id: `chat-${Date.now()}`,
        threadId,
        patientId,
        senderUserId: userRef.id,
        senderName: String(user.name),
        senderRole: String(user.role),
        text,
        createdAt: now,
      };
      putChatMessageRecord(message);

      const updatedThread: ChatThread = {
        ...thread,
        subject:
          !thread.subject || thread.subject === "New conversation"
            ? firstMessageSubject(text)
            : thread.subject,
        preview: text.slice(0, 120),
        lastMessageAt: now,
        unreadForPatient: userRef.role !== "mother",
        unreadForSpecialist: userRef.role === "mother",
      };
      putChatThreadRecord(updatedThread);

      const notifyUserId =
        userRef.role === "mother" ? specialistUserId : resolveMotherUserId(patientId);

      if (notifyUserId) {
        void createNotification({
          userId: notifyUserId,
          type: "message",
          title: `New message from ${user.name}`,
          body: text.slice(0, 200),
          motherId: patientId,
        }).catch(() => undefined);
      }

      return json(res, 201, {
        thread: updatedThread,
        message: { ...message, displayTime: formatMessageTime(now) },
        source: "dynamodb",
      });
    } catch (error) {
      console.error("Chat threads POST failed:", error);
      return json(res, 500, { error: "Failed to start conversation" });
    }
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
