import React, { createContext, useContext, useState } from 'react';
import type { Role } from '@/lib/demo-data';
import { ROLES } from '@/lib/demo-data';

interface AppContextValue {
  role: Role;
  setRole: (role: Role) => void;
  currentUser: typeof ROLES[number];
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUser = ROLES.find(r => r.id === role) ?? ROLES[0];

  return (
    <AppContext.Provider value={{ role, setRole, currentUser, sidebarOpen, setSidebarOpen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
