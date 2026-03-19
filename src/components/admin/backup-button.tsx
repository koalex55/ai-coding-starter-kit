"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BackupButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleBackup() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/backup");

      if (!response.ok) {
        toast.error("Backup fehlgeschlagen – bitte erneut versuchen");
        return;
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const filename = `backup_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.json`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Backup erfolgreich erstellt");
    } catch {
      toast.error("Backup fehlgeschlagen – bitte erneut versuchen");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleBackup}
        disabled={isLoading}
        className="min-h-[44px]"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Backup erstellen
      </Button>
      <p className="text-xs text-muted-foreground">
        Das Backup enthält personenbezogene Daten. Bitte sicher aufbewahren.
      </p>
    </div>
  );
}
