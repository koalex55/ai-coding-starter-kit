"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BackupButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [format, setFormat] = useState<"json" | "csv">("json");

  async function handleBackup() {
    setIsLoading(true);
    try {
      const url =
        format === "csv"
          ? "/api/admin/backup?format=csv"
          : "/api/admin/backup";

      const response = await fetch(url);

      if (!response.ok) {
        toast.error("Backup fehlgeschlagen – bitte erneut versuchen");
        return;
      }

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;

      if (format === "csv") {
        const text = await response.text();
        const blob = new Blob([text], { type: "text/csv" });
        const filename = `backup_${dateStr}.csv`;
        downloadBlob(blob, filename);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const filename = `backup_${dateStr}.json`;
        downloadBlob(blob, filename);
      }

      toast.success("Backup erfolgreich erstellt");
    } catch {
      toast.error("Backup fehlgeschlagen – bitte erneut versuchen");
    } finally {
      setIsLoading(false);
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Select
          value={format}
          onValueChange={(value) => setFormat(value as "json" | "csv")}
        >
          <SelectTrigger className="w-[120px] min-h-[44px]">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
          </SelectContent>
        </Select>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isLoading} className="min-h-[44px]">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Backup erstellen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Datensicherung erstellen?</AlertDialogTitle>
              <AlertDialogDescription>
                Das Backup wird als {format === "csv" ? "CSV" : "JSON"}-Datei
                heruntergeladen.
                {format === "json" &&
                  " Es enthält alle Nutzerdaten, Schichten und Aufträge."}
                {format === "csv" &&
                  " Es enthält die Nutzerdaten (Personalnummer, Name, Rolle)."}
                {" "}Bitte sicher aufbewahren und nicht weitergeben.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleBackup}>
                Backup herunterladen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <p className="text-xs text-muted-foreground">
        Das Backup enthält personenbezogene Daten. Bitte sicher aufbewahren.
      </p>
    </div>
  );
}
