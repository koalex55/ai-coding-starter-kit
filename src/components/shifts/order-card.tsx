"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Auftrag } from "@/lib/types";

interface OrderCardProps {
  order: Auftrag;
  onEdit: (order: Auftrag) => void;
  onDelete: (order: Auftrag) => void;
}

export function OrderCard({ order, onEdit, onDelete }: OrderCardProps) {
  const hasTime = order.startzeit && order.endzeit;

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-3">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-sm font-bold">{order.auftragsnummer}</span>
          {order.beschreibung && (
            <span className="text-xs text-muted-foreground">
              {order.beschreibung}
            </span>
          )}
          {hasTime && (
            <span className="text-xs text-muted-foreground">
              {order.startzeit} – {order.endzeit} Uhr
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => onEdit(order)}
            aria-label={`Auftrag ${order.auftragsnummer} bearbeiten`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
            onClick={() => onDelete(order)}
            aria-label={`Auftrag ${order.auftragsnummer} löschen`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
