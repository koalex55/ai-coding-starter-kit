import type { Auftrag, SchichtTyp } from "@/lib/types";

export interface ShiftConfig {
  label: string;
  start: string; // HH:mm
  end: string;   // HH:mm
  durationMinutes: number;
  durationHours: number;
}

export const SHIFT_CONFIG: Record<SchichtTyp, ShiftConfig> = {
  frueh: {
    label: "Frueh",
    start: "06:00",
    end: "14:45",
    durationMinutes: 525,
    durationHours: 8.75,
  },
  spaet: {
    label: "Spaet",
    start: "13:00",
    end: "21:30",
    durationMinutes: 510,
    durationHours: 8.5,
  },
  nacht: {
    label: "Nacht",
    start: "21:30",
    end: "06:00",
    durationMinutes: 510,
    durationHours: 8.5,
  },
};

export const SHIFT_TYPE_LABELS: Record<SchichtTyp, string> = {
  frueh: "Frueh",
  spaet: "Spaet",
  nacht: "Nacht",
};

/**
 * Parse a HH:mm time string into total minutes since midnight.
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Calculate the duration of an order in minutes.
 * Returns 0 if start or end is missing.
 */
function orderDurationMinutes(order: Auftrag): number {
  if (!order.startzeit || !order.endzeit) return 0;
  const start = timeToMinutes(order.startzeit);
  let end = timeToMinutes(order.endzeit);
  // Handle overnight (Nachtschicht): if end < start, add 24h
  if (end < start) {
    end += 24 * 60;
  }
  return end - start;
}

/**
 * Calculate overtime minutes for a set of orders within a shift.
 * Returns 0 if total order time <= shift duration or no order times are set.
 */
export function calculateOvertime(
  orders: Auftrag[],
  shiftType: SchichtTyp
): number {
  const totalOrderMinutes = orders.reduce(
    (sum, o) => sum + orderDurationMinutes(o),
    0
  );
  if (totalOrderMinutes === 0) return 0;
  const shiftMinutes = SHIFT_CONFIG[shiftType].durationMinutes;
  const overtime = totalOrderMinutes - shiftMinutes;
  return overtime > 0 ? overtime : 0;
}

/**
 * Calculate total worked minutes from orders. Returns shift duration if no orders have times.
 */
export function calculateTotalMinutes(
  orders: Auftrag[],
  shiftType: SchichtTyp
): number {
  const totalOrderMinutes = orders.reduce(
    (sum, o) => sum + orderDurationMinutes(o),
    0
  );
  if (totalOrderMinutes === 0) return SHIFT_CONFIG[shiftType].durationMinutes;
  return totalOrderMinutes;
}

/**
 * Format minutes as "+H:MMh" or "H:MMh".
 * If showPlus is true, prefix with "+" for positive values.
 */
export function formatDuration(minutes: number, showPlus = false): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const prefix = showPlus && minutes > 0 ? "+" : "";
  return `${prefix}${h}:${m.toString().padStart(2, "0")}h`;
}

/**
 * Check for overlapping order time ranges.
 * Returns array of [indexA, indexB] pairs that overlap.
 */
export function checkOrderOverlap(
  orders: Auftrag[]
): [number, number][] {
  const overlaps: [number, number][] = [];
  const ordersWithTime = orders
    .map((o, i) => ({ index: i, order: o }))
    .filter((o) => o.order.startzeit && o.order.endzeit);

  for (let i = 0; i < ordersWithTime.length; i++) {
    for (let j = i + 1; j < ordersWithTime.length; j++) {
      const a = ordersWithTime[i];
      const b = ordersWithTime[j];
      let aStart = timeToMinutes(a.order.startzeit!);
      let aEnd = timeToMinutes(a.order.endzeit!);
      let bStart = timeToMinutes(b.order.startzeit!);
      let bEnd = timeToMinutes(b.order.endzeit!);
      // Handle overnight
      if (aEnd < aStart) aEnd += 24 * 60;
      if (bEnd < bStart) bEnd += 24 * 60;
      // Check overlap: ranges overlap if start < otherEnd && end > otherStart
      if (aStart < bEnd && aEnd > bStart) {
        overlaps.push([a.index, b.index]);
      }
    }
  }
  return overlaps;
}

/**
 * Validate that a time is within the shift window.
 */
export function isTimeWithinShift(
  time: string,
  shiftType: SchichtTyp
): boolean {
  const config = SHIFT_CONFIG[shiftType];
  const t = timeToMinutes(time);
  const start = timeToMinutes(config.start);
  let end = timeToMinutes(config.end);

  // Nachtschicht: end is next day
  if (end < start) {
    // Time is valid if >= start OR <= end (next day)
    return t >= start || t <= end;
  }
  return t >= start && t <= end;
}

/**
 * Format a date string (YYYY-MM-DD) as "Mi, 19.03." German locale style.
 */
export function formatShiftDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const day = days[date.getDay()];
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}, ${d}.${m}.`;
}

/**
 * Format a month as "Maerz 2026" etc.
 */
export function formatMonth(date: Date): string {
  const months = [
    "Januar",
    "Februar",
    "Maerz",
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
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
