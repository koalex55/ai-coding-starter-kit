"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { MonthNavigator } from "@/components/shifts/month-navigator";
import { ShiftCard } from "@/components/shifts/shift-card";
import { MonthSummary } from "@/components/shifts/month-summary";
import { ShiftSheet } from "@/components/shifts/shift-sheet";
import { DeleteShiftDialog } from "@/components/shifts/delete-shift-dialog";
import type { Schicht, SchichtTyp, Auftrag } from "@/lib/types";

// --- Mock data for development (TODO: replace with Supabase queries in /backend) ---
const MOCK_SHIFTS: Schicht[] = [
  {
    id: "1",
    user_id: "mock-user",
    schichttyp: "frueh",
    datum: "2026-03-02",
    regulaere_stunden: 8.75,
    erstellt_am: "2026-03-02T07:00:00Z",
    auftraege: [
      {
        id: "a1",
        shift_id: "1",
        user_id: "mock-user",
        auftragsnummer: "A-1001",
        beschreibung: "Gehäuse fräsen",
        startzeit: "06:00",
        endzeit: "10:30",
      },
      {
        id: "a2",
        shift_id: "1",
        user_id: "mock-user",
        auftragsnummer: "B-2045",
        beschreibung: "Welle drehen",
        startzeit: "10:30",
        endzeit: "14:45",
      },
    ],
  },
  {
    id: "2",
    user_id: "mock-user",
    schichttyp: "spaet",
    datum: "2026-03-03",
    regulaere_stunden: 8.5,
    erstellt_am: "2026-03-03T14:00:00Z",
    auftraege: [
      {
        id: "a3",
        shift_id: "2",
        user_id: "mock-user",
        auftragsnummer: "C-3010",
        beschreibung: "Montage Baugruppe",
        startzeit: "13:00",
        endzeit: "18:00",
      },
    ],
  },
  {
    id: "3",
    user_id: "mock-user",
    schichttyp: "nacht",
    datum: "2026-03-05",
    regulaere_stunden: 8.5,
    erstellt_am: "2026-03-05T22:00:00Z",
    auftraege: [
      {
        id: "a4",
        shift_id: "3",
        user_id: "mock-user",
        auftragsnummer: "D-4100",
        startzeit: "21:30",
        endzeit: "03:00",
      },
      {
        id: "a5",
        shift_id: "3",
        user_id: "mock-user",
        auftragsnummer: "E-5200",
        beschreibung: "Qualitätskontrolle",
        startzeit: "03:00",
        endzeit: "06:00",
      },
    ],
  },
  {
    id: "4",
    user_id: "mock-user",
    schichttyp: "frueh",
    datum: "2026-03-10",
    regulaere_stunden: 8.75,
    erstellt_am: "2026-03-10T07:00:00Z",
    auftraege: [],
  },
  {
    id: "5",
    user_id: "mock-user",
    schichttyp: "spaet",
    datum: "2026-03-17",
    regulaere_stunden: 8.5,
    erstellt_am: "2026-03-17T14:00:00Z",
    auftraege: [
      {
        id: "a6",
        shift_id: "5",
        user_id: "mock-user",
        auftragsnummer: "F-6001",
        beschreibung: "CNC-Programmierung",
        startzeit: "13:00",
        endzeit: "17:30",
      },
      {
        id: "a7",
        shift_id: "5",
        user_id: "mock-user",
        auftragsnummer: "G-7002",
        startzeit: "17:30",
        endzeit: "22:00",
      },
    ],
  },
];

export default function HomePage() {
  const { profile } = useAuth();

  // Month navigation
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(2026, 2, 1) // März 2026
  );

  // Shifts state (mock data for now)
  const [shifts, setShifts] = useState<Schicht[]>(MOCK_SHIFTS);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [editingShift, setEditingShift] = useState<Schicht | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingShift, setDeletingShift] = useState<Schicht | null>(null);

  // Filter shifts for current month
  const monthShifts = shifts.filter((s) => {
    const d = new Date(s.datum + "T00:00:00");
    return (
      d.getMonth() === currentMonth.getMonth() &&
      d.getFullYear() === currentMonth.getFullYear()
    );
  });

  // Sort by date ascending
  const sortedShifts = [...monthShifts].sort(
    (a, b) => a.datum.localeCompare(b.datum)
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

  const handleSheetSave = useCallback(
    (data: {
      datum: string;
      schichttyp: SchichtTyp;
      auftraege: Auftrag[];
    }) => {
      // TODO: wire up in /backend - save via Supabase
      if (sheetMode === "edit" && editingShift) {
        setShifts((prev) =>
          prev.map((s) =>
            s.id === editingShift.id
              ? {
                  ...s,
                  datum: data.datum,
                  schichttyp: data.schichttyp,
                  auftraege: data.auftraege,
                }
              : s
          )
        );
      } else {
        const newShift: Schicht = {
          id: crypto.randomUUID(),
          user_id: profile?.id ?? "",
          schichttyp: data.schichttyp,
          datum: data.datum,
          regulaere_stunden:
            data.schichttyp === "frueh" ? 8.75 : 8.5,
          erstellt_am: new Date().toISOString(),
          auftraege: data.auftraege,
        };
        setShifts((prev) => [...prev, newShift]);
      }
    },
    [sheetMode, editingShift, profile]
  );

  function handleConfirmDelete() {
    if (!deletingShift) return;
    // TODO: wire up in /backend - delete via Supabase
    setShifts((prev) => prev.filter((s) => s.id !== deletingShift.id));
    setDeleteDialogOpen(false);
    setDeletingShift(null);
    // Also close the sheet if it was open for this shift
    if (editingShift?.id === deletingShift.id) {
      setSheetOpen(false);
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
      {/* Header with greeting and add button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Willkommen{profile ? `, ${profile.vorname}` : ""}
        </h2>
        <Button
          onClick={handleCreateShift}
          className="min-h-[44px] gap-1"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Schicht erfassen</span>
          <span className="sm:hidden">Neu</span>
        </Button>
      </div>

      {/* Month navigator */}
      <MonthNavigator
        month={currentMonth}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
      />

      {/* Shift list or empty state */}
      {sortedShifts.length === 0 ? (
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
      {sortedShifts.length > 0 && <MonthSummary shifts={sortedShifts} />}

      {/* Shift Sheet */}
      <ShiftSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        shift={editingShift}
        onSave={handleSheetSave}
        onDelete={handleSheetDelete}
      />

      {/* Delete confirmation dialog */}
      <DeleteShiftDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        shift={deletingShift}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
