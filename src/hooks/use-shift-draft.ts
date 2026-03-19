"use client";

import type { SchichtTyp, Auftrag } from "@/lib/types";

const DRAFT_KEY = "shift_draft";

export interface ShiftDraft {
  schichttyp: SchichtTyp;
  datum: string;
  auftraege: Auftrag[];
}

export function useShiftDraft() {
  function saveDraft(data: ShiftDraft): void {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      // localStorage may be full or unavailable — silently ignore
    }
  }

  function loadDraft(): ShiftDraft | null {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ShiftDraft;
      // Basic validation
      if (parsed && parsed.datum && parsed.schichttyp) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  function clearDraft(): void {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // silently ignore
    }
  }

  return { saveDraft, loadDraft, clearDraft };
}
