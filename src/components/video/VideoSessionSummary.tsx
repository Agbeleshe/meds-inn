import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FileText } from 'lucide-react';
import type { VideoSessionNotes } from '@/types/clinical';

export function VideoSessionSummary({
  session,
  isMother,
}: {
  session: VideoSessionNotes;
  isMother?: boolean;
}) {
  const displayText = session.structuredNotes || session.transcript;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <CardTitle className="text-base font-semibold">Session complete</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {session.appointmentType} with {session.clinicianName} ·{' '}
          {new Date(session.completedAt).toLocaleString()}
        </p>
        <Badge variant="outline" className="w-fit text-xs mt-2">Completed</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            {isMother ? 'Notes from your visit' : 'Patient session notes'}
          </p>
          {displayText ? (
            <div className="text-sm text-foreground whitespace-pre-wrap rounded-lg bg-muted/40 border border-border p-3 max-h-80 overflow-y-auto leading-relaxed">
              {displayText}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No notes were captured for this session.</p>
          )}
        </div>
        {session.transcript && session.structuredNotes && session.transcript !== session.structuredNotes && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              View full transcript
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {session.transcript}
            </p>
          </details>
        )}
        <Button size="sm" variant="outline" asChild>
          <Link to="/dashboard/video-calls">Back to video calls</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
