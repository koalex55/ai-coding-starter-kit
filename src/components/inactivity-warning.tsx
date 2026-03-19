"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface InactivityWarningProps {
  open: boolean;
  remainingSeconds: number;
  onStayActive: () => void;
}

export function InactivityWarning({
  open,
  remainingSeconds,
  onStayActive,
}: InactivityWarningProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay =
    minutes > 0
      ? `${minutes}:${seconds.toString().padStart(2, "0")} Minuten`
      : `${seconds} Sekunden`;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Inaktivitätswarnung</AlertDialogTitle>
          <AlertDialogDescription>
            Du wirst in {timeDisplay} abgemeldet. Jetzt aktiv bleiben?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onStayActive}
            className="min-h-[44px]"
          >
            Aktiv bleiben
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
