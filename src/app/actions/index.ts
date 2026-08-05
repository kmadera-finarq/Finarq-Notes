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
  return { group, memberIds: allMembers };
}

export async function addMembersToGroup(groupId: string, memberIds: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("group_members").insert(
    memberIds.map((profile_id) => ({ group_id: groupId, profile_id }))
  );
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function updateGroup(
  groupId: string,
  name: string,
  memberIds: string[]
) {
  const supabase = await createClient();

  const { data: group, error: nameErr } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", groupId)
    .select()
    .single();
  if (nameErr) throw nameErr;

  const { error: delErr } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId);
  if (delErr) throw delErr;

  if (memberIds.length > 0) {
    const { error: insErr } = await supabase.from("group_members").insert(
      memberIds.map((profile_id) => ({ group_id: groupId, profile_id }))
    );
    if (insErr) throw insErr;
  }

  revalidatePath("/dashboard");
  return { group, memberIds };
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function deleteUserProfile(profileId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId);
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

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      group_id: input.groupId,
      title: input.title,
      description: input.description,
      assignee_id: input.assigneeId,
      priority: input.priority,
      due_date: input.dueDate,
      created_by: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard");
  return task;
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
    leader_notes: string;
    leader_notes_done: boolean;
    team_notes: string;
    team_notes_done: boolean;
  }>
) {
  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard");
  return task;
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function getDueDateHistory(taskId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_due_date_history")
    .select("*")
    .eq("task_id", taskId)
    .order("changed_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}