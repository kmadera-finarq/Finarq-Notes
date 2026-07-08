"use client";

import { useState, type ReactNode } from "react";
import type { Profile, Group, GroupMember, Task, Priority, Status } from "@/lib/types";
import { PRIORITIES, STATUSES, colorFor, initials } from "@/lib/types";
import { createGroup, updateGroup, deleteGroup, createTask, updateTask, deleteTask, deleteUserProfile } from "@/app/actions";

function ModalShell({
  children,
  onClose,
  wide,
}: {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-[#171923]/45 flex items-center justify-center p-5 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-surface rounded-2xl p-6 pb-5 w-full ${
          wide ? "max-w-[480px]" : "max-w-[420px]"
        } max-h-[88vh] overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
}

function PillRow<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <div
          key={opt}
          onClick={() => onChange(opt)}
          className={`border rounded-full px-3.5 py-1.5 text-[12.5px] font-medium cursor-pointer ${
            value === opt
              ? "bg-ink text-white border-ink"
              : "bg-surface-soft text-ink-soft border-line"
          }`}
        >
          {labels?.[opt] ?? opt}
        </div>
      ))}
    </div>
  );
}

const inputClass =
  "w-full border border-line rounded-lg px-2.5 py-2 text-[13.5px] bg-surface-soft text-ink focus:outline-none focus:ring-2 focus:ring-accent-soft focus:border-accent";
const labelClass = "block text-xs font-semibold text-ink-soft mb-1.5";

export function NewGroupModal({
  profiles,
  onClose,
  onCreated,
}: {
  profiles: Profile[];
  onClose: () => void;
  onCreated: (group: Group, memberIds: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>(profiles.map((p) => p.id));
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { group, memberIds } = await createGroup(name.trim(), selected);
      onCreated(group, memberIds);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose} wide>
      <h3 className="font-display text-base font-bold mb-1">Nuevo grupo</h3>
      <p className="text-xs text-ink-faint mb-4">
        Reúne a las personas que colaborarán juntas.
      </p>
      <div className="mb-3.5">
        <label className={labelClass}>Nombre del grupo</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Marketing, Producto, Diseño"
          autoFocus
        />
      </div>
      <div className="mb-1">
        <label className={labelClass}>Integrantes</label>
        <div className="flex flex-col gap-0.5">
          {profiles.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[13px] font-medium hover:bg-surface-soft cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={(e) =>
                  setSelected((prev) =>
                    e.target.checked
                      ? [...prev, p.id]
                      : prev.filter((id) => id !== p.id)
                  )
                }
              />
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[9.5px] font-semibold font-display"
                style={{ background: colorFor(p.avatar_color) }}
              >
                {initials(p.full_name)}
              </div>
              <span>{p.full_name}</span>
            </label>
          ))}
          {profiles.length === 0 && (
            <p className="text-xs text-ink-faint px-2">
              Nadie más ha iniciado sesión todavía. El grupo se creará solo
              contigo por ahora.
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          className="border border-line rounded-lg px-3.5 py-2 text-[13px] font-semibold text-ink-soft hover:bg-surface-soft"
        >
          Cancelar
        </button>
        <button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="bg-ink text-white rounded-lg px-3.5 py-2 text-[13px] font-semibold disabled:opacity-50"
        >
          {saving ? "Creando…" : "Crear grupo"}
        </button>
      </div>
    </ModalShell>
  );
}

export function EditGroupModal({
  group,
  members,
  profiles,
  onClose,
  onSaved,
  onDeleted,
}: {
  group: Group;
  members: GroupMember[];
  profiles: Profile[];
  onClose: () => void;
  onSaved: (group: Group, memberIds: string[]) => void;
  onDeleted: (groupId: string) => void;
}) {
  const [name, setName] = useState(group.name);
  const [selected, setSelected] = useState<string[]>(
    members.filter((m) => m.group_id === group.id).map((m) => m.profile_id)
  );
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { group: updated, memberIds } = await updateGroup(
        group.id,
        name.trim(),
        selected
      );
      onSaved(updated, memberIds);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteGroup(group.id);
      onDeleted(group.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose} wide>
      <h3 className="font-display text-base font-bold mb-1">Editar grupo</h3>
      <p className="text-xs text-ink-faint mb-4">
        Cambia el nombre o los integrantes del grupo.
      </p>
      <div className="mb-3.5">
        <label className={labelClass}>Nombre del grupo</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="mb-1">
        <label className={labelClass}>Integrantes</label>
        <div className="flex flex-col gap-0.5">
          {profiles.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[13px] font-medium hover:bg-surface-soft cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={(e) =>
                  setSelected((prev) =>
                    e.target.checked
                      ? [...prev, p.id]
                      : prev.filter((id) => id !== p.id)
                  )
                }
              />
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[9.5px] font-semibold font-display"
                style={{ background: colorFor(p.avatar_color) }}
              >
                {initials(p.full_name)}
              </div>
              <span>{p.full_name}</span>
            </label>
          ))}
        </div>
      </div>

      {confirmingDelete ? (
        <div className="border border-danger-soft bg-danger-soft rounded-lg p-3 mt-4">
          <p className="text-[12.5px] text-[#8C2E29] font-medium mb-2.5">
            ¿Eliminar este grupo? También se eliminarán todas sus actividades.
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmingDelete(false)}
              className="border border-line bg-surface rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-ink-soft"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="bg-danger text-white rounded-lg px-3 py-1.5 text-[12.5px] font-semibold disabled:opacity-50"
            >
              {saving ? "Eliminando…" : "Sí, eliminar grupo"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setConfirmingDelete(true)}
            className="border border-danger-soft text-danger rounded-lg px-3.5 py-2 text-[13px] font-semibold hover:bg-danger-soft"
          >
            Eliminar grupo
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="border border-line rounded-lg px-3.5 py-2 text-[13px] font-semibold text-ink-soft hover:bg-surface-soft"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="bg-ink text-white rounded-lg px-3.5 py-2 text-[13px] font-semibold disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

export function NewTaskModal({
  groups,
  members,
  profiles,
  defaultGroupId,
  onClose,
  onCreated,
}: {
  groups: Group[];
  members: GroupMember[];
  profiles: Profile[];
  defaultGroupId?: string;
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const [groupId, setGroupId] = useState(defaultGroupId ?? groups[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);

  const groupMembers = members
    .filter((m) => m.group_id === groupId)
    .map((m) => profiles.find((p) => p.id === m.profile_id))
    .filter((p): p is Profile => !!p);

  async function handleCreate() {
    if (!title.trim() || !groupId) return;
    setSaving(true);
    try {
      const task = await createTask({
        groupId,
        title: title.trim(),
        description: desc.trim(),
        assigneeId: assigneeId || null,
        priority,
        dueDate: due || null,
      });
      onCreated(task);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose} wide>
      <h3 className="font-display text-base font-bold mb-1">Nueva actividad</h3>
      <p className="text-xs text-ink-faint mb-4">
        Asigna una tarea a alguien del grupo.
      </p>
      <div className="mb-3.5">
        <label className={labelClass}>Grupo</label>
        <select
          className={inputClass}
          value={groupId}
          onChange={(e) => {
            setGroupId(e.target.value);
            setAssigneeId("");
          }}
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3.5">
        <label className={labelClass}>Título</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Preparar reporte semanal"
          maxLength={80}
          autoFocus
        />
      </div>
      <div className="mb-3.5">
        <label className={labelClass}>Descripción (opcional)</label>
        <textarea
          className={inputClass + " min-h-[64px] resize-y"}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Detalles de la actividad"
        />
      </div>
      <div className="mb-3.5">
        <label className={labelClass}>Asignar a</label>
        <select
          className={inputClass}
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          <option value="">Sin asignar</option>
          {groupMembers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <div className="flex-1 mb-3.5">
          <label className={labelClass}>Prioridad</label>
          <PillRow options={PRIORITIES} value={priority} onChange={setPriority} />
        </div>
        <div className="flex-1 mb-3.5">
          <label className={labelClass}>Fecha límite</label>
          <input
            type="date"
            className={inputClass}
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onClose}
          className="border border-line rounded-lg px-3.5 py-2 text-[13px] font-semibold text-ink-soft hover:bg-surface-soft"
        >
          Cancelar
        </button>
        <button
          onClick={handleCreate}
          disabled={saving || !title.trim() || !groupId}
          className="bg-ink text-white rounded-lg px-3.5 py-2 text-[13px] font-semibold disabled:opacity-50"
        >
          {saving ? "Creando…" : "Crear actividad"}
        </button>
      </div>
    </ModalShell>
  );
}

export function TaskDetailModal({
  task,
  group,
  members,
  profiles,
  onClose,
  onSaved,
  onDeleted,
}: {
  task: Task;
  group: Group | null;
  members: GroupMember[];
  profiles: Profile[];
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted: (taskId: string) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description);
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [status, setStatus] = useState<Status>(task.status);
  const [due, setDue] = useState(task.due_date ?? "");
  const [leaderNotes, setLeaderNotes] = useState(task.leader_notes ?? "");
  const [leaderNotesDone, setLeaderNotesDone] = useState(
    task.leader_notes_done ?? false
  );
  const [teamNotes, setTeamNotes] = useState(task.team_notes ?? "");
  const [teamNotesDone, setTeamNotesDone] = useState(
    task.team_notes_done ?? false
  );
  const [saving, setSaving] = useState(false);

  const groupMembers = members
    .filter((m) => m.group_id === task.group_id)
    .map((m) => profiles.find((p) => p.id === m.profile_id))
    .filter((p): p is Profile => !!p);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const updated = await updateTask(task.id, {
        title: title.trim(),
        description: desc.trim(),
        assignee_id: assigneeId || null,
        priority,
        status,
        due_date: due || null,
        leader_notes: leaderNotes,
        leader_notes_done: leaderNotesDone,
        team_notes: teamNotes,
        team_notes_done: teamNotesDone,
      });
      onSaved(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteTask(task.id);
      onDeleted(task.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose} wide>
      <h3 className="font-mono text-[13px] text-ink-faint font-semibold mb-3">
        {task.ticket}
      </h3>
      <div className="mb-3.5">
        <label className={labelClass}>Título</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="mb-3.5">
        <label className={labelClass}>Descripción</label>
        <textarea
          className={inputClass + " min-h-[64px] resize-y"}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>
      <div className="mb-3.5">
        <label className={labelClass}>Grupo</label>
        <div className="text-[13.5px] text-ink-soft">{group?.name ?? "—"}</div>
      </div>
      <div className="mb-3.5">
        <label className={labelClass}>Asignar a</label>
        <select
          className={inputClass}
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          <option value="">Sin asignar</option>
          {groupMembers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <div className="flex-1 mb-3.5">
          <label className={labelClass}>Prioridad</label>
          <PillRow options={PRIORITIES} value={priority} onChange={setPriority} />
        </div>
        <div className="flex-1 mb-3.5">
          <label className={labelClass}>Fecha límite</label>
          <input
            type="date"
            className={inputClass}
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </div>
      </div>
      <div className="mb-1">
        <label className={labelClass}>Estado</label>
        <PillRow
          options={STATUSES.map((s) => s.id)}
          value={status}
          onChange={setStatus}
          labels={Object.fromEntries(STATUSES.map((s) => [s.id, s.label]))}
        />
      </div>

      <div className="border-t border-line mt-4 pt-4 flex flex-col gap-3.5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelClass + " mb-0"}>Notas Líder</label>
            <label className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={leaderNotesDone}
                onChange={(e) => setLeaderNotesDone(e.target.checked)}
              />
              Resuelto
            </label>
          </div>
          <textarea
            className={
              inputClass +
              ` min-h-[56px] resize-y ${leaderNotesDone ? "line-through opacity-60" : ""}`
            }
            value={leaderNotes}
            onChange={(e) => setLeaderNotes(e.target.value)}
            placeholder="Notas o instrucciones del líder del grupo"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelClass + " mb-0"}>Notas Equipo</label>
            <label className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={teamNotesDone}
                onChange={(e) => setTeamNotesDone(e.target.checked)}
              />
              Resuelto
            </label>
          </div>
          <textarea
            className={
              inputClass +
              ` min-h-[56px] resize-y ${teamNotesDone ? "line-through opacity-60" : ""}`
            }
            value={teamNotes}
            onChange={(e) => setTeamNotes(e.target.value)}
            placeholder="Comentarios o avances del equipo"
          />
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handleDelete}
          disabled={saving}
          className="border border-danger-soft text-danger rounded-lg px-3.5 py-2 text-[13px] font-semibold hover:bg-danger-soft disabled:opacity-50"
        >
          Eliminar
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="border border-line rounded-lg px-3.5 py-2 text-[13px] font-semibold text-ink-soft hover:bg-surface-soft"
          >
            Cerrar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="bg-ink text-white rounded-lg px-3.5 py-2 text-[13px] font-semibold disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function UsersPanel({
  profiles,
  currentUserId,
  onClose,
  onDeleted,
}: {
  profiles: Profile[];
  currentUserId: string;
  onClose: () => void;
  onDeleted: (profileId: string, name: string) => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleDelete(p: Profile) {
    setSaving(true);
    try {
      await deleteUserProfile(p.id);
      onDeleted(p.id, p.full_name);
      setConfirmingId(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <h3 className="font-display text-base font-bold mb-1">
        Usuarios del equipo
      </h3>
      <p className="text-xs text-ink-faint mb-4">
        Todas las personas que han iniciado sesión con Google en este espacio.
      </p>
      <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto">
        {profiles.map((p) => (
          <div key={p.id} className="border border-line rounded-lg">
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <div
                className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-white text-[11px] font-semibold font-display"
                style={{ background: colorFor(p.avatar_color) }}
              >
                {initials(p.full_name)}
              </div>
              <span className="text-[13.5px] font-medium">{p.full_name}</span>
              {p.id === currentUserId && (
                <span className="ml-auto font-mono text-[10.5px] text-accent">
                  tú
                </span>
              )}
              {p.id !== currentUserId && confirmingId !== p.id && (
                <button
                  onClick={() => setConfirmingId(p.id)}
                  className="ml-auto text-[11.5px] text-danger font-semibold hover:underline"
                >
                  Eliminar
                </button>
              )}
            </div>
            {confirmingId === p.id && (
              <div className="border-t border-line bg-danger-soft rounded-b-lg p-2.5">
                <p className="text-[12px] text-[#8C2E29] font-medium mb-2">
                  ¿Quitar a {p.full_name} del equipo? Perderá su lugar en los
                  grupos. Si vuelve a iniciar sesión, se creará un perfil
                  nuevo.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmingId(null)}
                    className="border border-line bg-surface rounded-lg px-2.5 py-1 text-[11.5px] font-semibold text-ink-soft"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={saving}
                    className="bg-danger text-white rounded-lg px-2.5 py-1 text-[11.5px] font-semibold disabled:opacity-50"
                  >
                    {saving ? "Eliminando…" : "Sí, eliminar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-faint mt-4">
        Para invitar a alguien más, comparte el enlace de la app: solo
        necesita iniciar sesión con su cuenta de Google.
      </p>
      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
          className="border border-line rounded-lg px-3.5 py-2 text-[13px] font-semibold text-ink-soft hover:bg-surface-soft"
        >
          Cerrar
        </button>
      </div>
    </ModalShell>
  );
}