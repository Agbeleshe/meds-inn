import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, MOTHER_NAV_ITEMS } from '@/lib/nav-items';
import type { NavItem } from '@/lib/nav-items';
import { useApp } from '@/contexts/AppContext';
import { useTour } from '@/contexts/TourContext';
import { HOSPITAL } from '@/lib/demo-data';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { staggerFast, fadeUp } from '@/lib/animations';
import { NAV_DESCRIPTIONS } from '@/lib/nav-descriptions';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** Small ⓘ button that fires a single-step element tour for a nav item */
function NavInfoBtn({ item }: { item: NavItem }) {
  const { startElementTour } = useTour();
  const desc = NAV_DESCRIPTIONS[item.key];
  if (!desc) return null;
  return (
    <button
      type="button"
      aria-label={`What is ${item.label}?`}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        startElementTour([{
          element: `[data-tour="desk-nav-${item.key}"]`,
          popover: {
            title: item.label,
            description: desc,
            side: 'right',
          },
        }]);
      }}
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 ml-auto shrink-0 w-5 h-5 flex items-center justify-center rounded text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-150"
    >
      <Info className="w-3 h-3" />
    </button>
  );
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { role } = useApp();

  const visibleItems = role === 'mother'
    ? MOTHER_NAV_ITEMS
    : NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role));

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        'hidden lg:flex flex-col shrink-0 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}>
        {/* Logo */}
        <div className={cn('flex items-center h-16 border-b border-sidebar-border px-4', collapsed && 'justify-center px-2')}>
          <Logo size="md" variant="dark" showWordmark={!collapsed} wordmarkClassName="text-sidebar-primary-foreground" />
        </div>

        {/* Hospital name */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/60 truncate">{HOSPITAL.name}</p>
          </div>
        )}

        {/* Nav */}
        <motion.nav
          className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5"
          variants={staggerFast}
          initial="hidden"
          animate="visible"
        >
          {visibleItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return collapsed ? (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <motion.div variants={fadeUp}>
                    <Link
                      data-tour={`desk-nav-${item.key}`}
                      to={item.path}
                      className={cn(
                        'flex items-center justify-center w-full h-9 rounded-md transition-colors',
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </Link>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <motion.div key={item.key} variants={fadeUp}>
                <Link
                  data-tour={`desk-nav-${item.key}`}
                  to={item.path}
                  className={cn(
                    'group flex items-center gap-3 px-3 h-9 rounded-md text-sm transition-colors',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1 min-w-0">{item.label}</span>
                  <NavInfoBtn item={item} />
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>

        {/* Toggle */}
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center h-8 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
