"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { InactivityWarning } from "@/components/inactivity-warning";
import { useInactivityTimer } from "@/hooks/use-inactivity-timer";

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutInner({ children }: AppLayoutProps) {
  const router = useRouter();
  const { user, isLoading, mustChangePassword, setMustChangePassword, logout } =
    useAuth();

  const handleTimeout = useCallback(() => {
    logout().then(() => {
      router.push("/login");
    });
  }, [logout, router]);

  const { showWarning, resetTimer, remainingSeconds } = useInactivityTimer(
    handleTimeout,
    !!user
  );

  function handleLogout() {
    logout().then(() => {
      router.push("/login");
    });
  }

  function handlePasswordChanged() {
    setMustChangePassword(false);
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Wird geladen...</p>
      </div>
    );
  }

  // Not authenticated — redirect to login
  // TODO: wire up Supabase in /backend — this redirect should happen server-side via middleware
  if (!user) {
    // In production, use Next.js middleware for redirects
    // For now, show a message
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          Bitte melde dich an.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <h1 className="text-lg font-semibold">Stundenzettel</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/settings")}
              className="min-h-[44px]"
            >
              Einstellungen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="min-h-[44px]"
            >
              Abmelden
            </Button>
          </div>
        </div>
      </header>
      <Separator />
      <main className="flex-1 p-4 sm:p-6">{children}</main>

      <ChangePasswordDialog
        open={mustChangePassword}
        onPasswordChanged={handlePasswordChanged}
      />

      <InactivityWarning
        open={showWarning}
        remainingSeconds={remainingSeconds}
        onStayActive={resetTimer}
      />
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </AuthProvider>
  );
}
