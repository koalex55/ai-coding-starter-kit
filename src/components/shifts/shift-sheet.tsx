"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SHIFT_CONFIG,
  checkOrderOverlap,
} from "@/lib/shifts";
import type { Schicht, SchichtTyp, Auftrag } from "@/lib/types";
import { OrderCard } from "@/components/shifts/order-card";
import { OrderDialog } from "@/components/shifts/order-dialog";

type SheetMode = "create" | "edit";

interface ShiftSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SheetMode;
  shift?: Schicht | null;
  onSaved: () => void;
  onDelete?: () => void;
}

const SHIFT_TYPES: SchichtTyp[] = ["frueh", "spaet", "nacht"];

const SHIFT_TYPE_BUTTON_STYLES: Record<SchichtTyp, string> = {
  frueh: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200",
  spaet: "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200",
  nacht: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200",
};

export function ShiftSheet({
  open,
  onOpenChange,
  mode,
  shift,
  onSaved,
  onDelete,
}: ShiftSheetProps) {
  const [datum, setDatum] = useState("");
  const [schichttyp, setSchichttyp] = useState<SchichtTyp>("frueh");
  const [auftraege, setAuftraege] = useState<Auftrag[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Order dialog state
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Auftrag | null>(null);

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      if (mode === "edit" && shift) {
        setDatum(shift.datum);
        setSchichttyp(shift.schichttyp);
        setAuftraege([...shift.auftraege]);
      } else {
        setDatum(new Date().toISOString().slice(0, 10));
        setSchichttyp("frueh");
        setAuftraege([]);
      }
    }
  }, [open, mode, shift]);

  const overlaps = checkOrderOverlap(auftraege);

  const config = SHIFT_CONFIG[schichttyp];

  // --- API helpers ---

  async function createShift(): Promise<Schicht | null> {
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schichttyp, datum }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Fehler beim Erstellen der Schicht.");
    }
    return data.shift;
  }

  async function updateShift(): Promise<Schicht | null> {
    if (!shift) return null;
    const res = await fetch(`/api/shifts/${shift.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schichttyp, datum }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Fehler beim Aktualisieren der Schicht.");
    }
    return data.shift;
  }

  async function createOrder(shiftId: string, order: Auftrag): Promise<void> {
    const res = await fetch(`/api/shifts/${shiftId}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auftragsnummer: order.auftragsnummer,
        cad_nummer: order.cad_nummer || undefined,
        beschreibung: order.beschreibung || undefined,
        startzeit: order.startzeit || undefined,
        endzeit: order.endzeit || undefined,
        notiz: order.notiz || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Fehler beim Erstellen des Auftrags.");
    }
    if (data.warnings) {
      data.warnings.forEach((w: string) => toast.warning(w));
    }
  }

  async function updateOrder(shiftId: string, order: Auftrag): Promise<void> {
    const res = await fetch(`/api/shifts/${shiftId}/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auftragsnummer: order.auftragsnummer,
        cad_nummer: order.cad_nummer ?? null,
        beschreibung: order.beschreibung ?? null,
        startzeit: order.startzeit ?? null,
        endzeit: order.endzeit ?? null,
        notiz: order.notiz ?? null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Fehler beim Aktualisieren des Auftrags.");
    }
    if (data.warnings) {
      data.warnings.forEach((w: string) => toast.warning(w));
    }
  }

  async function deleteOrderApi(shiftId: string, orderId: string): Promise<void> {
    const res = await fetch(`/api/shifts/${shiftId}/orders/${orderId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Fehler beim Loeschen des Auftrags.");
    }
  }

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (mode === "create") {
        // Step 1: Create the shift
        const newShift = await createShift();
        if (!newShift) return;

        // Step 2: Create all orders for this new shift
        for (const order of auftraege) {
          await createOrder(newShift.id, order);
        }

        toast.success("Schicht erfasst.");
      } else if (mode === "edit" && shift) {
        // Step 1: Update the shift itself
        await updateShift();

        // Step 2: Sync orders - determine which to create, update, delete
        const existingOrderIds = new Set(shift.auftraege.map((o) => o.id));
        const currentOrderIds = new Set(auftraege.map((o) => o.id));

        // Orders to delete: in existing but not in current
        const toDelete = shift.auftraege.filter((o) => !currentOrderIds.has(o.id));
        // Orders to create: in current but not in existing (temp IDs from crypto.randomUUID)
        const toCreate = auftraege.filter((o) => !existingOrderIds.has(o.id));
        // Orders to update: in both
        const toUpdate = auftraege.filter((o) => existingOrderIds.has(o.id));

        for (const order of toDelete) {
          await deleteOrderApi(shift.id, order.id);
        }
        for (const order of toCreate) {
          await createOrder(shift.id, order);
        }
        for (const order of toUpdate) {
          await updateOrder(shift.id, order);
        }

        toast.success("Schicht aktualisiert.");
      }

      onOpenChange(false);
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Speichern.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [datum, schichttyp, auftraege, mode, shift, onSaved, onOpenChange]);

  function handleAddOrder() {
    setEditingOrder(null);
    setOrderDialogOpen(true);
  }

  function handleEditOrder(order: Auftrag) {
    setEditingOrder(order);
    setOrderDialogOpen(true);
  }

  function handleDeleteOrder(order: Auftrag) {
    setAuftraege((prev) => prev.filter((o) => o.id !== order.id));
  }

  function handleOrderSave(values: {
    auftragsnummer: string;
    cad_nummer?: string;
    beschreibung?: string;
    startzeit?: string;
    endzeit?: string;
    notiz?: string;
  }) {
    if (editingOrder) {
      // Update existing order locally
      setAuftraege((prev) =>
        prev.map((o) =>
          o.id === editingOrder.id
            ? { ...o, ...values }
            : o
        )
      );
    } else {
      // Add new order locally (will be saved to API on sheet save)
      const newOrder: Auftrag = {
        id: crypto.randomUUID(),
        shift_id: shift?.id ?? "",
        user_id: "",
        ...values,
      };
      setAuftraege((prev) => [...prev, newOrder]);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>
              {mode === "edit" ? "Schicht bearbeiten" : "Schicht erfassen"}
            </SheetTitle>
            <SheetDescription>
              {mode === "edit"
                ? "Aenderungen an der Schicht vornehmen."
                : "Neue Schicht fuer einen Arbeitstag erfassen."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-6 py-4">
            {/* Date input */}
            <div className="space-y-2">
              <Label htmlFor="shift-date">Datum</Label>
              <Input
                id="shift-date"
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                disabled={mode === "edit"}
                className="min-h-[44px]"
              />
            </div>

            {/* Shift type selector */}
            <div className="space-y-2">
              <Label>Schichttyp</Label>
              <div className="grid grid-cols-3 gap-2">
                {SHIFT_TYPES.map((type) => {
                  const isSelected = schichttyp === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSchichttyp(type)}
                      className={cn(
                        "min-h-[44px] rounded-md border-2 px-3 py-2 text-sm font-semibold transition-colors",
                        isSelected
                          ? SHIFT_TYPE_BUTTON_STYLES[type]
                          : "border-border bg-background text-muted-foreground hover:bg-accent"
                      )}
                      aria-pressed={isSelected}
                      aria-label={`Schichttyp ${SHIFT_CONFIG[type].label}`}
                    >
                      {SHIFT_CONFIG[type].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time display */}
            <div className="space-y-2">
              <Label>Arbeitszeit</Label>
              <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm font-medium">
                {config.start} – {config.end} Uhr
              </div>
            </div>

            {/* Overlap warning */}
            {overlaps.length > 0 && (
              <Alert className="border-orange-300 bg-orange-50 text-orange-800">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  {overlaps.map(([a, b]) => (
                    <span key={`${a}-${b}`} className="block">
                      Auftragszeiten ueberschneiden sich:{" "}
                      {auftraege[a]?.auftragsnummer} und{" "}
                      {auftraege[b]?.auftragsnummer}
                    </span>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {/* Orders section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Auftraege ({auftraege.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOrder}
                  className="min-h-[44px] gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Auftrag hinzufuegen
                </Button>
              </div>

              {auftraege.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Noch keine Auftraege hinzugefuegt.
                </p>
              ) : (
                <div className="space-y-2">
                  {auftraege.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onEdit={handleEditOrder}
                      onDelete={handleDeleteOrder}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-2 border-t pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-h-[44px] w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                "Speichern"
              )}
            </Button>
            {mode === "edit" && onDelete && (
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={isSaving}
                className="min-h-[44px] w-full"
              >
                Schicht loeschen
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        order={editingOrder}
        onSave={handleOrderSave}
      />
    </>
  );
}
