import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <p className="text-xs text-muted-foreground">© 2026 Meds-inn. All demo data is fictional.</p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <Link to="/architecture" className="hover:text-foreground transition-colors">Architecture</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
