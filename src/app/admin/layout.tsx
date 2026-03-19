"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// TODO: wire up Supabase in /backend — use AuthProvider to check role
// For now, this layout does not enforce auth; that will be added with the AuthProvider integration.

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

  function handleLogout() {
    // TODO: wire up Supabase in /backend — call auth.logout() then redirect
    router.push("/login");
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
