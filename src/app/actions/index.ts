"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Priority, Status } from "@/lib/types";

export async function createGroup(name: string, memberIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: group, error } = await supabase
    .from("groups")
    .insert({ name, created_by: user.id })
    .select()
    .single();
  if (error) throw error;

  const allMembers = Array.from(new Set([...memberIds, user.id]));
  const { error: memErr } = await supabase.from("group_members").insert(
    allMembers.map((profile_id) => ({ group_id: group.id, profile_id }))
  );
  if (memErr) throw memErr;

  revalidatePath("/dashboard");
  return group;
}

export async function addMembersToGroup(groupId: string, memberIds: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("group_members").insert(
    memberIds.map((profile_id) => ({ group_id: groupId, profile_id }))
  );
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function createTask(input: {
  groupId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  priority: Priority;
  dueDate: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("tasks").insert({
    group_id: input.groupId,
    title: input.title,
    description: input.description,
    assignee_id: input.assigneeId,
    priority: input.priority,
    due_date: input.dueDate,
    created_by: user.id,
  });
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function updateTask(
  id: string,
  patch: Partial<{
    title: string;
    description: string;
    assignee_id: string | null;
    priority: Priority;
    status: Status;
    due_date: string | null;
  }>
) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
