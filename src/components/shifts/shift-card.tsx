"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Schicht, SchichtTyp } from "@/lib/types";
import {
  formatShiftDate,
  formatDuration,
  calculateOvertime,
  calculateTotalMinutes,
} from "@/lib/shifts";

const SHIFT_BADGE_STYLES: Record<SchichtTyp, string> = {
  frueh: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  spaet: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
  nacht: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100",
};

const SHIFT_LABELS: Record<SchichtTyp, string> = {
  frueh: "Früh",
  spaet: "Spät",
  nacht: "Nacht",
};

interface ShiftCardProps {
  shift: Schicht;
  onEdit: (shift: Schicht) => void;
  onDelete: (shift: Schicht) => void;
}

export function ShiftCard({ shift, onEdit, onDelete }: ShiftCardProps) {
  const totalMinutes = calculateTotalMinutes(
    shift.auftraege,
    shift.schichttyp
  );
  const overtimeMinutes = calculateOvertime(
    shift.auftraege,
    shift.schichttyp
  );

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => onEdit(shift)}
      role="button"
      tabIndex={0}
      aria-label={`Schicht vom ${formatShiftDate(shift.datum)}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(shift);
        }
      }}
    >
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-sm font-medium">
            {formatShiftDate(shift.datum)}
          </span>
          <Badge
            variant="outline"
            className={SHIFT_BADGE_STYLES[shift.schichttyp]}
          >
            {SHIFT_LABELS[shift.schichttyp]}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {shift.auftraege.length}{" "}
            {shift.auftraege.length === 1 ? "Auftrag" : "Aufträge"}
          </span>
          <span className="text-sm font-medium">
            {formatDuration(totalMinutes)}
          </span>
          {overtimeMinutes > 0 && (
            <span className="text-sm font-semibold text-green-700">
              {formatDuration(overtimeMinutes, true)}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(shift);
            }}
            aria-label="Schicht bearbeiten"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(shift);
            }}
            aria-label="Schicht löschen"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
