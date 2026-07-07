"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/actions";
import type { Profile, Group, GroupMember, Task } from "@/lib/types";
import { STATUSES, colorFor, initials } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import Board from "@/components/Board";
import {
  NewGroupModal,
  NewTaskModal,
  TaskDetailModal,
  UsersPanel,
} from "@/components/Modals";

type ModalState =
  | { type: "newGroup" }
  | { type: "newTask"; groupId?: string }
  | { type: "taskDetail"; task: Task }
  | { type: "users" }
  | null;

export default function Workspace({
  currentUserId,
  initialProfiles,
  initialGroups,
  initialMembers,
  initialTasks,
}: {
  currentUserId: string;
  initialProfiles: Profile[];
  initialGroups: Group[];
  initialMembers: GroupMember[];
  initialTasks: Task[];
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [groups, setGroups] = useState(initialGroups);
  const [members, setMembers] = useState(initialMembers);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("workspace-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          setTasks((prev) => {
            if (payload.eventType === "INSERT")
              return [...prev, payload.new as Task];
            if (payload.eventType === "UPDATE")
              return prev.map((t) =>
                t.id === (payload.new as Task).id ? (payload.new as Task) : t
              );
            if (payload.eventType === "DELETE")
              return prev.filter((t) => t.id !== (payload.old as Task).id);
            return prev;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups" },
        (payload) => {
          setGroups((prev) => {
            if (payload.eventType === "INSERT")
              return [...prev, payload.new as Group];
            if (payload.eventType === "DELETE")
              return prev.filter((g) => g.id !== (payload.old as Group).id);
            return prev;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members" },
        (payload) => {
          setMembers((prev) => {
            if (payload.eventType === "INSERT")
              return [...prev, payload.new as GroupMember];
            return prev;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          setProfiles((prev) => {
            if (payload.eventType === "INSERT")
              return [...prev, payload.new as Profile];
            if (payload.eventType === "UPDATE")
              return prev.map((p) =>
                p.id === (payload.new as Profile).id
                  ? (payload.new as Profile)
                  : p
              );
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const me = profiles.find((p) => p.id === currentUserId);
  const activeGroup = activeGroupId
    ? groups.find((g) => g.id === activeGroupId) ?? null
    : null;
  const activeGroupMemberIds = activeGroup
    ? members.filter((m) => m.group_id === activeGroup.id).map((m) => m.profile_id)
    : [];
  const visibleTasks = useMemo(
    () =>
      activeGroup
        ? tasks.filter((t) => t.group_id === activeGroup.id)
        : tasks,
    [tasks, activeGroup]
  );
  const groupCounts = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => map.set(t.group_id, (map.get(t.group_id) ?? 0) + 1));
    return map;
  }, [tasks]);

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-ink-faint">
        Preparando tu perfil…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        groups={groups}
        groupCounts={groupCounts}
        totalTasks={tasks.length}
        activeGroupId={activeGroupId}
        onSelectGroup={setActiveGroupId}
        onNewGroup={() => setModal({ type: "newGroup" })}
        onOpenUsers={() => setModal({ type: "users" })}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-7 py-4 border-b border-line bg-surface">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">
              {activeGroup ? activeGroup.name : "Todas las actividades"}
            </h2>
            <p className="text-xs text-ink-faint mt-0.5">
              {activeGroup
                ? `${activeGroupMemberIds.length} integrantes`
                : "Vista de todo el equipo"}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-surface-soft border border-line rounded-full pl-1 pr-3 py-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold font-display"
                style={{ background: colorFor(me.avatar_color) }}
              >
                {initials(me.full_name)}
              </div>
              <span className="text-sm font-medium">{me.full_name}</span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-[11px] text-ink-faint underline ml-1"
                >
                  salir
                </button>
              </form>
            </div>
            <button
              onClick={() =>
                setModal({ type: "newTask", groupId: activeGroup?.id })
              }
              className="bg-ink text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-black transition-colors"
            >
              + Nueva actividad
            </button>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5 text-center">
            <h3 className="font-display text-base font-bold">
              Crea tu primer grupo
            </h3>
            <p className="text-sm text-ink-faint max-w-xs">
              Los grupos reúnen a las personas que colaboran juntas. Crea uno
              para empezar a asignar actividades.
            </p>
            <button
              onClick={() => setModal({ type: "newGroup" })}
              className="bg-ink text-white rounded-lg px-4 py-2 text-sm font-semibold mt-1"
            >
              + Nuevo grupo
            </button>
          </div>
        ) : (
          <Board
            statuses={STATUSES}
            tasks={visibleTasks}
            profiles={profiles}
            onOpenTask={(task) => setModal({ type: "taskDetail", task })}
            showToast={showToast}
          />
        )}
      </div>

      {modal?.type === "newGroup" && (
        <NewGroupModal
          profiles={profiles}
          onClose={() => setModal(null)}
          onCreated={(id) => {
            setActiveGroupId(id);
            showToast("Grupo creado");
          }}
        />
      )}
      {modal?.type === "newTask" && (
        <NewTaskModal
          groups={groups}
          members={members}
          profiles={profiles}
          defaultGroupId={modal.groupId}
          onClose={() => setModal(null)}
          onCreated={() => showToast("Actividad creada")}
        />
      )}
      {modal?.type === "taskDetail" && (
        <TaskDetailModal
          task={modal.task}
          group={groups.find((g) => g.id === modal.task.group_id) ?? null}
          members={members}
          profiles={profiles}
          onClose={() => setModal(null)}
          onSaved={() => showToast("Cambios guardados")}
          onDeleted={() => showToast("Actividad eliminada")}
        />
      )}
      {modal?.type === "users" && (
        <UsersPanel
          profiles={profiles}
          currentUserId={currentUserId}
          onClose={() => setModal(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
