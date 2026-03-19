"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import type { Auftrag } from "@/lib/types";

const orderSchema = z
  .object({
    auftragsnummer: z
      .string()
      .min(1, "Auftragsnummer ist erforderlich"),
    cad_nummer: z.string().optional(),
    beschreibung: z.string().optional(),
    startzeit: z.string().optional(),
    endzeit: z.string().optional(),
    notiz: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startzeit && data.endzeit) {
        return data.startzeit < data.endzeit;
      }
      return true;
    },
    {
      message: "Startzeit muss vor Endzeit liegen",
      path: ["endzeit"],
    }
  );

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Auftrag | null;
  onSave: (values: OrderFormValues) => void;
}

export function OrderDialog({
  open,
  onOpenChange,
  order,
  onSave,
}: OrderDialogProps) {
  const isEditing = !!order;

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      auftragsnummer: "",
      cad_nummer: "",
      beschreibung: "",
      startzeit: "",
      endzeit: "",
      notiz: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (order) {
        form.reset({
          auftragsnummer: order.auftragsnummer,
          cad_nummer: order.cad_nummer ?? "",
          beschreibung: order.beschreibung ?? "",
          startzeit: order.startzeit ?? "",
          endzeit: order.endzeit ?? "",
          notiz: order.notiz ?? "",
        });
      } else {
        form.reset({
          auftragsnummer: "",
          cad_nummer: "",
          beschreibung: "",
          startzeit: "",
          endzeit: "",
          notiz: "",
        });
      }
    }
  }, [open, order, form]);

  function handleSubmit(values: OrderFormValues) {
    onSave(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Auftrag bearbeiten" : "Auftrag hinzufügen"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Änderungen am Auftrag vornehmen."
              : "Neuen Auftrag zur Schicht hinzufügen."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="auftragsnummer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auftragsnummer *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. A-12345"
                      className="min-h-[44px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cad_nummer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CAD-Nummer</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional"
                      className="min-h-[44px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Erscheint nicht im Stundenzettel
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="beschreibung"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arbeitsbeschreibung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startzeit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Startzeit</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="min-h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endzeit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endzeit</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="min-h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notiz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interne Notiz</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Erscheint nicht im Stundenzettel
                  </FormDescription>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="min-h-[44px]"
              >
                Abbrechen
              </Button>
              <Button type="submit" className="min-h-[44px]">
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
