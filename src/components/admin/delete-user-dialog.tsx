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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/lib/types";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onUserDeleted: () => void;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onUserDeleted,
}: DeleteUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // TODO: wire up Supabase in /backend
      // 1. Call API to delete user account + all related data (shifts, orders)
      // 2. Cascade delete via RLS + ON DELETE CASCADE
      // 3. If user is currently logged in, their session will be invalidated
      await new Promise((resolve) => setTimeout(resolve, 500));
      onUserDeleted();
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
          <AlertDialogTitle>Konto endgültig löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Alle Daten von{" "}
            <span className="font-semibold">{fullName}</span> (Schichten,
            Aufträge) werden unwiderruflich gelöscht. Diese Aktion kann nicht
            rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-[44px]">
            Abbrechen
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="min-h-[44px]"
          >
            {isSubmitting ? "Wird gelöscht..." : "Endgültig löschen"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
