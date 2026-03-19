"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonth } from "@/lib/shifts";

interface MonthNavigatorProps {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNavigator({ month, onPrev, onNext }: MonthNavigatorProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        size="icon"
        onClick={onPrev}
        className="min-h-[44px] min-w-[44px]"
        aria-label="Vorheriger Monat"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <h2 className="text-lg font-semibold">{formatMonth(month)}</h2>
      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        className="min-h-[44px] min-w-[44px]"
        aria-label="Nächster Monat"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
