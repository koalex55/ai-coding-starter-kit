"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackupButton } from "@/components/admin/backup-button";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";
import type { UserProfile } from "@/lib/types";

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] =
    useState<UserProfile | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserProfile | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Benutzerliste konnte nicht geladen werden.");
        return;
      }

      setUsers(data.users ?? []);
    } catch {
      setError("Keine Verbindung zum Server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleUserCreated() {
    setCreateDialogOpen(false);
    fetchUsers();
  }

  function handlePasswordReset() {
    setResetPasswordUser(null);
  }

  function handleUserDeleted() {
    setDeleteUser(null);
    fetchUsers();
  }

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Wird geladen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Benutzerverwaltung</h2>
          <p className="text-sm text-muted-foreground">
            {users.length} {users.length === 1 ? "Benutzer" : "Benutzer"}{" "}
            registriert
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="min-h-[44px]"
        >
          Neuen Nutzer erstellen
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            Noch keine Benutzer vorhanden.
          </p>
          <Button
            variant="link"
            onClick={() => setCreateDialogOpen(true)}
            className="mt-2"
          >
            Ersten Nutzer erstellen
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Personalnr.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono">
                      {user.personalnummer}
                    </TableCell>
                    <TableCell>
                      {user.vorname} {user.nachname}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.rolle === "admin" ? "default" : "secondary"
                        }
                      >
                        {user.rolle === "admin" ? "Admin" : "Arbeiter"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.erstellt_am)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResetPasswordUser(user)}
                          className="min-h-[44px]"
                        >
                          Passwort zurücksetzen
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteUser(user)}
                          className="min-h-[44px]"
                        >
                          Konto löschen
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {user.vorname} {user.nachname}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {user.personalnummer}
                    </p>
                  </div>
                  <Badge
                    variant={
                      user.rolle === "admin" ? "default" : "secondary"
                    }
                  >
                    {user.rolle === "admin" ? "Admin" : "Arbeiter"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Erstellt am {formatDate(user.erstellt_am)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResetPasswordUser(user)}
                    className="flex-1 min-h-[44px]"
                  >
                    Passwort zurücksetzen
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteUser(user)}
                    className="flex-1 min-h-[44px]"
                  >
                    Konto löschen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Datensicherung */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datensicherung</CardTitle>
          <CardDescription>
            Exportiere alle Nutzerdaten als JSON-Datei.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BackupButton />
        </CardContent>
      </Card>

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onUserCreated={handleUserCreated}
      />

      <ResetPasswordDialog
        open={resetPasswordUser !== null}
        onOpenChange={(open) => {
          if (!open) setResetPasswordUser(null);
        }}
        user={resetPasswordUser}
        onPasswordReset={handlePasswordReset}
      />

      <DeleteUserDialog
        open={deleteUser !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteUser(null);
        }}
        user={deleteUser}
        onUserDeleted={handleUserDeleted}
      />
    </div>
  );
}
