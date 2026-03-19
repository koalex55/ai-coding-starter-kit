"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { UserProfile } from "@/lib/types";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onPasswordReset: () => void;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onPasswordReset,
}: ResetPasswordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/users/${user.id}/reset-password`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ?? "Passwort konnte nicht zurueckgesetzt werden."
        );
        return;
      }

      onPasswordReset();
    } catch {
      setError("Passwort konnte nicht zurueckgesetzt werden.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) return null;

  const fullName = `${user.vorname} ${user.nachname}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Passwort zurücksetzen</AlertDialogTitle>
          <AlertDialogDescription>
            Das Passwort von <span className="font-semibold">{fullName}</span>{" "}
            wird auf 1234 zurückgesetzt. Der Nutzer muss es beim nächsten Login
            ändern.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-[44px]">
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={isSubmitting}
            className="min-h-[44px]"
          >
            {isSubmitting ? "Wird zurückgesetzt..." : "Zurücksetzen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
