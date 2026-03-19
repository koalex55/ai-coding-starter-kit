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

const changePasswordSchema = z
  .object({
    neuesPasswort: z
      .string()
      .min(8, "Das Passwort muss mindestens 8 Zeichen haben"),
    passwortBestaetigen: z.string(),
  })
  .refine((data) => data.neuesPasswort === data.passwortBestaetigen, {
    message: "Die Passwörter stimmen nicht überein",
    path: ["passwortBestaetigen"],
  })
  .refine((data) => data.neuesPasswort !== "1234", {
    message: "Das neue Passwort darf nicht das Standard-Passwort sein",
    path: ["neuesPasswort"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface ChangePasswordDialogProps {
  open: boolean;
  onPasswordChanged: () => void;
}

export function ChangePasswordDialog({
  open,
  onPasswordChanged,
}: ChangePasswordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      neuesPasswort: "",
      passwortBestaetigen: "",
    },
  });

  async function onSubmit(_values: ChangePasswordFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: wire up Supabase in /backend — call supabase.auth.updateUser({ password })
      // TODO: also update user_metadata to set muss_passwort_aendern = false
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
      onPasswordChanged();
    } catch {
      setError("Passwort konnte nicht geändert werden. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Hide close button by removing it via CSS
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Passwort ändern</DialogTitle>
          <DialogDescription>
            Bitte ändere dein Standard-Passwort, um dein Konto zu sichern.
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
              name="neuesPasswort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Neues Passwort</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Mindestens 8 Zeichen"
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
              name="passwortBestaetigen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort bestätigen</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Passwort wiederholen"
                      className="min-h-[44px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px]"
              >
                {isSubmitting ? "Wird geändert..." : "Passwort ändern"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
