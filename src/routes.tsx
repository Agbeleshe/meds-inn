// Route definitions are managed directly in App.tsx using nested React Router v6 routes.
// This file is kept for future use (e.g. route guards, metadata, breadcrumbs).

export interface RouteConfig {
  name: string;
  path: string;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  { name: 'Landing', path: '/', public: true },
  { name: 'Login', path: '/login', public: true },
  { name: 'Sign up', path: '/signup', public: true },
  { name: 'Architecture', path: '/architecture', public: true },
  { name: 'Overview', path: '/dashboard' },
  { name: 'Mother Dashboard', path: '/dashboard/mother' },
  { name: 'Mothers', path: '/dashboard/mothers' },
  { name: 'Mother Profile', path: '/dashboard/mothers/:id' },
  { name: 'Pregnancy Timeline', path: '/dashboard/timeline' },
  { name: 'Care Plans', path: '/dashboard/care-plans' },
  { name: 'Medication Reminders', path: '/dashboard/medications' },
  { name: 'Appointments', path: '/dashboard/appointments' },
  { name: 'Video Consultations', path: '/dashboard/video' },
  { name: 'AI Care Briefs', path: '/dashboard/care-briefs' },
  { name: 'Messages', path: '/dashboard/messages' },
  { name: 'Baby Care', path: '/dashboard/baby-care' },
  { name: 'Documents', path: '/dashboard/documents' },
  { name: 'Analytics', path: '/dashboard/analytics' },
  { name: 'Team', path: '/dashboard/team' },
  { name: 'Settings', path: '/dashboard/settings' },
];
