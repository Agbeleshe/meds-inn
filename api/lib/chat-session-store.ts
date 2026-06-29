import type { ChatMessage, ChatThread } from "../../src/types/clinical";

const threads = new Map<string, ChatThread>();
const messagesByThread = new Map<string, ChatMessage[]>();

export function saveChatThreadSession(thread: ChatThread) {
  threads.set(thread.id, thread);
}

export function saveChatMessageSession(message: ChatMessage) {
  const list = messagesByThread.get(message.threadId) ?? [];
  const idx = list.findIndex((m) => m.id === message.id);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = message;
    messagesByThread.set(message.threadId, next);
  } else {
    messagesByThread.set(message.threadId, [...list, message]);
  }
}

export function updateChatMessageSession(message: ChatMessage) {
  saveChatMessageSession(message);
}

export function getChatThreadSession(threadId: string) {
  return threads.get(threadId) ?? null;
}

export function listChatThreadSessions() {
  return Array.from(threads.values());
}

export function listChatMessageSessions(threadId: string) {
  return messagesByThread.get(threadId) ?? [];
}
