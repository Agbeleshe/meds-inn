import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getBearerToken, getUserRecordById } from "./lib/auth.js";
import { canEditMotherCare } from "../src/lib/assignments.js";
import { getMotherRecordResolved } from "./lib/mothers.js";
import { createNotification } from "./lib/notifications.js";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX, stripKeys } from "./lib/dynamodb.js";
import { toMessageItem } from "./lib/items.js";
import { prefixFilter } from "./lib/items.js";
import { json, methodNotAllowed, readBody } from "./lib/handler.js";

/** GET/POST /api/messages */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  if (req.method === "GET") {
    try {
      const patientId =
        typeof req.query.patientId === "string" ? req.query.patientId.trim() : undefined;

      const result = await dynamodb.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          Limit: 100,
          ...prefixFilter(ENTITY_PREFIX.message),
        }),
      );

      let items = (result.Items ?? []).map((item) =>
        stripKeys(item as Record<string, unknown>),
      );

      if (user.role === "mother") {
        items = items.filter((m) => String(m.patientId) === String(user.motherId));
      } else if (patientId) {
        items = items.filter((m) => String(m.patientId) === patientId);
      }

      return json(res, 200, { items, source: "dynamodb" });
    } catch (error) {
      console.error("Messages GET failed:", error);
      return json(res, 500, { error: "Failed to load messages" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = await readBody<{
        patientId?: string;
        subject?: string;
        text?: string;
      }>(req);

      const patientId = body?.patientId?.trim();
      const text = body?.text?.trim();
      const subject = body?.subject?.trim() ?? "Message from your care team";

      if (!patientId || !text) {
        return json(res, 400, { error: "patientId and text are required" });
      }

      const mother = await getMotherRecordResolved(patientId);
      if (!mother) return json(res, 404, { error: "Mother not found" });

      if (!canEditMotherCare(
        { id: String(user.id), role: user.role as "admin" | "nurse" | "doctor", name: String(user.name ?? "") },
        {
          assignedNurseUserId: mother.assignedNurseUserId,
          assignedDoctorUserId: mother.assignedDoctorUserId,
          nurse: mother.nurse,
          doctor: mother.doctor,
        },
      )) {
        return json(res, 403, { error: "You are not assigned to this mother" });
      }

      const id = `msg-${Date.now()}`;
      const now = new Date().toISOString();
      const message = {
        id,
        patientId,
        from: String(user.name),
        role: String(user.role),
        initials: String(user.initials ?? "??"),
        subject,
        preview: text.slice(0, 120),
        time: "Just now",
        read: false,
        urgent: false,
        tag: "Care Plan",
        thread: [{ from: String(user.name), role: String(user.role), time: "Just now", text }],
        createdAt: now,
      };

      const item = toMessageItem({ ...message, patientId });
      await dynamodb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

      // Notify mother's user account if linked
      const motherUserId = await findMotherUserId(patientId);
      if (motherUserId) {
        await createNotification({
          userId: motherUserId,
          type: "message",
          title: `New message: ${subject}`,
          body: text.slice(0, 200),
          motherId: patientId,
        });
      }

      return json(res, 201, { item: stripKeys(item), source: "dynamodb" });
    } catch (error) {
      console.error("Messages POST failed:", error);
      return json(res, 500, { error: "Failed to send message" });
    }
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}

async function findMotherUserId(motherId: string) {
  const result = await dynamodb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "entityType = :type AND motherId = :mid",
      ExpressionAttributeValues: {
        ":type": "USER",
        ":mid": motherId,
      },
      Limit: 5,
    }),
  );
  const user = result.Items?.[0];
  return user ? String(stripKeys(user as Record<string, unknown>).id) : null;
}
