import type { ChatMessage, ChatThread } from "@/types/clinical.js";
import { CHAT_EDIT_WINDOW_MS } from "@/lib/chat-constants.js";

const PLACEHOLDER_SUBJECTS = new Set(["", "New conversation", "Care team chat"]);

export function threadDisplayTitle(thread: ChatThread): string | null {
  if (thread.subject && !PLACEHOLDER_SUBJECTS.has(thread.subject)) {
    return thread.subject;
  }
  if (thread.preview?.trim()) {
    return thread.preview.trim().slice(0, 80);
  }
  return null;
}

export function threadPreviewText(thread: ChatThread): string {
  if (thread.preview?.trim()) return thread.preview.trim();
  return "No message yet";
}

export function canEditMessage(message: ChatMessage, userId: string, now = Date.now()): boolean {
  if (message.deleted) return false;
  if (message.senderUserId !== userId) return false;
  if (message.id.startsWith("local-")) return false;
  const sent = new Date(message.createdAt).getTime();
  return now - sent <= CHAT_EDIT_WINDOW_MS;
}

export function canDeleteMessage(message: ChatMessage, userId: string): boolean {
  if (message.deleted) return false;
  if (message.senderUserId !== userId) return false;
  if (message.id.startsWith("local-")) return false;
  return true;
}

export function messageDisplayText(
  message: ChatMessage,
  viewer: { id: string; role: string },
): string {
  if (message.deleted && viewer.role !== "admin") {
    return "This message was deleted";
  }
  return message.text;
}

export function isMessageDeletedForViewer(
  message: ChatMessage,
  viewer: { role: string },
): boolean {
  return Boolean(message.deleted) && viewer.role !== "admin";
}

export function firstMessageSubject(text: string): string {
  const line = text.trim().split("\n")[0] ?? "";
  return line.slice(0, 80) || "Care team chat";
}
