import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function structureNotes(raw: string): string {
  const lines = raw
    .split(/[\n.]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) return raw;

  const advice = lines.filter((l) =>
    /take|avoid|rest|drink|medication|dose|follow|come back|call|prescribe|recommend|should/i.test(l),
  );
  const concerns = lines.filter((l) =>
    /feel|pain|symptom|worry|concern|dizzy|tired|nausea/i.test(l),
  );
  const other = lines.filter((l) => !advice.includes(l) && !concerns.includes(l));

  const parts: string[] = ['Visit discussion summary', ''];
  if (advice.length) {
    parts.push('What your specialist said:');
    advice.forEach((l) => parts.push(`• ${l}`));
    parts.push('');
  }
  if (concerns.length) {
    parts.push('What you discussed:');
    concerns.forEach((l) => parts.push(`• ${l}`));
    parts.push('');
  }
  if (other.length) {
    parts.push('Other notes:');
    other.forEach((l) => parts.push(`• ${l}`));
  }
  return parts.join('\n').trim();
}

export interface VideoNoteTakerProps {
  transcript: string;
  onTranscriptChange: (value: string) => void;
  onAppendTranscript?: (chunk: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

/** Free browser speech-to-text note taker (Web Speech API). */
export function VideoNoteTaker({
  transcript,
  onTranscriptChange,
  onAppendTranscript,
  disabled = false,
  readOnly = false,
}: VideoNoteTakerProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      toast.error('Speech recognition is not supported in this browser. Use Chrome or Safari.');
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;
        const chunk = event.results[i][0].transcript.trim();
        if (!chunk) continue;
        if (onAppendTranscript) {
          onAppendTranscript(chunk);
        } else {
          onTranscriptChange(transcript ? `${transcript.trimEnd()} ${chunk}` : chunk);
        }
      }
    };

    recognition.onerror = () => {
      setListening(false);
      toast.error('Could not capture audio. Check microphone permissions.');
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    toast.success('Listening — speak clearly near your microphone');
  }, [onAppendTranscript, onTranscriptChange, transcript]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function aiStructure() {
    if (!transcript.trim()) {
      toast.error('Record or type some notes first.');
      return;
    }
    onTranscriptChange(structureNotes(transcript));
    toast.success('Notes organised — review and edit as needed');
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div>
        <p className="text-sm font-semibold text-foreground">AI note taker</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tap the mic to capture what is said during your consultation. Notes save when you end the session.
        </p>
      </div>

      {!readOnly && supported && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={listening ? 'destructive' : 'default'}
            className="h-8 text-xs gap-1.5"
            disabled={disabled}
            onClick={listening ? stopListening : startListening}
          >
            {listening ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                Stop listening
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                Start listening
              </>
            )}
          </Button>
          {listening && (
            <Badge variant="outline" className="text-xs animate-pulse text-primary border-primary/40">
              Recording…
            </Badge>
          )}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 text-xs gap-1.5"
            disabled={disabled || !transcript.trim()}
            onClick={aiStructure}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Organise notes
          </Button>
        </div>
      )}

      {!supported && !readOnly && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Speech-to-text works best in Chrome or Safari. You can still type notes below.
        </p>
      )}

      <Textarea
        value={transcript}
        onChange={(e) => onTranscriptChange(e.target.value)}
        readOnly={readOnly}
        placeholder="Your visit notes will appear here as you speak, or type manually…"
        className={cn(
          'flex-1 min-h-[220px] text-sm resize-none',
          listening && 'ring-2 ring-primary/30',
        )}
      />
    </div>
  );
}
