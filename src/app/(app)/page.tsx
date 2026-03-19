"use client";

import { useAuth } from "@/components/auth-provider";

export default function HomePage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Willkommen{profile ? `, ${profile.vorname}` : ""}
      </h2>
      <p className="text-muted-foreground">
        {/* TODO: Replace with shift overview (PROJ-2) */}
        Deine Schichtübersicht wird hier angezeigt.
      </p>
    </div>
  );
}
