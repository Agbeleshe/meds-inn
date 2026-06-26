/**
 * GuidanceBot — Meds-inn in-app assistant
 *
 * Appears in the bottom-right corner after the user scrolls 100 px.
 * Delivers a scripted greeting and guides visitors toward registration
 * as a Doctor or Mother.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  from: 'bot' | 'user';
  text: string;
  quickReplies?: QuickReply[];
  cta?: { label: string; to: string };
}

interface QuickReply {
  label: string;
  value: string;
}

// ── Conversation engine ────────────────────────────────────────────────────────

const GREETING: Message = {
  id: 'greeting',
  from: 'bot',
  text: "Hello! I'm Meds-inn's personal assistant and guide. What would you like to do today?",
  quickReplies: [
    { label: '\uD83C\uDFE5 I am a healthcare professional', value: 'doctor' },
    { label: '\uD83E\uDD31 I am an expectant or new mother', value: 'mother' },
    { label: '\uD83D\uDCA1 Tell me about Meds-inn', value: 'about' },
  ],
};

function botReply(input: string): Message[] {
  const t = input.toLowerCase();

  // Doctor / hospital / clinician path
  if (/doctor|nurse|midwife|clinician|hospital|staff|professional|healthcare/.test(t)) {
    return [
      {
        id: `b-${Date.now()}-1`,
        from: 'bot',
        text: "Welcome! Meds-inn gives healthcare teams a powerful dashboard to:\n\n• Manage enrolled mothers from pregnancy to baby's first year\n• Send clinician-approved medication reminders\n• Conduct video consultations with AI-generated pre-visit briefs\n• Track missed follow-ups and adherence in real time",
      },
      {
        id: `b-${Date.now()}-2`,
        from: 'bot',
        text: "Ready to see it in action? Create a free account and explore the Admin, Nurse, or Doctor demo role instantly — no credit card needed.",
        quickReplies: [{ label: '✅ Sign up as a healthcare professional', value: 'signup-doctor' }],
        cta: { label: 'Get started free →', to: '/login' },
      },
    ];
  }

  // Mother / patient path
  if (/mother|mum|mom|pregnant|baby|expectant|patient|maternity/.test(t)) {
    return [
      {
        id: `b-${Date.now()}-1`,
        from: 'bot',
        text: "Meds-inn supports you through every stage — from your first scan to your baby's first birthday:\n\n• Personal care plan from your clinic team\n• Daily medication reminders tailored by your nurse\n• Video consultations so the clinic comes to you\n• Baby milestone tracking and vaccination schedule",
      },
      {
        id: `b-${Date.now()}-2`,
        from: 'bot',
        text: "Your hospital will set up your account once you're enrolled. Would you like to explore the mother experience right now with our demo?",
        quickReplies: [{ label: '✅ Explore mother experience', value: 'signup-mother' }],
        cta: { label: 'Try the demo →', to: '/login' },
      },
    ];
  }

  // About Meds-inn
  if (/about|what|how|meds.?inn|platform|work/.test(t)) {
    return [
      {
        id: `b-${Date.now()}-1`,
        from: 'bot',
        text: "Meds-inn is a hospital-driven maternal care platform that keeps mothers connected to their care team between clinic visits.\n\nHospitals use it to enrol mothers, assign care plans, and monitor adherence. Mothers use it to stay on track with reminders, check-ins, and video consultations.",
      },
      {
        id: `b-${Date.now()}-2`,
        from: 'bot',
        text: "Who best describes you?",
        quickReplies: [
          { label: '🏥 Healthcare professional', value: 'doctor' },
          { label: '🤱 Expectant or new mother', value: 'mother' },
        ],
      },
    ];
  }

  // Sign-up intents
  if (/sign.?up|register|join|get.?start|account|free/.test(t) || t === 'signup-doctor') {
    return [
      {
        id: `b-${Date.now()}-1`,
        from: 'bot',
        text: "Great choice! Signing up takes less than two minutes. You'll get immediate access to all four demo roles: Admin, Nurse, Doctor, and Mother.",
        cta: { label: 'Create your free account →', to: '/login' },
      },
    ];
  }

  if (t === 'signup-mother') {
    return [
      {
        id: `b-${Date.now()}-1`,
        from: 'bot',
        text: "Perfect! Tap the button below to try the mother experience — see your care plan, medication reminders, and baby tracker in action.",
        cta: { label: 'Explore mother experience →', to: '/login' },
      },
    ];
  }

  // Pricing
  if (/pric|cost|free|paid|plan/.test(t)) {
    return [
      {
        id: `b-${Date.now()}-1`,
        from: 'bot',
        text: "Meds-inn is available as a hospital subscription. Individual mothers access the platform through their enrolled hospital at no personal cost.",
        quickReplies: [{ label: '📋 View pricing plans', value: 'pricing' }],
      },
    ];
  }

  if (t === 'pricing') {
    return [
      {
        id: `b-${Date.now()}-1`,
        from: 'bot',
        text: "You can find our hospital pricing plans in the Pricing section of this page — including a free tier for smaller clinics.",
        quickReplies: [{ label: '🏥 I want to sign up my hospital', value: 'signup-doctor' }],
      },
    ];
  }

  // Fallback
  return [
    {
      id: `b-${Date.now()}-1`,
      from: 'bot',
      text: "I'm here to help you get the most out of Meds-inn! Are you looking to sign up as a healthcare professional, or would you like to explore the mother experience?",
      quickReplies: [
        { label: '🏥 Healthcare professional', value: 'doctor' },
        { label: '🤱 Expectant or new mother', value: 'mother' },
      ],
    },
  ];
}

// ── Component ──────────────────────────────────────────────────────────────────

export function GuidanceBot() {
  const [visible, setVisible]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [typing, setTyping]     = useState(false);
  const messagesEndRef           = useRef<HTMLDivElement>(null);
  const inputRef                 = useRef<HTMLInputElement>(null);

  // Show bot button after 100 px scroll
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Greet on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages([GREETING]);
      }, 700);
    }
  }, [open, messages.length]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const pushBotReplies = useCallback((replies: Message[]) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, ...replies]);
    }, 600);
  }, []);

  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: `u-${Date.now()}`, from: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    pushBotReplies(botReply(text.trim()));
  }, [pushBotReplies]);

  const handleQuickReply = useCallback((qr: QuickReply) => {
    const userMsg: Message = { id: `u-${Date.now()}`, from: 'user', text: qr.label };
    setMessages(prev => [...prev, userMsg]);
    pushBotReplies(botReply(qr.value));
  }, [pushBotReplies]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {visible && !open && (
          <motion.button
            key="bot-btn"
            className={cn(
              'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg',
              'bg-primary text-primary-foreground flex items-center justify-center',
              'hover:scale-105 active:scale-95 transition-transform'
            )}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            aria-label="Open guidance bot"
          >
            <Bot className="w-6 h-6" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="bot-panel"
            className={cn(
              'fixed bottom-6 right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)]',
              'rounded-2xl shadow-2xl overflow-hidden flex flex-col',
              'bg-card border border-border'
            )}
            style={{ height: 480 }}
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">Meds-inn Assistant</p>
                <p className="text-xs text-primary-foreground/70">Here to guide you</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
                aria-label="Close bot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 min-h-0">
              {messages.map(msg => (
                <div key={msg.id} className={cn('flex flex-col gap-1.5', msg.from === 'user' ? 'items-end' : 'items-start')}>
                  {/* Bubble */}
                  <div
                    className={cn(
                      'px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap max-w-[85%]',
                      msg.from === 'bot'
                        ? 'bg-muted text-foreground rounded-tl-sm'
                        : 'bg-primary text-primary-foreground rounded-tr-sm'
                    )}
                  >
                    {msg.text}
                  </div>

                  {/* CTA button */}
                  {msg.cta && (
                    <Link to={msg.cta.to} onClick={() => setOpen(false)}>
                      <Button size="sm" className="gap-1.5 text-xs h-8">
                        {msg.cta.label} <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  )}

                  {/* Quick replies */}
                  {msg.quickReplies && (
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {msg.quickReplies.map(qr => (
                        <button
                          key={qr.value}
                          onClick={() => handleQuickReply(qr)}
                          className={cn(
                            'text-xs px-3 py-1.5 rounded-full border transition-colors',
                            'border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground'
                          )}
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex items-start">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="px-3 py-3 border-t border-border shrink-0 flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                className={cn(
                  'flex-1 min-w-0 bg-muted rounded-full px-4 py-2 text-sm',
                  'outline-none focus:ring-2 focus:ring-primary/30',
                  'placeholder:text-muted-foreground'
                )}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim()}
                className={cn(
                  'w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-colors',
                  'bg-primary text-primary-foreground',
                  'disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90'
                )}
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
