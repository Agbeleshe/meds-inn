import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  error: unknown;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred.';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div
        role="alertdialog"
        aria-labelledby="error-title"
        aria-describedby="error-message"
        className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="min-w-0">
            <h2 id="error-title" className="text-base font-semibold text-foreground">
              Something went wrong
            </h2>
            <p id="error-message" className="text-sm text-muted-foreground mt-1 text-pretty">
              {message}
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={resetError}>
            Try again
          </Button>
          <Button className="gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" />
            Refresh page
          </Button>
        </div>
      </div>
    </div>
  );
}
