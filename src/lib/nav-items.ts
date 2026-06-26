import {
  LayoutDashboard, Users, Calendar, ClipboardList, Bell,
  MessageSquare, Video, Baby, BarChart3, Users2,
  Sparkles, FolderOpen, Server, Settings, HeartPulse,
} from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

// ─── Clinical / admin navigation (admin, nurse, doctor) ──────────────────────
export const NAV_ITEMS: NavItem[] = [
  { key: 'overview',     label: 'Overview',             path: '/dashboard',                  icon: LayoutDashboard },
  { key: 'mothers',      label: 'Mothers',              path: '/dashboard/mothers',           icon: Users },
  { key: 'appointments', label: 'Appointments',         path: '/dashboard/appointments',      icon: Calendar },
  { key: 'care-plans',   label: 'Care Plans',           path: '/dashboard/care-plans',        icon: ClipboardList },
  { key: 'medications',  label: 'Medication Reminders', path: '/dashboard/medications',       icon: Bell },
  { key: 'messages',     label: 'Messages',             path: '/dashboard/messages',          icon: MessageSquare },
  { key: 'video',        label: 'Video Consultations',  path: '/dashboard/video',             icon: Video },
  { key: 'baby-care',    label: 'Baby Care',            path: '/dashboard/baby-care',         icon: Baby },
  { key: 'analytics',    label: 'Analytics',            path: '/dashboard/analytics',         icon: BarChart3,    roles: ['admin', 'doctor'] },
  { key: 'team',         label: 'Team',                 path: '/dashboard/team',              icon: Users2,       roles: ['admin'] },
  { key: 'ai-briefs',    label: 'AI Care Briefs',       path: '/dashboard/care-briefs',       icon: Sparkles },
  { key: 'documents',    label: 'Documents',            path: '/dashboard/documents',         icon: FolderOpen },
  { key: 'architecture', label: 'Architecture',         path: '/dashboard/architecture',      icon: Server },
  { key: 'settings',     label: 'Settings',             path: '/dashboard/settings',          icon: Settings },
];

// ─── Mother / patient navigation ─────────────────────────────────────────────
export const MOTHER_NAV_ITEMS: NavItem[] = [
  { key: 'my-care',      label: 'My Care',              path: '/dashboard/mother',            icon: HeartPulse },
  { key: 'appointments', label: 'My Appointments',      path: '/dashboard/appointments',      icon: Calendar },
  { key: 'medications',  label: 'Medication Reminders', path: '/dashboard/medications',       icon: Bell },
  { key: 'messages',     label: 'Messages',             path: '/dashboard/messages',          icon: MessageSquare },
  { key: 'video',        label: 'Video Consultations',  path: '/dashboard/video',             icon: Video },
  { key: 'baby-care',    label: 'Baby Care',            path: '/dashboard/baby-care',         icon: Baby },
  { key: 'documents',    label: 'Documents',            path: '/dashboard/documents',         icon: FolderOpen },
  { key: 'settings',     label: 'Settings',             path: '/dashboard/settings',          icon: Settings },
];
