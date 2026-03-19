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

const loginSchema = z.object({
  personalnummer: z
    .string()
    .min(1, "Personalnummer ist erforderlich"),
  passwort: z
    .string()
    .min(1, "Passwort ist erforderlich"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      personalnummer: "",
      passwort: "",
    },
  });

  async function onSubmit(_values: LoginFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: wire up Supabase in /backend
      // 1. Sign in with supabase.auth.signInWithPassword({ email: `${personalnummer}@intern.app`, password })
      // 2. Check rate limiting / lockout (5 failed attempts = 15 min lockout)
      // 3. Fetch profile to determine role
      // 4. Check must_change_password flag
      // 5. Redirect based on role: admin -> /admin, worker -> /

      // Mock: simulate a short delay then redirect
      await new Promise((resolve) => setTimeout(resolve, 500));

      // TODO: replace with actual role check
      router.push("/");
    } catch {
      setError(
        "Anmeldung fehlgeschlagen. Bitte Personalnummer und Passwort prüfen."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Stundenzettel</CardTitle>
          <CardDescription>
            Melde dich mit deiner Personalnummer an.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
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
                        autoComplete="username"
                        placeholder="z.B. 12345"
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
                name="passwort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="Passwort eingeben"
                        className="min-h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px]"
              >
                {isSubmitting ? "Wird angemeldet..." : "Anmelden"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
