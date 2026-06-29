import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchNotifications, markNotificationRead as apiMarkRead } from "@/lib/api-client";
import type { AppNotification } from "@/types/clinical";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationContextValue {
  items: AppNotification[];
  unread: number;
  loading: boolean;
  refetch: () => void;
  markAsRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchNotifications()
      .then(({ items: rows }) => setItems(rows as unknown as AppNotification[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!user) return;
    const refresh = () => refetch();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, refetch]);

  const markAsRead = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await apiMarkRead(id);
    } catch {
      refetch();
    }
  }, [refetch]);

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const value = useMemo(
    () => ({ items, unread, loading, refetch, markAsRead }),
    [items, unread, loading, refetch, markAsRead],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
