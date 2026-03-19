"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/components/auth-provider";
import { TimesheetDocument } from "@/components/pdf/timesheet-document";
import type { Schicht } from "@/lib/types";

const GERMAN_MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMonth: Date;
}

export function ExportDialog({
  open,
  onOpenChange,
  initialMonth,
}: ExportDialogProps) {
  const { profile } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(
    initialMonth.getMonth().toString()
  );
  const [selectedYear, setSelectedYear] = useState(
    initialMonth.getFullYear().toString()
  );
  const [shifts, setShifts] = useState<Schicht[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Reset when dialog opens with new initialMonth
  useEffect(() => {
    if (open) {
      setSelectedMonth(initialMonth.getMonth().toString());
      setSelectedYear(initialMonth.getFullYear().toString());
      setHasFetched(false);
      setShifts([]);
    }
  }, [open, initialMonth]);

  // Fetch shifts when month/year changes
  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    setHasFetched(false);
    try {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth) + 1; // API expects 1-based
      const res = await fetch(`/api/shifts?year=${year}&month=${month}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Laden der Schichten.");
      }
      const data = await res.json();
      setShifts(data.shifts ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fehler beim Laden der Schichten.";
      toast.error(message);
      setShifts([]);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (open) {
      fetchShifts();
    }
  }, [open, fetchShifts]);

  // Build year options: current year and 2 years back
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const monthDate = new Date(
    parseInt(selectedYear),
    parseInt(selectedMonth),
    1
  );
  const monthLabel = `${GERMAN_MONTHS[parseInt(selectedMonth)]} ${selectedYear}`;

  async function handleDownload() {
    if (!profile) return;

    setIsGenerating(true);
    try {
      // Dynamic import to avoid SSR issues
      const { pdf } = await import("@react-pdf/renderer");

      const blob = await pdf(
        <TimesheetDocument
          profile={{
            vorname: profile.vorname,
            nachname: profile.nachname,
            personalnummer: profile.personalnummer,
          }}
          month={monthDate}
          shifts={shifts}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const yyyy = selectedYear;
      const mm = (parseInt(selectedMonth) + 1).toString().padStart(2, "0");
      link.href = url;
      link.download = `Stundenzettel_${profile.nachname}_${yyyy}-${mm}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF wurde heruntergeladen.");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Fehler beim Erstellen des PDFs.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stundenzettel exportieren</DialogTitle>
          <DialogDescription>
            Monat und Jahr auswählen, dann als PDF herunterladen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Month / Year pickers */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Monat</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GERMAN_MONTHS.map((name, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium">Jahr</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Schichten werden geladen...
              </span>
            </div>
          )}

          {/* No shifts alert */}
          {!isLoading && hasFetched && shifts.length === 0 && (
            <Alert>
              <AlertDescription>
                Keine Schichten für {monthLabel} vorhanden.
              </AlertDescription>
            </Alert>
          )}

          {/* Shift count info */}
          {!isLoading && hasFetched && shifts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {shifts.length} Schicht{shifts.length !== 1 ? "en" : ""} für{" "}
              {monthLabel} gefunden.
            </p>
          )}

          {/* Download hint */}
          <p className="text-xs text-muted-foreground">
            <FileText className="mr-1 inline-block h-3 w-3" />
            Das PDF wird als Datei heruntergeladen.
          </p>

          {/* Download button */}
          <Button
            className="min-h-[44px] w-full gap-2"
            onClick={handleDownload}
            disabled={isLoading || isGenerating || shifts.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                PDF wird erstellt...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                PDF herunterladen
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
