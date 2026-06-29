import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, MOTHER_NAV_ITEMS } from '@/lib/nav-items';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTour } from '@/contexts/TourContext';
import { HOSPITAL } from '@/lib/demo-data';
import { ROLE_LABELS } from '@/lib/demo-users';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { notificationHref } from '@/lib/notification-links';
import { toast } from 'sonner';
import {
  Search, Bell, ChevronDown, Menu, Sun, Moon, MapPin, Info, ArrowLeft
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
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
  const { role, currentUser } = useApp();
  const { signOut } = useAuth();
  const { unread: unreadNotifications, items: notifications, markAsRead } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const { startTour, startElementTour, mobileMenuOpen, setMobileMenuOpen } = useTour();
  const [localMobileOpen, setLocalMobileOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  /** Sign out and return to login */
  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`Searching for "${searchQuery}"...`);
      // Here you can navigate to search results or trigger search callback
    }
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

  if (showMobileSearch) {
    return (
      <motion.header
        className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center gap-2 px-4 sticky top-0 z-30"
        variants={slideDown} initial="hidden" animate="visible"
      >
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setShowMobileSearch(false)}
          aria-label="Close search"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients, appointments…"
              className="pl-9 h-9 bg-background text-sm w-full"
            />
          </div>
          <Button type="submit" size="sm" className="h-9">
            Go
          </Button>
        </form>
      </motion.header>
    );
  }

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
          <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
            <Logo size="md" variant="dark" wordmarkClassName="text-sidebar-primary-foreground" />
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

      {/* Desktop Search */}
      <form onSubmit={handleSearchSubmit} data-tour="topbar-search" className="relative flex-1 max-w-sm hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patients, appointments…"
          className="pl-9 h-9 bg-background text-sm"
        />
      </form>

      <div className="flex items-center gap-2 ml-auto">
        {/* Mobile Search Icon Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setShowMobileSearch(true)}
          aria-label="Open search"
        >
          <Search className="w-4 h-4" />
        </Button>

        {/* Role badge */}
        <span className={cn('hidden sm:inline-flex items-center px-2.5 py-1 rounded text-xs font-medium', roleColors[role])}>
          {ROLE_LABELS[role]}
        </span>

        {/* Tour / Replay Tour button */}
        <Button
          data-tour="topbar-tour"
          variant="ghost"
          size="icon"
          onClick={startTour}
          className="flex items-center justify-center sm:hidden w-9 h-9"
          aria-label="Replay platform tour"
        >
          <MapPin className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </Button>
        <Button
          data-tour="topbar-tour-desktop"
          variant="ghost"
          size="sm"
          onClick={startTour}
          className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          aria-label="Take a platform tour"
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>Tour</span>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-tour="topbar-notifications"
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">No notifications yet</DropdownMenuItem>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={cn(
                    'flex flex-col items-start gap-0.5 cursor-pointer py-2.5',
                    !n.read && 'bg-secondary/50',
                  )}
                  onClick={() => {
                    const href = notificationHref(n);
                    if (href) {
                      if (!n.read) void markAsRead(n.id);
                      navigate(href);
                    } else {
                      navigate(`/dashboard/notifications?id=${encodeURIComponent(n.id)}`);
                    }
                  }}
                >
                  <span className={cn('text-xs', !n.read ? 'font-semibold text-foreground' : 'font-medium')}>
                    {n.title}
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-2">{n.body}</span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs font-medium text-primary cursor-pointer"
              onClick={() => navigate('/dashboard/notifications')}
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
            <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}