import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Workspace from "@/components/Workspace";
import AreaPicker from "@/components/AreaPicker";

const ADMIN_EMAIL = "info@finarq.mx";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: allAreas } = await supabase.from("areas").select("*").order("name");

  let { data: myProfileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Si el perfil no existe (por ejemplo, un administrador lo eliminó),
  // se vuelve a crear automáticamente al iniciar sesión de nuevo.
  if (!myProfileRow) {
    const fullName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "Sin nombre";
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({ id: user.id, full_name: fullName, avatar_color: count ?? 0 })
      .select()
      .single();
    myProfileRow = newProfile;
  }

  const { data: myUserAreas } = await supabase
    .from("user_areas")
    .select("area_id")
    .eq("profile_id", user.id);

  const myAreaIds = (myUserAreas ?? []).map((r) => r.area_id);

  // Si todavía no eligió ningún área, se le pide antes de ver nada más
  if (myAreaIds.length === 0) {
    return <AreaPicker areas={allAreas ?? []} />;
  }

  const myAreas = (allAreas ?? []).filter((a) => myAreaIds.includes(a.id));
  const activeAreaId =
    myProfileRow?.last_area_id && myAreaIds.includes(myProfileRow.last_area_id)
      ? myProfileRow.last_area_id
      : myAreaIds[0];
  const activeAreaName = myAreas.find((a) => a.id === activeAreaId)?.name ?? "";

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .eq("area_id", activeAreaId)
    .order("created_at");

  const groupIds = (groups ?? []).map((g) => g.id);

  const [{ data: members }, { data: tasks }, { data: areaUserRows }] =
    await Promise.all([
      groupIds.length
        ? supabase.from("group_members").select("*").in("group_id", groupIds)
        : Promise.resolve({ data: [] as any[] }),
      groupIds.length
        ? supabase.from("tasks").select("*").in("group_id", groupIds).order("created_at")
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("user_areas").select("profile_id").eq("area_id", activeAreaId),
    ]);

  const areaProfileIds = (areaUserRows ?? []).map((r) => r.profile_id);
  const { data: profiles } = areaProfileIds.length
    ? await supabase.from("profiles").select("*").in("id", areaProfileIds)
    : { data: [] as any[] };

  return (
    <Workspace
      currentUserId={user.id}
      isAdmin={user.email === ADMIN_EMAIL}
      areaName={activeAreaName}
      myAreas={myAreas}
      activeAreaId={activeAreaId}
      initialProfiles={profiles ?? []}
      initialGroups={groups ?? []}
      initialMembers={members ?? []}
      initialTasks={tasks ?? []}
    />
  );
}