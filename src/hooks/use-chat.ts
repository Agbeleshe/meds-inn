import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatThread } from "@/types/clinical";
import {
  fetchChatThreads,
  createChatThread,
  fetchChatMessages,
  sendChatMessage,
  markChatThreadRead,
  editChatMessage,
  deleteChatMessage,
} from "@/lib/api-client";
import { filterChatThreadsForUser } from "@/lib/chat-access";
import { useAuth } from "@/contexts/AuthContext";
import type { DataSource } from "@/hooks/use-api-query";

const THREAD_POLL_MS = 8000;
const MESSAGE_POLL_MS = 5000;

export function useChatThreads() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setThreads([]);
      return;
    }
  }, [user]);

  const syncThreads = useCallback(async (silent = true) => {
    if (!user) return;
    if (!silent) setSyncing(true);

    try {
      const { items, source: apiSource } = await fetchChatThreads();
      if (!mountedRef.current) return;
      setThreads(filterChatThreadsForUser(items as ChatThread[], {
        id: user.id,
        role: user.role,
        motherId: user.motherId,
        hospitalId: user.hospitalId,
      }));
      setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
      setThreads([]);
      setSource("demo");
    } finally {
      if (mountedRef.current) setSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    syncThreads(false);
    const id = window.setInterval(() => syncThreads(true), THREAD_POLL_MS);
    return () => window.clearInterval(id);
  }, [user, syncThreads]);

  const startThread = useCallback(
    async (payload: {
      patientId: string;
      specialistUserId: string;
      subject?: string;
      text: string;
    }) => {
      const result = await createChatThread(payload);
      await syncThreads(true);
      return result;
    },
    [syncThreads],
  );

  return {
    threads,
    source,
    loading: syncing && threads.length === 0,
    syncing,
    error,
    refetch: () => syncThreads(false),
    startThread,
  };
}

export type ChatMessageView = ChatMessage & {
  displayTime?: string;
  pending?: boolean;
};

export function useChatMessages(threadId: string | undefined) {
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const activeThreadIdRef = useRef<string | undefined>(threadId);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    activeThreadIdRef.current = threadId;
    if (!threadId) {
      setMessages([]);
      setThread(null);
      return;
    }
    setMessages([]);
    setThread(null);
  }, [threadId]);

  const syncMessages = useCallback(
    async (silent = true) => {
      const forThreadId = threadId;
      if (!forThreadId) return;
      if (!silent) setSyncing(true);

      try {
        const { items, thread: t } = await fetchChatMessages(forThreadId);
        if (!mountedRef.current || activeThreadIdRef.current !== forThreadId) return;
        const scoped = (items as ChatMessageView[]).filter(
          (m) => m.threadId === forThreadId,
        );
        setMessages(scoped);
        if (t && String((t as ChatThread).id) === forThreadId) {
          setThread(t as ChatThread);
        }
        setError(null);
        markChatThreadRead(forThreadId).catch(() => undefined);
      } catch (err) {
        if (!mountedRef.current || activeThreadIdRef.current !== forThreadId) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setMessages([]);
        setThread(null);
      } finally {
        if (mountedRef.current && activeThreadIdRef.current === forThreadId) {
          setSyncing(false);
        }
      }
    },
    [threadId],
  );

  useEffect(() => {
    if (!threadId) return;
    syncMessages(false);
    const id = window.setInterval(() => syncMessages(true), MESSAGE_POLL_MS);
    return () => window.clearInterval(id);
  }, [threadId, syncMessages]);

  const send = useCallback(
    async (text: string, urgent?: boolean) => {
      if (!threadId || !user) throw new Error("No thread selected");
      if (sending) throw new Error("Already sending");

      const forThreadId = threadId;
      const now = new Date().toISOString();
      const optimisticId = `local-${Date.now()}`;
      const optimistic: ChatMessageView = {
        id: optimisticId,
        threadId: forThreadId,
        patientId: thread?.patientId ?? "",
        senderUserId: user.id,
        senderName: user.name,
        senderRole: user.role,
        text,
        createdAt: now,
        urgent: Boolean(urgent),
        pending: true,
        displayTime: new Date(now).toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        }),
      };

      setSending(true);
      setMessages((prev) => [...prev, optimistic]);

      try {
        const result = await sendChatMessage(forThreadId, { text, urgent });
        if (activeThreadIdRef.current !== forThreadId) return result;
        setMessages((prev) => {
          const withoutLocal = prev.filter((m) => m.id !== optimisticId);
          const sent = { ...(result.item as ChatMessageView), pending: false };
          if (withoutLocal.some((m) => m.id === sent.id)) return withoutLocal;
          return [...withoutLocal, sent];
        });
        if (result.thread) setThread(result.thread as ChatThread);
        void syncMessages(true);
        return result;
      } catch (err) {
        if (activeThreadIdRef.current === forThreadId) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        }
        throw err;
      } finally {
        if (mountedRef.current) setSending(false);
      }
    },
    [threadId, user, thread, syncMessages, sending],
  );

  const edit = useCallback(
    async (messageId: string, text: string) => {
      if (!threadId) throw new Error("No thread selected");
      const result = await editChatMessage(threadId, { messageId, text });
      if (activeThreadIdRef.current !== threadId) return result;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? (result.item as ChatMessageView) : m)),
      );
      void syncMessages(true);
      return result;
    },
    [threadId, syncMessages],
  );

  const remove = useCallback(
    async (messageId: string) => {
      if (!threadId) throw new Error("No thread selected");
      const result = await deleteChatMessage(threadId, messageId);
      if (activeThreadIdRef.current !== threadId) return result;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? (result.item as ChatMessageView) : m)),
      );
      void syncMessages(true);
      return result;
    },
    [threadId, syncMessages],
  );

  return {
    messages,
    thread,
    loading: syncing && messages.length === 0,
    syncing,
    sending,
    error,
    refetch: () => syncMessages(false),
    send,
    edit,
    remove,
  };
}
