import React, { useState } from 'react';
import { MESSAGES as MSG_DATA } from '@/lib/demo-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Plus, Send, Paperclip, AlertCircle, CheckCheck, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TEMPLATES = [
  'Appointment reminder: You have a visit scheduled for {date}.',
  'Medication reminder: Please remember to take your {medication} at {time}.',
  'Check-in: How are you feeling today? Any new symptoms to report?',
  'Please bring your test results to your next appointment.',
  'Your next GTT is due. Please call us to schedule.',
];

type MessageFilter = 'all' | 'unread' | 'urgent';

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState(MSG_DATA[0].id);
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [messages, setMessages] = useState(MSG_DATA);
  const [threads, setThreads] = useState(
    MSG_DATA.reduce<Record<string, typeof MSG_DATA[0]['thread']>>((acc, m) => {
      acc[m.id] = m.thread;
      return acc;
    }, {})
  );

  const filtered = messages.filter(m => {
    if (filter === 'unread' && m.read) return false;
    if (filter === 'urgent' && !m.urgent) return false;
    if (search && !m.subject.toLowerCase().includes(search.toLowerCase()) && !m.from.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = messages.find(m => m.id === selectedId)!;

  function sendReply() {
    if (!reply.trim()) return;
    setThreads(prev => ({
      ...prev,
      [selectedId]: [
        ...prev[selectedId],
        { from: 'Dr. Tolu Adebayo', role: 'Doctor', time: 'Just now', text: reply }
      ]
    }));
    setReply('');
    toast.success('Message sent');
  }

  function markRead(id: string) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  }

  return (
    <div className="space-y-6">
      <div data-tour="messages-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {messages.filter(m => !m.read).length} unread · {messages.filter(m => m.urgent).length} urgent
          </p>
        </div>
        <Button size="sm" className="h-9 gap-1.5 text-xs self-start md:self-auto" onClick={() => toast.info('New message composer opened')}>
          <Plus className="w-3.5 h-3.5" /> New Message
        </Button>
      </div>

      <div data-tour="messages-threads" className="grid lg:grid-cols-3 gap-0 border border-border rounded-xl overflow-hidden bg-card">
        {/* Sidebar */}
        <div className="border-r border-border flex flex-col">
          {/* Search + filter */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages…" className="pl-8 h-8 text-xs" />
            </div>
            <div className="flex gap-1">
              {(['all', 'unread', 'urgent'] as MessageFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'flex-1 text-xs py-1 rounded-md transition-colors capitalize',
                    filter === f ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Message list */}
          <div className="overflow-y-auto flex-1">
            {filtered.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelectedId(m.id); markRead(m.id); }}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors',
                  selectedId === m.id ? 'bg-secondary' : 'hover:bg-muted/30'
                )}
              >
                <div className="flex items-start gap-2.5">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="text-xs bg-secondary text-primary font-semibold">{m.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn('text-xs truncate', !m.read ? 'font-semibold text-foreground' : 'text-muted-foreground font-medium')}>{m.from}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-1">{m.time}</span>
                    </div>
                    <p className={cn('text-xs truncate', !m.read ? 'text-foreground font-medium' : 'text-muted-foreground')}>{m.subject}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{m.preview}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {m.urgent && <Badge className="text-xs py-0 h-4 bg-destructive/10 text-destructive border-destructive/20">Urgent</Badge>}
                      {!m.read && <Circle className="w-2 h-2 fill-primary text-primary" />}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No messages match your filter.</p>
            )}
          </div>
        </div>

        {/* Thread */}
        {selected ? (
          <div className="lg:col-span-2 flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground">{selected.subject}</p>
                    {selected.urgent && <Badge className="text-xs py-0 h-4 bg-destructive/10 text-destructive border-destructive/20">Urgent</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{selected.from} · {selected.role} · {selected.time}</p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">{selected.tag}</Badge>
              </div>
            </div>

            {/* Thread messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {threads[selected.id].map((msg, i) => {
                const isMe = msg.from === 'Dr. Tolu Adebayo';
                return (
                  <div key={i} className={cn('flex gap-3', isMe ? 'flex-row-reverse' : 'flex-row')}>
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarFallback className="text-xs bg-secondary text-primary font-semibold">
                        {msg.from.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn('max-w-[75%] space-y-1', isMe ? 'items-end' : 'items-start')}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{msg.from}</span>
                        <span className="text-xs text-muted-foreground/60">{msg.time}</span>
                      </div>
                      <div className={cn(
                        'rounded-xl px-4 py-2.5 text-sm text-pretty leading-relaxed',
                        isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick templates */}
            <div className="px-5 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Quick templates</p>
              <div className="flex gap-2 flex-wrap">
                {TEMPLATES.slice(0, 3).map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setReply(t)}
                    className="text-xs text-muted-foreground border border-border rounded-md px-2 py-1 hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    {t.slice(0, 30)}…
                  </button>
                ))}
              </div>
            </div>

            {/* Reply */}
            <div className="px-5 pb-4 pt-2 border-t border-border">
              <div className="flex gap-2">
                <Textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type a message…"
                  className="min-h-[60px] text-sm resize-none"
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) sendReply(); }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => toast.info('Attach file')}>
                  <Paperclip className="w-3.5 h-3.5" /> Attach
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setReply(''); toast.info('Marked urgent'); }}>
                    <AlertCircle className="w-3.5 h-3.5" /> Mark urgent
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1.5" onClick={sendReply}>
                    <Send className="w-3 h-3" /> Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">Select a message to read</p>
          </div>
        )}
      </div>
    </div>
  );
}
