import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { slideDown, staggerFast } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface PublicNavProps {
  /** Landing page: show section anchor links */
  showLandingSections?: boolean;
  onScrollTo?: (id: string) => (e: React.MouseEvent) => void;
}

const NAV_LINK = 'text-sm text-muted-foreground hover:text-foreground transition-colors';

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: 'calc(100vh - 64px)',
    transition: {
      height: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
      opacity: {
        duration: 0.3,
      },
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: {
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      },
      opacity: {
        duration: 0.25,
      },
    },
  },
};

const mobileItemVariants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export function PublicNav({ showLandingSections, onScrollTo }: PublicNavProps) {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const onArchitecture = pathname === '/architecture';
  const [isOpen, setIsOpen] = useState(false);

  const handleMobileScroll = (id: string) => (e: React.MouseEvent) => {
    setIsOpen(false);
    if (onScrollTo) {
      onScrollTo(id)(e);
    }
  };

  return (
    <>
      <motion.nav
        className="sticky top-0 z-50 bg-card/90 backdrop-blur-sm border-b border-border"
        variants={slideDown}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="shrink-0" onClick={() => setIsOpen(false)}>
            <Logo size="md" />
          </Link>

          {/* Desktop Nav Links */}
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
            
            {/* Desktop Auth Buttons */}
            <Link to="/login" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm" className="text-sm">Sign in</Button>
            </Link>
            <Link to="/signup" className="hidden md:inline-flex">
              <Button size="sm" className="text-sm">Register now</Button>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Slide-Down Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-16 left-0 right-0 z-40 bg-background/98 backdrop-blur-md border-b border-border md:hidden overflow-hidden flex flex-col justify-between"
          >
            <motion.div className="flex flex-col items-center gap-8 pt-16 px-6" variants={staggerFast}>
              {showLandingSections && onScrollTo ? (
                <>
                  <motion.a
                    variants={mobileItemVariants}
                    href="#workflow"
                    onClick={handleMobileScroll('workflow')}
                    className="text-2xl font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Workflow
                  </motion.a>
                  <motion.a
                    variants={mobileItemVariants}
                    href="#testimonials"
                    onClick={handleMobileScroll('testimonials')}
                    className="text-2xl font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Stories
                  </motion.a>
                  <motion.a
                    variants={mobileItemVariants}
                    href="#features"
                    onClick={handleMobileScroll('features')}
                    className="text-2xl font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </motion.a>
                  <motion.a
                    variants={mobileItemVariants}
                    href="#pricing"
                    onClick={handleMobileScroll('pricing')}
                    className="text-2xl font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </motion.a>
                </>
              ) : (
                <motion.div variants={mobileItemVariants}>
                  <Link
                    to="/"
                    onClick={() => setIsOpen(false)}
                    className="text-2xl font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Home
                  </Link>
                </motion.div>
              )}
              <motion.div variants={mobileItemVariants}>
                <Link
                  to="/architecture"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "text-2xl font-semibold text-muted-foreground hover:text-foreground transition-colors",
                    onArchitecture && "text-foreground font-bold"
                  )}
                >
                  Architecture
                </Link>
              </motion.div>
            </motion.div>

            {/* Bottom Actions for Mobile */}
            <motion.div
              variants={mobileItemVariants}
              className="w-full px-6 pb-12 flex flex-col gap-4 mt-auto max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-5 duration-300"
            >
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full text-base py-6 rounded-xl">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setIsOpen(false)}>
                <Button className="w-full text-base py-6 rounded-xl">
                  Register now
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

