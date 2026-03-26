import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatSession } from '@/types/chat';

const CHAT_SESSIONS_KEY = 'halal_chat_sessions_v1';

type Listener = () => void;
const listeners = new Set<Listener>();

function emitSessionsChanged() {
  listeners.forEach((l) => l());
}

export function subscribeChatSessions(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function sortByUpdatedAtDesc(items: ChatSession[]) {
  return [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getAllChatSessions(): Promise<ChatSession[]> {
  const raw = await AsyncStorage.getItem(CHAT_SESSIONS_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as ChatSession[];
  return sortByUpdatedAtDesc(parsed.filter((s) => (s.messages?.length ?? 0) > 0));
}

export async function getChatSession(id: string): Promise<ChatSession | null> {
  const raw = await AsyncStorage.getItem(CHAT_SESSIONS_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as ChatSession[];
  return parsed.find((s) => s.id === id) ?? null;
}

export async function createNewSession(): Promise<ChatSession> {
  const now = new Date().toISOString();
  return {
    id: `${Date.now()}`,
    title: 'New Chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export async function saveChatSession(session: ChatSession): Promise<void> {
  if (!session.messages || session.messages.length === 0) return; // do not save empty chats

  const raw = await AsyncStorage.getItem(CHAT_SESSIONS_KEY);
  const all = raw ? (JSON.parse(raw) as ChatSession[]) : [];

  const next: ChatSession = {
    ...session,
    updatedAt: new Date().toISOString(),
  };

  const idx = all.findIndex((s) => s.id === next.id);
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);

  await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sortByUpdatedAtDesc(all)));
  emitSessionsChanged();
}