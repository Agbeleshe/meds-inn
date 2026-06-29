import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { notificationHref } from '@/lib/notification-links';
import {
  Bell, Loader2, MessageSquare, UserPlus, ClipboardList, Pill, Stethoscope, Calendar, ExternalLink,
} from 'lucide-react';
import type { AppNotification } from '@/types/clinical';

const TYPE_CONFIG: Record<
  AppNotification['type'],
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  assignment: { icon: UserPlus, label: 'Assignment' },
  message: { icon: MessageSquare, label: 'Message' },
  'care-plan': { icon: ClipboardList, label: 'Care plan' },
  'specialist-request': { icon: Stethoscope, label: 'Specialist request' },
  medication: { icon: Pill, label: 'Medication' },
  appointment: { icon: Calendar, label: 'Appointment' },
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { items, loading, unread, markAsRead } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get('id');
  const markedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!focusId || loading) return;

    const el = document.getElementById(`notification-${focusId}`);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    const target = items.find((n) => n.id === focusId);
    if (target && !target.read && !markedRef.current.has(focusId)) {
      markedRef.current.add(focusId);
      void markAsRead(focusId);
    }
  }, [focusId, loading, items, markAsRead]);

  function handleOpen(n: AppNotification) {
    const href = notificationHref(n);
    if (href) {
      if (!n.read) void markAsRead(n.id);
      navigate(href);
      return;
    }
    setSearchParams({ id: n.id }, { replace: true });
    if (!n.read) void markAsRead(n.id);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your notification history
            {unread > 0 && (
              <span className="ml-1.5 text-primary font-medium">
                · {unread} unread
              </span>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading notifications…
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No notifications yet. When something needs your attention, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const config = TYPE_CONFIG[n.type] ?? { icon: Bell, label: 'Alert' };
            const Icon = config.icon;
            const isFocused = focusId === n.id;

            return (
              <li key={n.id}>
                <button
                  type="button"
                  id={`notification-${n.id}`}
                  onClick={() => handleOpen(n)}
                  className={cn(
                    'w-full text-left rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm',
                    !n.read && 'border-primary/25 bg-secondary/30',
                    isFocused && 'ring-2 ring-primary border-primary/40',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      n.read ? 'bg-muted' : 'bg-secondary',
                    )}>
                      <Icon className={cn('w-4 h-4', n.read ? 'text-muted-foreground' : 'text-primary')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm text-foreground',
                          !n.read && 'font-semibold',
                        )}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-destructive shrink-0 mt-1.5" aria-hidden />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
                      {notificationHref(n) && (
                        <p className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {n.type === 'care-plan' ? 'View care tasks' : 'View appointment'}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {config.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatWhen(n.createdAt)}
                        </span>
                        {n.read && (
                          <span className="text-[10px] text-muted-foreground">Read</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {focusId && items.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setSearchParams({}, { replace: true })}
          >
            Clear highlight
          </Button>
        </div>
      )}
    </div>
  );
}
