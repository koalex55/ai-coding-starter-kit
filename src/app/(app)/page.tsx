"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { MonthNavigator } from "@/components/shifts/month-navigator";
import { ShiftCard } from "@/components/shifts/shift-card";
import { MonthSummary } from "@/components/shifts/month-summary";
import { ShiftSheet } from "@/components/shifts/shift-sheet";
import { DeleteShiftDialog } from "@/components/shifts/delete-shift-dialog";
import { ExportDialog } from "@/components/pdf/export-dialog";
import type { Schicht, SchichtTyp, Auftrag } from "@/lib/types";

export default function HomePage() {
  const { profile } = useAuth();

  // Month navigation
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  // Shifts state
  const [shifts, setShifts] = useState<Schicht[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [editingShift, setEditingShift] = useState<Schicht | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingShift, setDeletingShift] = useState<Schicht | null>(null);

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Fetch shifts for current month
  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const res = await fetch(`/api/shifts?year=${year}&month=${month}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Laden der Schichten.");
      }
      const data = await res.json();
      setShifts(data.shifts ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Laden der Schichten.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // Sort by date ascending
  const sortedShifts = [...shifts].sort((a, b) =>
    a.datum.localeCompare(b.datum)
  );

  function handlePrevMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }

  function handleNextMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }

  function handleCreateShift() {
    setSheetMode("create");
    setEditingShift(null);
    setSheetOpen(true);
  }

  function handleEditShift(shift: Schicht) {
    setSheetMode("edit");
    setEditingShift(shift);
    setSheetOpen(true);
  }

  function handleDeleteShift(shift: Schicht) {
    setDeletingShift(shift);
    setDeleteDialogOpen(true);
  }

  const handleShiftSaved = useCallback(() => {
    fetchShifts();
  }, [fetchShifts]);

  async function handleConfirmDelete() {
    if (!deletingShift) return;
    try {
      const res = await fetch(`/api/shifts/${deletingShift.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Loeschen der Schicht.");
      }
      toast.success("Schicht geloescht.");
      setDeleteDialogOpen(false);
      // Close the sheet if it was open for this shift
      if (editingShift?.id === deletingShift.id) {
        setSheetOpen(false);
      }
      setDeletingShift(null);
      fetchShifts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Loeschen der Schicht.";
      toast.error(message);
    }
  }

  function handleSheetDelete() {
    if (editingShift) {
      setDeletingShift(editingShift);
      setDeleteDialogOpen(true);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header with greeting and action buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Willkommen{profile ? `, ${profile.vorname}` : ""}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setExportDialogOpen(true)}
            className="min-h-[44px] gap-1"
            aria-label="Stundenzettel exportieren"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Exportieren</span>
          </Button>
          <Button
            onClick={handleCreateShift}
            className="min-h-[44px] gap-1"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Schicht erfassen</span>
            <span className="sm:hidden">Neu</span>
          </Button>
        </div>
      </div>

      {/* Month navigator */}
      <MonthNavigator
        month={currentMonth}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
      />

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Schichten werden geladen...
          </p>
        </div>
      ) : sortedShifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground">
            Noch keine Schichten erfasst.
          </p>
          <Button
            variant="outline"
            className="mt-4 min-h-[44px]"
            onClick={handleCreateShift}
          >
            Erste Schicht erfassen
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedShifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              onEdit={handleEditShift}
              onDelete={handleDeleteShift}
            />
          ))}
        </div>
      )}

      {/* Month summary */}
      {!isLoading && sortedShifts.length > 0 && (
        <MonthSummary shifts={sortedShifts} />
      )}

      {/* Shift Sheet */}
      <ShiftSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        shift={editingShift}
        onSaved={handleShiftSaved}
        onDelete={handleSheetDelete}
      />

      {/* Delete confirmation dialog */}
      <DeleteShiftDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        shift={deletingShift}
        onConfirm={handleConfirmDelete}
      />

      {/* PDF export dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        initialMonth={currentMonth}
      />
    </div>
  );
}
