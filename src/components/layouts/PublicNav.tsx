import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { slideDown } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface PublicNavProps {
  /** Landing page: show section anchor links */
  showLandingSections?: boolean;
  onScrollTo?: (id: string) => (e: React.MouseEvent) => void;
}

const NAV_LINK = 'text-sm text-muted-foreground hover:text-foreground transition-colors';

export function PublicNav({ showLandingSections, onScrollTo }: PublicNavProps) {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const onArchitecture = pathname === '/architecture';

  return (
    <motion.nav
      className="sticky top-0 z-50 bg-card/90 backdrop-blur-sm border-b border-border"
      variants={slideDown}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="shrink-0">
          <Logo size="md" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {showLandingSections && onScrollTo ? (
            <>
              <a href="#workflow" onClick={onScrollTo('workflow')} className={NAV_LINK}>Workflow</a>
              <a href="#testimonials" onClick={onScrollTo('testimonials')} className={NAV_LINK}>Stories</a>
              <a href="#features" onClick={onScrollTo('features')} className={NAV_LINK}>Features</a>
              <a href="#pricing" onClick={onScrollTo('pricing')} className={NAV_LINK}>Pricing</a>
            </>
          ) : (
            <Link to="/" className={NAV_LINK}>Home</Link>
          )}
          <Link
            to="/architecture"
            className={cn(
              NAV_LINK,
              onArchitecture && 'text-foreground font-medium',
            )}
          >
            Architecture
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[hsl(38_85%_62%)]" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-sm hidden sm:inline-flex">Sign in</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="text-sm">Register now</Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
