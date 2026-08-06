"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signOut, switchArea } from "@/app/actions";
import type { Profile, Group, GroupMember, Task, Area } from "@/lib/types";
import { STATUSES, colorFor, initials } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import Board from "@/components/Board";
import AdminPanel from "@/components/AdminPanel";
import {
  NewGroupModal,
  EditGroupModal,
  NewTaskModal,
  TaskDetailModal,
  UsersPanel,
} from "@/components/Modals";

type ModalState =
  | { type: "newGroup" }
  | { type: "editGroup"; group: Group }
  | { type: "newTask"; groupId?: string }
  | { type: "taskDetail"; task: Task }
  | { type: "users" }
  | { type: "admin" }
  | null;

export default function Workspace({
  currentUserId,
  isAdmin,
  areaName,
  myAreas,
  activeAreaId,
  initialProfiles,
  initialGroups,
  initialMembers,
  initialTasks,
}: {
  currentUserId: string;
  isAdmin: boolean;
  areaName: string;
  myAreas: Area[];
  activeAreaId: string;
  initialProfiles: Profile[];
  initialGroups: Group[];
  initialMembers: GroupMember[];
  initialTasks: Task[];
}) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [groups, setGroups] = useState(initialGroups);
  const [members, setMembers] = useState(initialMembers);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dueSort, setDueSort] = useState<"asc" | "desc" | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    setSwitching(false);
  }, [activeAreaId]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  async function handleSwitchArea(areaId: string) {
    if (areaId === activeAreaId) return;
    setSwitching(true);
    try {
      await switchArea(areaId);
      router.refresh();
    } catch {
      showToast("No se pudo cambiar de área");
      setSwitching(false);
    }
  }

  // ---------- Sincronización en tiempo real (para cambios de otras personas) ----------
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("workspace-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          setTasks((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Task;
              if (prev.some((t) => t.id === row.id)) return prev;
              return [...prev, row];
            }
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
            if (payload.eventType === "INSERT") {
              const row = payload.new as Group;
              if (row.area_id !== activeAreaId) return prev;
              if (prev.some((g) => g.id === row.id)) return prev;
              return [...prev, row];
            }
            if (payload.eventType === "UPDATE")
              return prev.map((g) =>
                g.id === (payload.new as Group).id ? (payload.new as Group) : g
              );
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
            if (payload.eventType === "INSERT") {
              const row = payload.new as GroupMember;
              if (
                prev.some(
                  (m) =>
                    m.group_id === row.group_id && m.profile_id === row.profile_id
                )
              )
                return prev;
              return [...prev, row];
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as Partial<GroupMember>;
              return prev.filter(
                (m) =>
                  !(
                    m.group_id === old.group_id &&
                    m.profile_id === old.profile_id
                  )
              );
            }
            return prev;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          setProfiles((prev) => {
            if (payload.eventType === "UPDATE")
              return prev.map((p) =>
                p.id === (payload.new as Profile).id
                  ? (payload.new as Profile)
                  : p
              );
            if (payload.eventType === "DELETE")
              return prev.filter((p) => p.id !== (payload.old as Profile).id);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeAreaId]);

  // ---------- Actualizaciones optimistas (reflejan tus propios cambios al instante) ----------
  function upsertTask(task: Task) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [...prev, task];
    });
  }
  function removeTaskLocal(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }
  function upsertGroupWithMembers(group: Group, memberIds: string[]) {
    setGroups((prev) => {
      const exists = prev.some((g) => g.id === group.id);
      return exists ? prev.map((g) => (g.id === group.id ? group : g)) : [...prev, group];
    });
    setMembers((prev) => {
      const others = prev.filter((m) => m.group_id !== group.id);
      return [...others, ...memberIds.map((profile_id) => ({ group_id: group.id, profile_id }))];
    });
  }
  function removeGroupLocal(groupId: string) {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setMembers((prev) => prev.filter((m) => m.group_id !== groupId));
    setTasks((prev) => prev.filter((t) => t.group_id !== groupId));
  }
  function removeProfileLocal(profileId: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    setMembers((prev) => prev.filter((m) => m.profile_id !== profileId));
  }

  const me = profiles.find((p) => p.id === currentUserId);
  const activeGroup = activeGroupId
    ? groups.find((g) => g.id === activeGroupId) ?? null
    : null;
  const activeGroupMemberIds = activeGroup
    ? members.filter((m) => m.group_id === activeGroup.id).map((m) => m.profile_id)
    : [];
  const visibleTasks = useMemo(() => {
    const base = activeGroup
      ? tasks.filter((t) => t.group_id === activeGroup.id)
      : tasks;
    if (!dueSort) return base;
    const withDate = base.filter((t) => t.due_date);
    const withoutDate = base.filter((t) => !t.due_date);
    withDate.sort((a, b) => {
      const cmp = (a.due_date as string).localeCompare(b.due_date as string);
      return dueSort === "asc" ? cmp : -cmp;
    });
    return [...withDate, ...withoutDate];
  }, [tasks, activeGroup, dueSort]);
  const groupCounts = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => map.set(t.group_id, (map.get(t.group_id) ?? 0) + 1));
    return map;
  }, [tasks]);

  if (!me || switching) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-ink-faint">
        {switching ? "Cambiando de área…" : "Preparando tu perfil…"}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        areaName={areaName}
        myAreas={myAreas}
        activeAreaId={activeAreaId}
        onSwitchArea={handleSwitchArea}
        isAdmin={isAdmin}
        onOpenAdmin={() => setModal({ type: "admin" })}
        groups={groups}
        groupCounts={groupCounts}
        totalTasks={tasks.length}
        activeGroupId={activeGroupId}
        onSelectGroup={setActiveGroupId}
        onNewGroup={() => setModal({ type: "newGroup" })}
        onEditGroup={(group) => setModal({ type: "editGroup", group })}
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
            <button
              onClick={() =>
                setDueSort((prev) =>
                  prev === null ? "asc" : prev === "asc" ? "desc" : null
                )
              }
              className={`flex items-center gap-1.5 border rounded-lg px-3 py-2 text-[12.5px] font-semibold ${
                dueSort
                  ? "border-accent text-accent bg-accent-soft"
                  : "border-line text-ink-soft hover:bg-surface-soft"
              }`}
              title="Ordenar por fecha límite"
            >
              Fecha límite
              {dueSort === "asc" && <span>↑</span>}
              {dueSort === "desc" && <span>↓</span>}
              {!dueSort && <span className="opacity-50">↕</span>}
            </button>
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
            onStatusChange={(taskId, status) => {
              setTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, status } : t))
              );
            }}
            showToast={showToast}
          />
        )}
      </div>

      {modal?.type === "newGroup" && (
        <NewGroupModal
          profiles={profiles}
          areaId={activeAreaId}
          onClose={() => setModal(null)}
          onCreated={(group, memberIds) => {
            upsertGroupWithMembers(group, memberIds);
            setActiveGroupId(group.id);
            showToast("Grupo creado");
          }}
        />
      )}
      {modal?.type === "editGroup" && (
        <EditGroupModal
          group={modal.group}
          members={members}
          profiles={profiles}
          onClose={() => setModal(null)}
          onSaved={(group, memberIds) => {
            upsertGroupWithMembers(group, memberIds);
            showToast("Grupo actualizado");
          }}
          onDeleted={(groupId) => {
            removeGroupLocal(groupId);
            if (activeGroupId === groupId) setActiveGroupId(null);
            showToast("Grupo eliminado");
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
          onCreated={(task) => {
            upsertTask(task);
            showToast("Actividad creada");
          }}
        />
      )}
      {modal?.type === "taskDetail" && (
        <TaskDetailModal
          task={modal.task}
          group={groups.find((g) => g.id === modal.task.group_id) ?? null}
          members={members}
          profiles={profiles}
          onClose={() => setModal(null)}
          onSaved={(task) => {
            upsertTask(task);
            showToast("Cambios guardados");
          }}
          onDeleted={(taskId) => {
            removeTaskLocal(taskId);
            showToast("Actividad eliminada");
          }}
        />
      )}
      {modal?.type === "users" && (
        <UsersPanel
          profiles={profiles}
          currentUserId={currentUserId}
          onClose={() => setModal(null)}
          onDeleted={(profileId, name) => {
            removeProfileLocal(profileId);
            showToast(`${name} fue eliminado del equipo`);
          }}
        />
      )}
      {modal?.type === "admin" && (
        <AdminPanel onClose={() => setModal(null)} />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}