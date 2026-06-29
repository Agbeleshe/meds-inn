import { useCallback, useEffect, useState } from "react";
import type { ClinicalDocument } from "@/types/clinical";
import {
  deleteDocument,
  downloadDocument,
  fetchDocuments,
  uploadDocument,
} from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useMothers } from "@/hooks/use-mothers";
import { ACTIVE_HOSPITAL_ID } from "@/lib/hospitals";
import { downloadBase64File } from "@/lib/download-file";

export function useDocuments(patientId?: string) {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId ?? ACTIVE_HOSPITAL_ID;
  const { mothers } = useMothers();
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<"dynamodb" | "demo" | "session">("dynamodb");

  const effectivePatientId =
    user?.role === "mother" ? user.motherId : patientId;

  const load = useCallback(async (overridePatientId?: string) => {
    const queryPatientId = overridePatientId ?? effectivePatientId;
    setLoading(true);
    setError(null);
    try {
      console.info("[documents] fetching list", {
        patientId: queryPatientId ?? "all",
      });
      const res = await fetchDocuments(
        queryPatientId ? { patientId: queryPatientId } : undefined,
      );
      console.info("[documents] fetch ok", {
        count: res.items.length,
        source: res.source,
      });
      setDocuments(res.items as ClinicalDocument[]);
      setSource(
        res.source === "session"
          ? "session"
          : res.source === "dynamodb"
            ? "dynamodb"
            : "demo",
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[documents] fetch failed:", error);
      setError(error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [effectivePatientId]);

  useEffect(() => {
    load();
  }, [load, hospitalId]);

  return {
    documents,
    loading,
    error,
    source,
    refetch: load,
    canUpload: user?.role !== "mother",
    canDelete: user?.role !== "mother",
    mothers,
    async upload(payload: {
      patientId: string;
      name: string;
      category: string;
      mimeType: string;
      contentBase64: string;
    }) {
      console.info("[documents] upload start", {
        patientId: payload.patientId,
        name: payload.name,
        category: payload.category,
        mimeType: payload.mimeType,
        base64Length: payload.contentBase64.length,
      });

      const res = await uploadDocument(payload);
      const uploaded = res.item as ClinicalDocument;
      console.info("[documents] upload ok", {
        id: uploaded.id,
        patientId: uploaded.patientId,
        source: res.source,
      });

      setDocuments((prev) => [
        uploaded,
        ...prev.filter((doc) => doc.id !== uploaded.id),
      ]);
      setSource(res.source === "session" ? "session" : "dynamodb");

      try {
        await load(payload.patientId);
      } catch (err) {
        console.error(
          "[documents] refetch after upload failed (keeping uploaded item):",
          err,
        );
      }

      return uploaded;
    },
    async downloadFile(id: string, fallbackName: string) {
      const res = await downloadDocument(id);
      if (!res.contentBase64) {
        throw new Error("Document content unavailable");
      }
      downloadBase64File(res.contentBase64, fallbackName, res.mimeType || "application/octet-stream");
    },
    async remove(id: string) {
      await deleteDocument(id);
      await load();
    },
  };
}
