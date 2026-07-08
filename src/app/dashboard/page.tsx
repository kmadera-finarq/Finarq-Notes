import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Workspace from "@/components/Workspace";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let [{ data: profiles }, { data: groups }, { data: members }, { data: tasks }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at"),
      supabase.from("groups").select("*").order("created_at"),
      supabase.from("group_members").select("*"),
      supabase.from("tasks").select("*").order("created_at"),
    ]);

  // Si el perfil no existe (por ejemplo, un administrador lo eliminó),
  // se vuelve a crear automáticamente al iniciar sesión de nuevo.
  if (profiles && !profiles.some((p) => p.id === user.id)) {
    const fullName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "Sin nombre";
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({ id: user.id, full_name: fullName, avatar_color: profiles.length })
      .select()
      .single();
    if (newProfile) profiles = [...profiles, newProfile];
  }

  return (
    <Workspace
      currentUserId={user.id}
      initialProfiles={profiles ?? []}
      initialGroups={groups ?? []}
      initialMembers={members ?? []}
      initialTasks={tasks ?? []}
    />
  );
}
