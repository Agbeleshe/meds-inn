import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { UserProfile } from "@/types/clinical";
import {
  fetchMe,
  loginUser,
  signupMother,
  type LoginParams,
  type MotherSignupParams,
} from "@/lib/api-client";
import { getStoredSessionToken, setStoredSessionToken } from "@/lib/auth-session";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (params: LoginParams) => Promise<{ error: Error | null; user?: UserProfile }>;
  signUpMother: (params: MotherSignupParams) => Promise<{ error: Error | null; user?: UserProfile }>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getStoredSessionToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const { user: profile } = await fetchMe();
      setUser(profile);
    } catch {
      setStoredSessionToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const signIn = async (params: LoginParams) => {
    try {
      const { user: profile, token } = await loginUser(params);
      setStoredSessionToken(token);
      setUser(profile);
      return { error: null, user: profile };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpMother = async (params: MotherSignupParams) => {
    try {
      const { user: profile, token } = await signupMother(params);
      setStoredSessionToken(token);
      setUser(profile);
      return { error: null, user: profile };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = () => {
    setStoredSessionToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUpMother, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
