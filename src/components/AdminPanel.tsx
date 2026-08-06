"use client";

import { useEffect, useState } from "react";
import type { Area, Profile, UserArea } from "@/lib/types";
import { colorFor, initials } from "@/lib/types";
import { getAdminData, addUserToArea, removeUserFromArea } from "@/app/actions";

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [userAreas, setUserAreas] = useState<UserArea[]>([]);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAdminData();
        setProfiles(data.profiles);
        setAreas(data.areas);
        setUserAreas(data.userAreas);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function hasArea(profileId: string, areaId: string) {
    return userAreas.some(
      (ua) => ua.profile_id === profileId && ua.area_id === areaId
    );
  }

  async function toggle(profileId: string, areaId: string) {
    const key = `${profileId}:${areaId}`;
    setPending(key);
    try {
      if (hasArea(profileId, areaId)) {
        await removeUserFromArea(profileId, areaId);
        setUserAreas((prev) =>
          prev.filter((ua) => !(ua.profile_id === profileId && ua.area_id === areaId))
        );
      } else {
        await addUserToArea(profileId, areaId);
        setUserAreas((prev) => [...prev, { profile_id: profileId, area_id: areaId }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el cambio");
    } finally {
      setPending(null);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-[#171923]/45 flex items-center justify-center p-5 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl p-6 pb-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <h3 className="font-display text-base font-bold mb-1">
          Panel de administrador
        </h3>
        <p className="text-xs text-ink-faint mb-4">
          Marca o desmarca las áreas a las que pertenece cada persona.
        </p>

        {loading && <p className="text-sm text-ink-faint">Cargando…</p>}
        {error && <p className="text-sm text-danger font-medium mb-3">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="text-xs font-semibold text-ink-soft pb-2 pr-3">
                    Persona
                  </th>
                  {areas.map((a) => (
                    <th
                      key={a.id}
                      className="text-xs font-semibold text-ink-soft pb-2 px-2 text-center"
                    >
                      {a.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold font-display flex-shrink-0"
                          style={{ background: colorFor(p.avatar_color) }}
                        >
                          {initials(p.full_name)}
                        </div>
                        <span className="text-[13px] font-medium whitespace-nowrap">
                          {p.full_name}
                        </span>
                      </div>
                    </td>
                    {areas.map((a) => {
                      const key = `${p.id}:${a.id}`;
                      return (
                        <td key={a.id} className="text-center px-2">
                          <input
                            type="checkbox"
                            checked={hasArea(p.id, a.id)}
                            disabled={pending === key}
                            onChange={() => toggle(p.id, a.id)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-5">
          <button
            onClick={onClose}
            className="border border-line rounded-lg px-3.5 py-2 text-[13px] font-semibold text-ink-soft hover:bg-surface-soft"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}