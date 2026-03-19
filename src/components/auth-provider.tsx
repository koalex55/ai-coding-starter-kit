"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AuthUser, UserProfile, UserRole } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  role: UserRole | null;
  mustChangePassword: boolean;
  isLoading: boolean;
  login: (personalnummer: string, passwort: string) => Promise<void>;
  logout: () => Promise<void>;
  setMustChangePassword: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth muss innerhalb von AuthProvider verwendet werden");
  }
  return ctx;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const role = profile?.rolle ?? null;

  useEffect(() => {
    // TODO: wire up Supabase in /backend — load session and profile
    // For now, simulate loading complete with no user (logged out)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const login = useCallback(async (personalnummer: string, _passwort: string) => {
    // TODO: wire up Supabase in /backend — authenticate with supabase.auth.signInWithPassword
    // email would be `${personalnummer}@intern.app`

    // Mock: simulate successful login for development
    const mockUser: AuthUser = {
      id: "mock-user-id",
      email: `${personalnummer}@intern.app`,
    };
    const mockProfile: UserProfile = {
      id: "mock-user-id",
      personalnummer,
      vorname: "Max",
      nachname: "Mustermann",
      rolle: "worker",
      erstellt_am: new Date().toISOString(),
    };

    setUser(mockUser);
    setProfile(mockProfile);
    setMustChangePassword(false); // TODO: read from user_metadata
  }, []);

  const logout = useCallback(async () => {
    // TODO: wire up Supabase in /backend — call supabase.auth.signOut()
    setUser(null);
    setProfile(null);
    setMustChangePassword(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        mustChangePassword,
        isLoading,
        login,
        logout,
        setMustChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
