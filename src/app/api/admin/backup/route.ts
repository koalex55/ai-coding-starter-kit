import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/helpers";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const admin = createAdminClient();

  const [profilesResult, shiftsResult, auftraegeResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id, personalnummer, vorname, nachname, rolle, erstellt_am")
      .order("erstellt_am", { ascending: false }),
    admin
      .from("shifts")
      .select("*")
      .order("datum", { ascending: false }),
    admin
      .from("auftraege")
      .select("*")
      .order("id", { ascending: false }),
  ]);

  if (profilesResult.error || shiftsResult.error || auftraegeResult.error) {
    return Response.json(
      { error: "Backup konnte nicht erstellt werden." },
      { status: 500 }
    );
  }

  const backup = {
    version: "1.0",
    created_at: new Date().toISOString(),
    data: {
      profiles: profilesResult.data ?? [],
      shifts: shiftsResult.data ?? [],
      auftraege: auftraegeResult.data ?? [],
    },
  };

  return Response.json(backup);
}
