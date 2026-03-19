"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { Schicht } from "@/lib/types";
import { formatShiftDate, SHIFT_CONFIG } from "@/lib/shifts";

interface DeleteShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Schicht | null;
  onConfirm: () => void;
}

export function DeleteShiftDialog({
  open,
  onOpenChange,
  shift,
  onConfirm,
}: DeleteShiftDialogProps) {
  if (!shift) return null;

  const shiftLabel = SHIFT_CONFIG[shift.schichttyp].label;
  const orderCount = shift.auftraege.length;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Schicht löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Die Schicht vom {formatShiftDate(shift.datum)} ({shiftLabel}) und
            alle {orderCount}{" "}
            {orderCount === 1 ? "Auftrag" : "Aufträge"} werden unwiderruflich
            gelöscht.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-[44px]">
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            className="min-h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
