import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth.js";
import { listMotherRecordsFast } from "./lib/mothers.js";
import { canAccessMother } from "./lib/access.js";
import {
  documentMetaToClient,
  documentStorageSource,
  listDocumentRecords,
  MAX_DOCUMENT_BYTES,
  putDocumentRecord,
} from "./lib/document-records";
import { listDocumentSessions } from "./lib/document-session-store.js";
import { json, methodNotAllowed, readBody } from "./lib/handler.js";
import { createNotification } from "./lib/notifications.js";
import { resolveMotherUserId } from "./lib/fast-fallback.js";

function filterDocumentsForUser(
  user: Record<string, unknown>,
  mothers: Record<string, unknown>[],
  items: Awaited<ReturnType<typeof listDocumentRecords>>,
) {
  const role = String(user.role);
  const userId = String(user.id);

  if (role === "admin") return items;

  if (role === "mother") {
    return items.filter((d) => d.patientId === String(user.motherId ?? ""));
  }

  const allowedPatientIds = new Set(
    mothers
      .filter((m) => canAccessMother(user, m))
      .map((m) => String(m.id)),
  );

  const filtered = items.filter(
    (d) => allowedPatientIds.has(d.patientId) || d.uploadedByUserId === userId,
  );

  if (items.length > filtered.length) {
    console.warn("[documents] access filter removed items", {
      before: items.length,
      after: filtered.length,
      mothers: mothers.length,
      allowedPatients: allowedPatientIds.size,
      role,
      userId,
    });
  }

  return filtered;
}

/** GET/POST /api/documents — list and upload (specialists only) */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const hospitalId = String(user.hospitalId ?? "ELR");
  const role = String(user.role);

  if (req.method === "GET") {
    let patientId =
      typeof req.query.patientId === "string" ? req.query.patientId.trim() : undefined;

    if (role === "mother") {
      patientId = String(user.motherId ?? "");
      if (!patientId) return json(res, 200, { items: [], source: "session" });
    }

    try {
      const mothers = await listMotherRecordsFast(hospitalId);
      let items = await listDocumentRecords(hospitalId, patientId);
      items = filterDocumentsForUser(user, mothers, items);

      const source = items.some((d) => documentStorageSource(d.id) === "session")
        ? "session"
        : "dynamodb";

      console.info("[documents] GET ok", {
        hospitalId,
        patientId: patientId ?? "all",
        role,
        count: items.length,
        source,
      });

      return json(res, 200, {
        items: items.map(documentMetaToClient),
        source,
      });
    } catch (error) {
      console.error("[documents] GET failed, returning session-only fallback:", error);
      const mothers = await listMotherRecordsFast(hospitalId).catch(() => []);
      let items = listDocumentSessions(hospitalId, patientId);
      items = filterDocumentsForUser(user, mothers, items);
      return json(res, 200, {
        items: items.map(documentMetaToClient),
        source: "session",
      });
    }
  }

  if (req.method === "POST") {
    if (role === "mother") {
      return json(res, 403, { error: "Mothers cannot upload documents" });
    }

    try {
      const body = await readBody<Record<string, unknown>>(req);
      const patientId = String(body?.patientId ?? "").trim();
      const name = String(body?.name ?? "").trim();
      const contentBase64 = String(body?.contentBase64 ?? "").trim();
      const mimeType = String(body?.mimeType ?? "application/pdf").trim();
      const category = String(body?.category ?? "Medical Records").trim();

      console.info("[documents] POST start", {
        patientId,
        name,
        category,
        mimeType,
        base64Length: contentBase64.length,
        role,
        userId: user.id,
      });

      if (!patientId || !name || !contentBase64) {
        console.warn("[documents] POST rejected: missing fields", {
          hasPatientId: Boolean(patientId),
          hasName: Boolean(name),
          hasContent: Boolean(contentBase64),
        });
        return json(res, 400, { error: "patientId, name, and contentBase64 are required" });
      }

      const buffer = Buffer.from(contentBase64, "base64");
      if (buffer.length > MAX_DOCUMENT_BYTES) {
        console.warn("[documents] POST rejected: file too large", { bytes: buffer.length });
        return json(res, 400, {
          error: `File exceeds ${MAX_DOCUMENT_BYTES / (1024 * 1024)}MB limit`,
        });
      }

      const mothers = await listMotherRecordsFast(hospitalId);
      const mother = mothers.find((m) => String(m.id) === patientId);
      if (!mother) {
        console.warn("[documents] POST rejected: patient not found", { patientId });
        return json(res, 404, { error: "Patient not found" });
      }

      if (!canAccessMother(user, mother)) {
        console.warn("[documents] POST rejected: access denied", {
          patientId,
          userId: user.id,
          role,
        });
        return json(res, 403, { error: "You can only upload for mothers assigned to you" });
      }

      const meta = await putDocumentRecord(
        {
          patientId,
          name,
          category,
          date: new Date().toISOString().slice(0, 10),
          uploadedBy: String(user.name),
          uploadedByUserId: String(user.id),
          mimeType,
          status: "reviewed",
          hospitalId,
        },
        contentBase64,
      );

      const source = documentStorageSource(meta.id);
      console.info("[documents] POST ok", {
        id: meta.id,
        patientId,
        name,
        sizeBytes: meta.sizeBytes,
        source,
      });

      const motherUserId = resolveMotherUserId(patientId);
      if (motherUserId) {
        await createNotification({
          userId: motherUserId,
          type: "document",
          title: "New document shared",
          body: `${user.name} uploaded "${name}" (${category}). View it in Documents.`,
          motherId: patientId,
        }).catch((err) => console.warn("[documents] mother notify failed:", err));
      }

      return json(res, 201, { item: documentMetaToClient(meta), source });
    } catch (error) {
      console.error("[documents] POST failed:", error);
      const msg = error instanceof Error ? error.message : "Failed to upload document";
      return json(res, 500, { error: msg });
    }
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
