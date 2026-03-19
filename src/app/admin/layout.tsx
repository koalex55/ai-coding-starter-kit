"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuthProvider, useAuth } from "@/components/auth-provider";

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { isLoading, user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Wird geladen...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Bitte melde dich an.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <h1 className="text-lg font-semibold">Stundenzettel Admin</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="min-h-[44px]"
          >
            Abmelden
          </Button>
        </div>
      </header>
      <Separator />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
