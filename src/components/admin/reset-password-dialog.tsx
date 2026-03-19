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

  async function handleReset() {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // TODO: wire up Supabase in /backend
      // 1. Call API to reset user password to "1234"
      // 2. Set must_change_password flag in user_metadata
      await new Promise((resolve) => setTimeout(resolve, 500));
      onPasswordReset();
    } catch {
      // TODO: show error toast
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
