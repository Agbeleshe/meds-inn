import { useCallback, useEffect, useState } from "react";
import type { BabyChecklistItem, BabyMedication, BabySymptom } from "@/types/clinical";
import {
  fetchBabySymptoms,
  submitBabySymptom,
  fetchBabyMedications,
  createBabyMedication,
  fetchBabyChecklist,
  toggleBabyChecklistItem,
} from "@/lib/api-client";

export function useBabyCare(motherId?: string) {
  const [symptoms, setSymptoms] = useState<BabySymptom[]>([]);
  const [medications, setMedications] = useState<BabyMedication[]>([]);
  const [checklist, setChecklist] = useState<BabyChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!motherId) {
      setSymptoms([]);
      setMedications([]);
      setChecklist([]);
      return;
    }
    setLoading(true);
    try {
      const [symRes, medRes, chkRes] = await Promise.all([
        fetchBabySymptoms(motherId),
        fetchBabyMedications(motherId),
        fetchBabyChecklist(motherId),
      ]);
      setSymptoms((symRes.items ?? []) as unknown as BabySymptom[]);
      setMedications((medRes.items ?? []) as unknown as BabyMedication[]);
      const chk = chkRes.item as { checklist?: BabyChecklistItem[] } | null;
      setChecklist(chk?.checklist ?? []);
    } catch {
      setSymptoms([]);
      setMedications([]);
      setChecklist([]);
    } finally {
      setLoading(false);
    }
  }, [motherId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function logSymptom(payload: { symptom: string; severity?: string; notes?: string }) {
    if (!motherId) return;
    setSaving(true);
    try {
      await submitBabySymptom({ ...payload, motherId });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function addMedication(payload: Record<string, unknown>) {
    if (!motherId) return;
    setSaving(true);
    try {
      await createBabyMedication({ ...payload, motherId });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleChecklist(itemId: string) {
    if (!motherId) return;
    setSaving(true);
    try {
      const res = await toggleBabyChecklistItem(itemId, motherId);
      const chk = res.item as { checklist?: BabyChecklistItem[] };
      setChecklist(chk?.checklist ?? []);
    } finally {
      setSaving(false);
    }
  }

  return {
    symptoms,
    medications,
    checklist,
    loading,
    saving,
    refetch: load,
    logSymptom,
    addMedication,
    toggleChecklist,
  };
}
