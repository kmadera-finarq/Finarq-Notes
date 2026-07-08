"use client";

import { useState } from "react";
import type { Task, Profile, Status } from "@/lib/types";
import { colorFor, initials } from "@/lib/types";
import { updateTask } from "@/app/actions";

function fmtDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}
function isOverdue(d: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(d + "T00:00:00") < today;
}

const FLAG_CLASSES: Record<string, string> = {
  alta: "bg-danger-soft text-[#8C2E29]",
  media: "bg-flag-soft text-[#8C5E0A]",
  baja: "bg-success-soft text-[#1F6E3F]",
};

function TaskCard({
  task,
  assignee,
  onOpen,
}: {
  task: Task;
  assignee: Profile | undefined;
  onOpen: () => void;
}) {
  const overdue = task.status !== "done" && task.due_date && isOverdue(task.due_date);
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
      onClick={onOpen}
      className="bg-surface border border-line rounded-r-[10px] rounded-l-none p-3 pb-3 flex flex-col gap-1.5 cursor-grab hover:border-ink-faint"
      style={{
        borderLeft: `4px solid ${
          assignee ? colorFor(assignee.avatar_color) : "var(--ink-faint)"
        }`,
      }}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[10.5px] text-ink-faint">
          {task.ticket}
        </span>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${FLAG_CLASSES[task.priority]}`}
        >
          {task.priority}
        </span>
      </div>
      <div className="text-[13.5px] font-semibold leading-snug">
        {task.title}
      </div>
      {task.description && (
        <div className="text-xs text-ink-soft leading-snug line-clamp-2">
          {task.description}
        </div>
      )}
      <div className="flex items-center justify-between mt-0.5">
        <span
          className={`font-mono text-[10.5px] ${overdue ? "text-danger" : "text-ink-faint"}`}
        >
          {task.due_date ? fmtDate(task.due_date) : ""}
        </span>
        {assignee && (
          <div
            title={assignee.full_name}
            className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[9.5px] font-semibold font-display"
            style={{ background: colorFor(assignee.avatar_color) }}
          >
            {initials(assignee.full_name)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Board({
  statuses,
  tasks,
  profiles,
  onOpenTask,
  onStatusChange,
  showToast,
}: {
  statuses: { id: Status; label: string; dot: string }[];
  tasks: Task[];
  profiles: Profile[];
  onOpenTask: (t: Task) => void;
  onStatusChange: (taskId: string, status: Status) => void;
  showToast: (msg: string) => void;
}) {
  const [dragOver, setDragOver] = useState<Status | null>(null);

  async function handleDrop(status: Status, e: React.DragEvent) {
    e.preventDefault();
    setDragOver(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    onStatusChange(taskId, status);
    try {
      await updateTask(taskId, { status });
    } catch {
      showToast("No se pudo mover la actividad");
    }
  }

  return (
    <div className="flex-1 overflow-x-auto px-7 py-5">
      <div className="grid grid-cols-3 gap-4.5 min-w-[820px]">
        {statuses.map((st) => {
          const inCol = tasks.filter((t) => t.status === st.id);
          return (
            <div key={st.id} className="flex flex-col gap-2.5 min-h-[120px]">
              <div className="flex items-center gap-2 px-1 pb-1">
                <span
                  className="w-[9px] h-[9px] rounded-full"
                  style={{ background: st.dot }}
                />
                <h3 className="text-[13px] font-semibold text-ink-soft uppercase tracking-wide">
                  {st.label}
                </h3>
                <span className="ml-auto font-mono text-[11.5px] text-ink-faint">
                  {inCol.length}
                </span>
              </div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(st.id);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(st.id, e)}
                className={`flex flex-col gap-2.5 min-h-[60px] rounded-xl p-0.5 ${
                  dragOver === st.id ? "bg-accent-soft" : ""
                }`}
              >
                {inCol.length === 0 && (
                  <div className="border border-dashed border-line rounded-lg py-6 px-2.5 text-center text-ink-faint text-xs">
                    Sin actividades
                  </div>
                )}
                {inCol.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    assignee={profiles.find((p) => p.id === t.assignee_id)}
                    onOpen={() => onOpenTask(t)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
