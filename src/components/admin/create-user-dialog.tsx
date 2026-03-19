"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const createUserSchema = z.object({
  personalnummer: z
    .string()
    .min(1, "Personalnummer ist erforderlich"),
  vorname: z
    .string()
    .min(1, "Vorname ist erforderlich"),
  nachname: z
    .string()
    .min(1, "Nachname ist erforderlich"),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onUserCreated,
}: CreateUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      personalnummer: "",
      vorname: "",
      nachname: "",
    },
  });

  async function onSubmit(_values: CreateUserFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: wire up Supabase in /backend
      // 1. Call API to create user with email `${personalnummer}@intern.app` and password "1234"
      // 2. Create profile row with personalnummer, vorname, nachname, rolle: "worker"
      // 3. Set must_change_password flag in user_metadata
      await new Promise((resolve) => setTimeout(resolve, 500));
      form.reset();
      onUserCreated();
    } catch {
      setError("Benutzer konnte nicht erstellt werden. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      form.reset();
      setError(null);
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neuen Nutzer erstellen</DialogTitle>
          <DialogDescription>
            Erstelle ein neues Benutzerkonto. Das Standard-Passwort wird auf
            1234 gesetzt.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personalnummer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personalnummer</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="z.B. 10004"
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
              name="vorname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vorname</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Vorname"
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
              name="nachname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nachname</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Nachname"
                      className="min-h-[44px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-sm text-muted-foreground">
              Standard-Passwort wird auf 1234 gesetzt. Der Nutzer muss es beim
              ersten Login ändern.
            </p>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="min-h-[44px]"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px]"
              >
                {isSubmitting ? "Wird erstellt..." : "Konto erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
