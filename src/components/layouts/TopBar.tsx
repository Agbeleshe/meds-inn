import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, MOTHER_NAV_ITEMS } from '@/lib/nav-items';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTour } from '@/contexts/TourContext';
import { HOSPITAL, ROLES } from '@/lib/demo-data';
import { toast } from 'sonner';
import {
  Search, Bell, ChevronDown, Menu, HeartPulse, Sun, Moon, MapPin, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { slideDown } from '@/lib/animations';
import { NAV_DESCRIPTIONS } from '@/lib/nav-descriptions';

export function TopBar() {
  const { role, setRole, currentUser } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { startTour, startElementTour, mobileMenuOpen, setMobileMenuOpen } = useTour();
  const [localMobileOpen, setLocalMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  /** Switch role AND navigate to /dashboard so RoleBasedIndex renders the correct overview */
  const handleRoleSwitch = (newRole: string) => {
    setRole(newRole as Parameters<typeof setRole>[0]);
    navigate('/dashboard');
  };

  // Sheet open = either user-opened OR tour-controlled
  const sheetOpen = localMobileOpen || mobileMenuOpen;
  const handleSheetChange = (open: boolean) => {
    setLocalMobileOpen(open);
    if (!open) setMobileMenuOpen(false);
  };

  const visibleItems = role === 'mother'
    ? MOTHER_NAV_ITEMS
    : NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role));

  const roleColors: Record<string, string> = {
    admin: 'bg-[hsl(173_79%_24%)] text-primary-foreground',
    nurse: 'bg-[hsl(207_85%_45%)] text-white',
    doctor: 'bg-[hsl(38_53%_47%)] text-white',
    mother: 'bg-[hsl(142_63%_35%)] text-white',
  };

  return (
    <motion.header
      data-tour="topbar"
      className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center gap-4 px-4 md:px-6 sticky top-0 z-30"
      variants={slideDown} initial="hidden" animate="visible"
    >
      {/* Mobile hamburger */}
      <Sheet open={sheetOpen} onOpenChange={handleSheetChange}>
        <SheetTrigger asChild>
          <Button
            data-tour="topbar-hamburger"
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <div className="flex items-center gap-2.5 h-16 px-4 border-b border-sidebar-border">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sidebar-primary-foreground font-semibold text-base">Meds-inn</span>
          </div>
          <div className="px-4 py-3 border-b border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/60">{HOSPITAL.name}</p>
          </div>
          <nav className="py-3 px-2 space-y-0.5">
            {visibleItems.map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              const desc = NAV_DESCRIPTIONS[item.key];
              return (
                <div key={item.key} className="group flex items-center gap-1">
                  <Link
                    data-tour={`mob-nav-${item.key}`}
                    to={item.path}
                    onClick={() => { setLocalMobileOpen(false); setMobileMenuOpen(false); }}
                    className={cn(
                      'flex-1 flex items-center gap-3 px-3 h-9 rounded-md text-sm transition-colors',
                      active
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                  {desc && (
                    <button
                      type="button"
                      aria-label={`What is ${item.label}?`}
                      onClick={() => {
                        startElementTour([{
                          element: `[data-tour="mob-nav-${item.key}"]`,
                          popover: {
                            title: item.label,
                            description: desc,
                            side: 'right',
                          },
                        }]);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 w-7 h-7 flex items-center justify-center rounded text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-150"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div data-tour="topbar-search" className="relative flex-1 max-w-sm hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search patients, appointments…" className="pl-9 h-9 bg-background text-sm" />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Role badge */}
        <span className={cn('hidden sm:inline-flex items-center px-2.5 py-1 rounded text-xs font-medium', roleColors[role])}>
          {ROLES.find(r => r.id === role)?.label}
        </span>

        {/* Tour button */}
        <Button
          data-tour="topbar-tour"
          variant="ghost"
          size="sm"
          onClick={startTour}
          className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          aria-label="Take a platform tour"
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">Tour</span>
        </Button>

        {/* Theme toggle */}
        <Button
          data-tour="topbar-theme"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 text-[hsl(38_85%_62%)]" />
            : <Moon className="w-4 h-4" />
          }
        </Button>

        {/* Notifications */}
        <Button
          data-tour="topbar-notifications"
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => toast.info('Notifications')}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </Button>

        {/* Org name */}
        <span className="hidden md:block text-xs text-muted-foreground truncate max-w-[140px]">{HOSPITAL.shortName}</span>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-tour="topbar-profile"
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2"
            >
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">{currentUser.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">Switch Role (Demo)</DropdownMenuLabel>
            {ROLES.map(r => (
              <DropdownMenuItem
                key={r.id}
                onClick={() => handleRoleSwitch(r.id)}
                className={cn('cursor-pointer', role === r.id && 'font-medium text-primary')}
              >
                {r.label}
                {role === r.id && <span className="ml-auto text-primary">✓</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/">Sign out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
