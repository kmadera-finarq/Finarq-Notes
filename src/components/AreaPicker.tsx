"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Area } from "@/lib/types";
import { chooseAreas, signOut } from "@/app/actions";

export default function AreaPicker({ areas }: { areas: Area[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleConfirm() {
    if (selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await chooseAreas(selected);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo guardar tu área"
      );
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-5">
      <div className="w-full max-w-sm bg-surface border border-line rounded-2xl p-7">
        <div className="w-11 h-11 rounded-xl bg-ink text-white flex items-center justify-center font-display font-bold text-lg mb-4">
          F
        </div>
        <h1 className="font-display text-xl font-bold mb-1">
          ¿A qué área perteneces?
        </h1>
        <p className="text-sm text-ink-faint mb-6">
          Puedes marcar una o varias. Esta elección es única — si más
          adelante necesitas otra área, pídele al administrador que te la
          agregue.
        </p>
        <div className="flex flex-col gap-2 mb-6">
          {areas.map((a) => (
            <label
              key={a.id}
              className={`flex items-center gap-3 text-left px-4 py-3 rounded-lg border text-sm font-semibold cursor-pointer transition-colors ${
                selected.includes(a.id)
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-ink-soft hover:bg-surface-soft"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(a.id)}
                onChange={() => toggle(a.id)}
              />
              {a.name}
            </label>
          ))}
        </div>
        {error && (
          <p className="text-xs text-danger mb-3 font-medium">{error}</p>
        )}
        <button
          onClick={handleConfirm}
          disabled={selected.length === 0 || saving}
          className="w-full bg-ink text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          {saving ? "Guardando…" : "Confirmar"}
        </button>
        <form action={signOut} className="mt-3 text-center">
          <button
            type="submit"
            className="text-[11.5px] text-ink-faint underline"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}