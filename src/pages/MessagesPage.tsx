import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChatMessages, useChatThreads } from '@/hooks/use-chat';
import { useMothers } from '@/hooks/use-mothers';
import { useMyMotherProfile } from '@/hooks/use-mother';
import { getMotherSpecialists } from '@/lib/specialist-profiles';
import { buildThreadId } from '@/lib/chat-demo-data';
import { isAssignedToMother } from '@/lib/assignments';
import {
  canDeleteMessage,
  canEditMessage,
  isMessageDeletedForViewer,
  messageDisplayText,
} from '@/lib/chat-display';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChatTermsDialog, useChatTermsAccepted } from '@/components/chat/ChatTermsGate';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { toast } from 'sonner';
import {
  Search,
  Send,
  Circle,
  Radio,
  ArrowLeft,
  MoreVertical,
  Loader2,
  Smile,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatThread } from '@/types/clinical';
import type { SpecialistProfile } from '@/lib/specialist-profiles';
import type { ChatMessageView } from '@/hooks/use-chat';

type MessageFilter = 'all' | 'unread';

function threadUnreadForUser(thread: ChatThread, role: string) {
  if (role === 'mother') return thread.unreadForPatient;
  return thread.unreadForSpecialist;
}

function formatThreadTime(iso: string) {
  if (!iso || iso === new Date(0).toISOString()) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function buildPlaceholderThread(
  patientId: string,
  patientName: string,
  specialist: SpecialistProfile,
  hospitalId: string,
): ChatThread {
  return {
    id: buildThreadId(patientId, specialist.userId),
    patientId,
    patientName,
    specialistUserId: specialist.userId,
    specialistName: specialist.name,
    specialistRole: specialist.role,
    hospitalId,
    subject: '',
    preview: '',
    lastMessageAt: new Date(0).toISOString(),
    unreadForPatient: false,
    unreadForSpecialist: false,
    urgent: false,
  };
}

export default function MessagesPage() {
  const { user } = useAuth();
  const isMother = user?.role === 'mother';
  const isStaff = user?.role === 'admin' || user?.role === 'nurse' || user?.role === 'doctor';
  const isAdmin = user?.role === 'admin';

  const { accepted: termsAccepted, accept: acceptTerms } = useChatTermsAccepted(user?.id);
  const { threads, source, loading, syncing, refetch, startThread } = useChatThreads();
  const { mothers } = useMothers();
  const { data: myMother } = useMyMotherProfile(user?.motherId);

  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>();
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [composePatientId, setComposePatientId] = useState('');
  const [editTarget, setEditTarget] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkOpenedRef = useRef(false);
  const mobileChatDismissedRef = useRef(false);

  const assignedMothers = useMemo(
    () => (user && isStaff && user.role !== 'admin'
      ? mothers.filter((m) => isAssignedToMother(user, m))
      : mothers),
    [mothers, user, isStaff],
  );

  const mySpecialists = useMemo(() => {
    if (!myMother) return { nurse: null, doctor: null };
    return getMotherSpecialists(myMother);
  }, [myMother]);

  const availableSpecialists = useMemo(() => {
    const list: SpecialistProfile[] = [];
    if (mySpecialists.nurse) list.push(mySpecialists.nurse);
    if (mySpecialists.doctor) list.push(mySpecialists.doctor);
    return list;
  }, [mySpecialists]);

  const allThreads = useMemo(() => {
    const map = new Map<string, ChatThread>();
    for (const t of threads) map.set(t.id, t);

    if (isMother && user?.motherId && myMother) {
      for (const sp of availableSpecialists) {
        const id = buildThreadId(user.motherId, sp.userId);
        if (!map.has(id)) {
          map.set(
            id,
            buildPlaceholderThread(
              user.motherId,
              myMother.name,
              sp,
              myMother.hospitalId ?? 'ELR',
            ),
          );
        }
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      b.lastMessageAt.localeCompare(a.lastMessageAt),
    );
  }, [threads, isMother, user?.motherId, myMother, availableSpecialists]);

  const filteredThreads = allThreads.filter((t) => {
    if (filter === 'unread' && user && !threadUnreadForUser(t, user.role)) return false;
    const label = `${counterpartName(t, isMother)} ${counterpartRole(t, isMother)}`;
    if (search && !label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    const specialistParam = searchParams.get('specialist');

    if (!specialistParam) {
      deepLinkOpenedRef.current = false;
      mobileChatDismissedRef.current = false;
    }

    if (specialistParam && user?.motherId && isMother) {
      const tid = buildThreadId(user.motherId, specialistParam);
      setSelectedThreadId(tid);
      if (!deepLinkOpenedRef.current && !mobileChatDismissedRef.current) {
        deepLinkOpenedRef.current = true;
        setMobileShowChat(true);
      }
      return;
    }

    if (!selectedThreadId && filteredThreads.length > 0) {
      setSelectedThreadId(filteredThreads[0].id);
    }
  }, [
    searchParams,
    filteredThreads,
    selectedThreadId,
    isMother,
    user?.motherId,
  ]);

  const {
    messages,
    thread: activeThread,
    syncing: messagesSyncing,
    sending,
    send,
    edit,
    remove,
  } = useChatMessages(selectedThreadId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, selectedThreadId]);

  const unreadCount = user
    ? allThreads.filter((t) => threadUnreadForUser(t, user.role)).length
    : 0;

  function selectThread(id: string) {
    mobileChatDismissedRef.current = false;
    setSelectedThreadId(id);
    setMobileShowChat(true);
    deepLinkOpenedRef.current = true;
    const specialistUserId = id.split('#')[1];
    if (isMother && specialistUserId) {
      setSearchParams({ specialist: specialistUserId }, { replace: true });
    }
  }

  function handleMobileBack() {
    mobileChatDismissedRef.current = true;
    setMobileShowChat(false);
    if (searchParams.has('specialist')) {
      setSearchParams({}, { replace: true });
    }
  }

  async function handleSendReply() {
    if (!reply.trim() || !selectedThreadId || sending) return;
    const text = reply.trim();
    setReply('');
    setEmojiOpen(false);
    try {
      await send(text);
      refetch();
    } catch {
      setReply(text);
      toast.error('Could not send message');
    }
  }

  async function handleStaffCompose() {
    const patientId = composePatientId || assignedMothers[0]?.id;
    let specialistUserId = user?.id;

    if (user?.role === 'admin' && patientId) {
      const mother = mothers.find((m) => m.id === patientId);
      specialistUserId =
        mother?.assignedNurseUserId ??
        mother?.assignedDoctorUserId ??
        'user-nurse';
    }

    if (!patientId || !specialistUserId || !composeText.trim()) {
      toast.error('Choose a patient and enter your message');
      return;
    }

    try {
      const result = await startThread({
        patientId,
        specialistUserId,
        text: composeText.trim(),
      });
      setComposeOpen(false);
      setComposeText('');
      setSelectedThreadId(String(result.thread.id));
      setMobileShowChat(true);
      toast.success('Message sent');
    } catch {
      toast.error('Could not send message');
    }
  }

  async function handleEditSave() {
    if (!editTarget || !editText.trim()) return;
    try {
      await edit(editTarget.id, editText.trim());
      setEditTarget(null);
      setEditText('');
      toast.success('Message updated');
    } catch {
      toast.error('Could not edit message');
    }
  }

  async function handleDelete(msg: ChatMessage) {
    try {
      await remove(msg.id);
      toast.success('Message deleted');
    } catch {
      toast.error('Could not delete message');
    }
  }

  function counterpartName(t: ChatThread, asMother: boolean) {
    return asMother ? t.specialistName : t.patientName;
  }

  function counterpartRole(t: ChatThread, asMother: boolean) {
    if (asMother) {
      return t.specialistRole === 'doctor' ? 'Doctor' : 'Nurse / midwife';
    }
    return 'Patient';
  }

  function counterpartInitials(t: ChatThread) {
    return counterpartName(t, isMother)
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  const headerThread =
    allThreads.find((t) => t.id === selectedThreadId) ??
    (activeThread?.id === selectedThreadId ? activeThread : null);

  const showTerms = Boolean(user && !termsAccepted);

  return (
    <>
      <ChatTermsDialog open={showTerms} onAccept={acceptTerms} />

      <div className="-m-4 md:-m-6 flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4.5rem)] max-h-[calc(100dvh-3.5rem)] overflow-hidden">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between gap-3 px-4 pt-4 pb-2 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">Messages</h1>
              {!loading && <DataSourceBadge source={source} loading={false} error={null} />}
              {source === 'dynamodb' && (
                <Badge variant="outline" className="text-xs gap-1 text-[hsl(142_63%_30%)] border-[hsl(142_63%_45%)]/40">
                  <Radio className={cn('w-3 h-3', syncing && 'animate-pulse')} /> Live
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread</p>
          </div>
          {isStaff && (
            <Button
              size="sm"
              className="h-9 text-xs"
              onClick={() => {
                setComposePatientId(assignedMothers[0]?.id ?? '');
                setComposeText('');
                setComposeOpen(true);
              }}
              disabled={user?.role !== 'admin' && assignedMothers.length === 0}
            >
              New message
            </Button>
          )}
        </div>

        <div className="flex flex-1 min-h-0 border-t md:border border-border md:mx-4 md:mb-4 md:rounded-xl overflow-hidden bg-card">
          {/* Thread list */}
          <div
            className={cn(
              'flex flex-col w-full md:w-[320px] lg:w-[360px] shrink-0 border-r border-border bg-[hsl(40_20%_98%)] dark:bg-muted/20',
              mobileShowChat ? 'hidden md:flex' : 'flex',
            )}
          >
            <div className="px-3 py-3 border-b border-border bg-card shrink-0">
              <div className="flex items-center justify-between mb-2 md:hidden">
                <h1 className="text-lg font-bold">Messages</h1>
                {source === 'dynamodb' && (
                  <Badge variant="outline" className="text-[10px] h-5 gap-0.5">
                    <Radio className={cn('w-2.5 h-2.5', syncing && 'animate-pulse')} /> Live
                  </Badge>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 h-9 text-sm rounded-full bg-muted/50 border-0"
                />
              </div>
              <div className="flex gap-1 mt-2">
                {(['all', 'unread'] as MessageFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn(
                      'flex-1 text-xs py-1.5 rounded-full transition-colors capitalize',
                      filter === f
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0">
              {filteredThreads.length === 0 && !loading && (
                <p className="text-xs text-muted-foreground text-center py-10 px-4">
                  {isMother
                    ? 'Your assigned specialists will appear here.'
                    : 'No conversations yet.'}
                </p>
              )}
              {filteredThreads.map((t) => {
                const unread = user ? threadUnreadForUser(t, user.role) : false;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectThread(t.id)}
                    className={cn(
                      'w-full text-left px-3 py-3 flex items-center gap-3 transition-colors border-b border-border/50',
                      selectedThreadId === t.id ? 'bg-primary/5' : 'hover:bg-muted/40 active:bg-muted/60',
                    )}
                  >
                    <Avatar className="w-12 h-12 shrink-0">
                      <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                        {counterpartInitials(t)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={cn('text-sm truncate', unread ? 'font-semibold' : 'font-medium')}>
                          {counterpartName(t, isMother)}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatThreadTime(t.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {counterpartRole(t, isMother)}
                      </p>
                    </div>
                    {unread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat panel */}
          {headerThread && selectedThreadId ? (
            <div
              className={cn(
                'flex flex-col flex-1 min-w-0 min-h-0 bg-[hsl(40_25%_96%)] dark:bg-background',
                !mobileShowChat ? 'hidden md:flex' : 'flex',
              )}
            >
              {/* Chat header — WhatsApp style */}
              <div className="shrink-0 flex items-center gap-2 px-2 py-2.5 bg-card border-b border-border shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9 shrink-0"
                  onClick={handleMobileBack}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {counterpartInitials(headerThread)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {counterpartName(headerThread, isMother)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {counterpartRole(headerThread, isMother)}
                  </p>
                </div>
                {headerThread.urgent && (
                  <Badge variant="destructive" className="text-[10px] shrink-0">Urgent</Badge>
                )}
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-1 min-h-0"
                style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--border) / 0.35) 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              >
                {messagesSyncing && messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">Loading messages…</p>
                )}
                {!messagesSyncing && messages.length === 0 && (
                  <div className="flex items-center justify-center min-h-[min(50vh,280px)] px-6">
                    <p className="text-sm text-muted-foreground text-center italic max-w-xs leading-relaxed">
                      {isMother && headerThread
                        ? `Send a message to your assigned specialist, ${counterpartName(headerThread, true)}.`
                        : 'Send a message to start this conversation.'}
                    </p>
                  </div>
                )}
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isMe={msg.senderUserId === user?.id}
                    viewer={{ id: user?.id ?? '', role: user?.role ?? 'mother' }}
                    isAdmin={isAdmin}
                    onEdit={() => {
                      setEditTarget(msg);
                      setEditText(msg.text);
                    }}
                    onDelete={() => handleDelete(msg)}
                  />
                ))}
              </div>

              {/* Input bar */}
              <div className="shrink-0 bg-card border-t border-border px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {sending && (
                  <p className="text-[10px] text-muted-foreground px-2 pb-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Sending…
                  </p>
                )}
                <div className="flex items-center gap-1.5 max-w-full">
                  {isMother && (
                    <div className="relative shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        disabled={sending || !termsAccepted}
                        onClick={() => setEmojiOpen((o) => !o)}
                      >
                        <Smile className="w-5 h-5 text-muted-foreground" />
                      </Button>
                      <EmojiPicker
                        open={emojiOpen}
                        onClose={() => setEmojiOpen(false)}
                        onSelect={(emoji) => setReply((r) => r + emoji)}
                      />
                    </div>
                  )}
                  <Input
                    ref={inputRef}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={termsAccepted ? 'Type a message…' : 'Accept terms to message'}
                    disabled={sending || !termsAccepted}
                    className="flex-1 min-w-0 h-10 rounded-full border-border/60 bg-muted/30 px-4 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="h-10 w-10 rounded-full shrink-0"
                    disabled={!reply.trim() || sending || !termsAccepted}
                    onClick={handleSendReply}
                    aria-label={sending ? 'Sending' : 'Send message'}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center p-6 text-center">
              <p className="text-sm text-muted-foreground max-w-xs">
                {isMother
                  ? 'Select a conversation with your care team.'
                  : 'Select a conversation or send a new message.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Staff compose — patient only, no subject */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Message a patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Patient</label>
              <Select value={composePatientId} onValueChange={setComposePatientId}>
                <SelectTrigger className="h-9 text-xs mt-1">
                  <SelectValue placeholder="Choose patient" />
                </SelectTrigger>
                <SelectContent>
                  {(user?.role === 'admin' ? mothers : assignedMothers).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Message</label>
              <Input
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                className="text-sm mt-1"
                placeholder="Write your message…"
                onKeyDown={(e) => e.key === 'Enter' && handleStaffCompose()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={handleStaffCompose} disabled={!composeText.trim()}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit message */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit message</DialogTitle>
          </DialogHeader>
          <Input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="text-sm"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            You can edit within 5 minutes of sending. An &ldquo;edited&rdquo; label will be shown.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={!editText.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type MessageBubbleProps = {
  msg: ChatMessageView;
  isMe: boolean;
  viewer: { id: string; role: string };
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function MessageBubble({ msg, isMe, viewer, isAdmin, onEdit, onDelete }: MessageBubbleProps) {
  const deleted = isMessageDeletedForViewer(msg, viewer);
  const displayText = messageDisplayText(msg, viewer);
  const showMenu = isMe && !msg.pending && !deleted;

  return (
    <div className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[min(85%,20rem)] group relative', isMe ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-lg px-3 py-2 shadow-sm text-sm leading-relaxed break-words',
            isMe
              ? 'bg-[hsl(142_45%_42%)] text-white rounded-br-sm'
              : 'bg-card text-foreground rounded-bl-sm border border-border/40',
            deleted && 'bg-muted/80 text-muted-foreground italic border-0 shadow-none',
            msg.pending && 'opacity-80',
          )}
        >
          <p className="whitespace-pre-wrap">{displayText}</p>
          <div
            className={cn(
              'flex items-center gap-1.5 mt-0.5 justify-end',
              isMe && !deleted ? 'text-white/70' : 'text-muted-foreground',
            )}
          >
            {msg.pending && <span className="text-[10px]">Sending…</span>}
            {msg.edited && !deleted && (
              <span className="text-[10px]">edited</span>
            )}
            <span className="text-[10px]">
              {msg.displayTime ?? formatThreadTime(msg.createdAt)}
            </span>
          </div>
        </div>

        {isAdmin && msg.deleted && msg.originalText && (
          <p className="text-[10px] text-destructive/70 mt-1 px-1 line-through">
            Deleted: {msg.originalText}
          </p>
        )}
        {isAdmin && msg.edited && msg.originalText && !msg.deleted && (
          <p className="text-[10px] text-muted-foreground mt-1 px-1">
            Original: {msg.originalText}
          </p>
        )}
        {isAdmin && msg.editHistory && msg.editHistory.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
            Prior edits: {msg.editHistory.join(' → ')}
          </p>
        )}

        {showMenu && (canEditMessage(msg, viewer.id) || canDeleteMessage(msg, viewer.id)) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'absolute top-1 p-1 rounded-full bg-card/90 border shadow-sm',
                  'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100',
                  isMe ? 'left-0 -translate-x-full' : 'right-0 translate-x-full',
                )}
                aria-label="Message options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isMe ? 'end' : 'start'}>
              {canEditMessage(msg, viewer.id) && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {canDeleteMessage(msg, viewer.id) && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
