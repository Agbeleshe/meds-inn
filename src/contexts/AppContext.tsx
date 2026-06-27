import React, { createContext, useContext, useState } from "react";
import type { Role } from "@/types/clinical";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/lib/demo-users";
import { ROLES } from "@/lib/demo-data";

export interface CurrentUserView {
  id: Role;
  label: string;
  name: string;
  initials: string;
  email: string;
  description: string;
}

interface AppContextValue {
  role: Role;
  currentUser: CurrentUserView;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const FALLBACK_USER = ROLES[0];

function toCurrentUser(role: Role, name: string, initials: string, email: string): CurrentUserView {
  const demo = ROLES.find((r) => r.id === role);
  return {
    id: role,
    label: ROLE_LABELS[role],
    name,
    initials,
    email,
    description: demo?.description ?? "",
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role ?? FALLBACK_USER.id;
  const currentUser = user
    ? toCurrentUser(user.role, user.name, user.initials, user.email)
    : toCurrentUser(
        FALLBACK_USER.id,
        FALLBACK_USER.name,
        FALLBACK_USER.initials,
        FALLBACK_USER.email,
      );

  return (
    <AppContext.Provider value={{ role, currentUser, sidebarOpen, setSidebarOpen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
