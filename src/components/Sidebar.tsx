"use client";

import type { Group } from "@/lib/types";
import { colorFor } from "@/lib/types";

export default function Sidebar({
  groups,
  groupCounts,
  totalTasks,
  activeGroupId,
  onSelectGroup,
  onNewGroup,
  onEditGroup,
  onOpenUsers,
}: {
  groups: Group[];
  groupCounts: Map<string, number>;
  totalTasks: number;
  activeGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
  onNewGroup: () => void;
  onEditGroup: (group: Group) => void;
  onOpenUsers: () => void;
}) {
  return (
    <div className="w-[250px] flex-shrink-0 bg-surface border-r border-line flex flex-col gap-4.5 p-3.5 sticky top-0 h-screen">
      <div className="flex items-center gap-2.5 px-1">
        <div className="w-[26px] h-[26px] rounded-lg bg-ink text-white flex items-center justify-center font-display font-bold text-[13px] flex-shrink-0">
          F
        </div>
        <h1 className="font-display text-base font-bold tracking-tight">
          Finarq Notes
        </h1>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-wide text-ink-faint font-semibold px-1 mt-1">
          Grupos
        </div>
        <ul className="flex flex-col gap-0.5 mt-1.5">
          <li
            onClick={() => onSelectGroup(null)}
            className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-[13.5px] font-medium ${
              activeGroupId === null
                ? "bg-accent-soft text-accent"
                : "text-ink-soft hover:bg-surface-soft"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: "var(--ink-faint)" }}
            />
            <span className="flex-1 truncate">Todas las actividades</span>
            <span className="font-mono text-[11px] opacity-70">
              {totalTasks}
            </span>
          </li>
          {groups.map((g, i) => (
            <li
              key={g.id}
              onClick={() => onSelectGroup(g.id)}
              className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-[13.5px] font-medium ${
                activeGroupId === g.id
                  ? "bg-accent-soft text-accent"
                  : "text-ink-soft hover:bg-surface-soft"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: colorFor(i) }}
              />
              <span className="flex-1 truncate">{g.name}</span>
              <span className="font-mono text-[11px] opacity-70 group-hover:hidden">
                {groupCounts.get(g.id) ?? 0}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditGroup(g);
                }}
                className="hidden group-hover:flex items-center justify-center w-5 h-5 rounded hover:bg-white/60 text-ink-faint hover:text-ink flex-shrink-0"
                title="Editar grupo"
              >
                ✎
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onNewGroup}
        className="flex items-center gap-1.5 border border-dashed border-line text-ink-soft text-[13px] font-medium px-2.5 py-2 rounded-lg hover:border-ink-faint hover:text-ink text-left"
      >
        <span className="text-[15px]">+</span> Nuevo grupo
      </button>

      <button
        onClick={onOpenUsers}
        className="mt-auto flex items-center gap-1.5 border border-dashed border-line text-ink-soft text-[13px] font-medium px-2.5 py-2 rounded-lg hover:border-ink-faint hover:text-ink text-left"
      >
        <span className="text-[15px]">＋</span> Usuarios del equipo
      </button>
    </div>
  );
}
