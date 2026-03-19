"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
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
import { Separator } from "@/components/ui/separator";

const deleteAccountSchema = z.object({
  passwort: z.string().min(1, "Passwort ist erforderlich"),
});

type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      passwort: "",
    },
  });

  async function onSubmitDelete(values: DeleteAccountFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: values.passwort }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ??
            "Konto konnte nicht geloescht werden. Bitte pruefe dein Passwort."
        );
        return;
      }

      router.push("/login");
    } catch {
      setError("Konto konnte nicht geloescht werden. Bitte pruefe dein Passwort.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      form.reset();
      setError(null);
    }
    setDeleteDialogOpen(open);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      <div>
        <h2 className="text-xl font-semibold">Einstellungen</h2>
        <p className="text-sm text-muted-foreground">
          Verwalte dein Konto und deine Einstellungen.
        </p>
      </div>

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Gefahrenzone</CardTitle>
          <CardDescription>
            Lösche dein Konto und alle damit verbundenen Daten unwiderruflich.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            className="min-h-[44px]"
          >
            Konto löschen
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konto unwiderruflich löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Alle deine Daten (Schichten, Aufträge) werden endgültig gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden. Bitte gib dein
              Passwort zur Bestätigung ein.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitDelete)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="passwort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort bestätigen</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Dein aktuelles Passwort"
                        className="min-h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel className="min-h-[44px]">
                  Abbrechen
                </AlertDialogCancel>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting}
                  className="min-h-[44px]"
                >
                  {isSubmitting
                    ? "Wird gelöscht..."
                    : "Endgültig löschen"}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
