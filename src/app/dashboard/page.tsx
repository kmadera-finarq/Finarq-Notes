import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Workspace from "@/components/Workspace";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profiles }, { data: groups }, { data: members }, { data: tasks }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at"),
      supabase.from("groups").select("*").order("created_at"),
      supabase.from("group_members").select("*"),
      supabase.from("tasks").select("*").order("created_at"),
    ]);

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
