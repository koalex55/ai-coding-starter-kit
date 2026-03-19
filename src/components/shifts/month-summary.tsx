"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Schicht } from "@/lib/types";
import {
  calculateOvertime,
  calculateTotalMinutes,
  formatDuration,
} from "@/lib/shifts";

interface MonthSummaryProps {
  shifts: Schicht[];
}

export function MonthSummary({ shifts }: MonthSummaryProps) {
  const totalMinutes = shifts.reduce(
    (sum, s) => sum + calculateTotalMinutes(s.auftraege, s.schichttyp),
    0
  );
  const totalOvertimeMinutes = shifts.reduce(
    (sum, s) => sum + calculateOvertime(s.auftraege, s.schichttyp),
    0
  );

  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-medium">
          Gesamtstunden: {formatDuration(totalMinutes)}
        </span>
        {totalOvertimeMinutes > 0 && (
          <span className="text-sm font-semibold text-green-700">
            Überstunden: {formatDuration(totalOvertimeMinutes, true)}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
