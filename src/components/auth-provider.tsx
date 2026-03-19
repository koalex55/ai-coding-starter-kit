"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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

  const supabase = createClient();

  // Load existing session on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser({ id: authUser.id, email: authUser.email ?? "" });

          // Fetch profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();

          if (profileData) {
            setProfile(profileData as UserProfile);
          }

          // Check must-change-password flag
          setMustChangePassword(
            authUser.user_metadata?.muss_passwort_aendern === true
          );
        }
      } catch {
        // Session not available — user is logged out
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        setProfile(null);
        setMustChangePassword(false);
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const authUser = session.user;
        setUser({ id: authUser.id, email: authUser.email ?? "" });

        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profileData) {
          setProfile(profileData as UserProfile);
        }

        setMustChangePassword(
          authUser.user_metadata?.muss_passwort_aendern === true
        );
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (personalnummer: string, passwort: string) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalnummer, password: passwort }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Anmeldung fehlgeschlagen.");
      }

      // The server-side login route already set the session cookie.
      // We set state from the response to avoid an extra round-trip.
      setUser(data.user);
      setProfile(data.profile);
      setMustChangePassword(data.mustChangePassword ?? false);
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setMustChangePassword(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
