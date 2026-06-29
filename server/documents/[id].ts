import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../lib/auth.js";
import { listMotherRecordsFast } from "../lib/mothers.js";
import { canAccessMother } from "../lib/access.js";
import {
  deleteDocumentRecord,
  documentMetaToClient,
  getDocumentContentBase64,
  getDocumentMeta,
} from "../lib/document-records";
import { json, methodNotAllowed } from "../lib/handler.js";

/** GET/DELETE /api/documents/:id — download or delete */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const id = String(req.query.id ?? "").trim();
  if (!id) return json(res, 400, { error: "Document id is required" });

  const hospitalId = String(user.hospitalId ?? "ELR");
  const role = String(user.role);

  const meta = await getDocumentMeta(id);
  if (!meta || meta.hospitalId !== hospitalId) {
    return json(res, 404, { error: "Document not found" });
  }

  const mothers = await listMotherRecordsFast(hospitalId);
  const mother = mothers.find((m) => String(m.id) === meta.patientId);

  if (role === "mother") {
    if (String(user.motherId) !== meta.patientId) {
      return json(res, 403, { error: "Access denied" });
    }
  } else if (role === "nurse" || role === "doctor") {
    if (!mother || !canAccessMother(user, mother)) {
      return json(res, 403, { error: "Access denied" });
    }
  } else if (role !== "admin") {
    return json(res, 403, { error: "Access denied" });
  }

  if (req.method === "GET") {
    try {
      const contentBase64 = await getDocumentContentBase64(id, meta.chunkCount);
      if (!contentBase64) {
        return json(res, 404, { error: "Document content not found" });
      }

      return json(res, 200, {
        item: documentMetaToClient(meta),
        contentBase64,
        mimeType: meta.mimeType,
        source: "dynamodb",
      });
    } catch (error) {
      console.error("Document GET failed:", error);
      return json(res, 500, { error: "Failed to download document" });
    }
  }

  if (req.method === "DELETE") {
    if (role === "mother") {
      return json(res, 403, { error: "Mothers cannot delete documents" });
    }

    try {
      await deleteDocumentRecord(id, meta.chunkCount);
      return json(res, 200, { ok: true, source: "dynamodb" });
    } catch (error) {
      console.error("Document DELETE failed:", error);
      return json(res, 500, { error: "Failed to delete document" });
    }
  }

  return methodNotAllowed(res, ["GET", "DELETE"]);
}
