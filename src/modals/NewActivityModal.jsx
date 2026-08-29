import React, { useState, useMemo } from "react";
import { Plus, Library, History } from "lucide-react";
import { ATTR_MAP, SEED_ACTIVITIES } from "../constants";
import ModalShell from "../components/ModalShell";
import CreateActivityForm from "./CreateActivityForm";

const LIBRARY_RESULTS_LIMIT = 8;

export default function NewActivityModal({
  activities,
  sessions,
  onClose,
  onPickExisting,
  onCreateNew,
  createMode,
  createPrefill,
  onSubmitCreate,
  onBackFromCreate,
  onPickFromLibrary,
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const existingNames = useMemo(
    () => new Set(activities.map((a) => a.name.toLowerCase())),
    [activities]
  );

  const libraryMatches = useMemo(() => {
    if (!q) return [];
    return SEED_ACTIVITIES.filter(
      (s) => s.name.toLowerCase().includes(q) && !existingNames.has(s.name.toLowerCase())
    ).slice(0, LIBRARY_RESULTS_LIMIT);
  }, [q, existingNames]);

  const recentActivities = useMemo(() => {
    const recentMap = new Map();
    for (const session of sessions) {
      const activity = activities.find((a) => a.id === session.activityId);
      if (activity && !recentMap.has(activity.id)) {
        recentMap.set(activity.id, { activity, lastSession: session.date });
      }
    }
    return Array.from(recentMap.values())
      .sort((a, b) => new Date(b.lastSession) - new Date(a.lastSession))
      .map((r) => r.activity);
  }, [activities, sessions]);

  const filteredRecents = useMemo(() => {
    if (!q) return recentActivities;
    return recentActivities.filter((a) => a.name.toLowerCase().includes(q));
  }, [recentActivities, q]);

  if (createMode) {
    return (
      <ModalShell onClose={onClose} title="New activity" onBack={onBackFromCreate}>
        <CreateActivityForm onSubmit={onSubmitCreate} initial={createPrefill} />
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose} title="What did you do?">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search activities…"
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm mb-4"
      />

      {(recentActivities.length > 0 || q) && filteredRecents.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2 flex items-center gap-1">
            <History size={11} /> {q ? "Recent matches" : "Recent"}
          </div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {filteredRecents.map((a) => {
              const attr = ATTR_MAP[a.attribute];
              return (
                <button
                  key={a.id}
                  onClick={() => onPickExisting(a)}
                  className="text-left bg-neutral-800 rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <attr.icon size={14} color={attr.color} />
                  <span className="text-sm">{a.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {libraryMatches.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2 flex items-center gap-1">
            <Library size={11} /> From the library
          </div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {libraryMatches.map((s) => {
              const attr = ATTR_MAP[s.attribute];
              const secondary = s.secondaryAttribute ? ATTR_MAP[s.secondaryAttribute] : null;
              return (
                <button
                  key={s.name}
                  onClick={() => onPickFromLibrary(s)}
                  className="text-left bg-neutral-800/60 border border-neutral-800 rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <attr.icon size={14} color={attr.color} />
                  <span className="text-sm flex-1">{s.name}</span>
                  {secondary && <secondary.icon size={12} color={secondary.color} className="opacity-60" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {q && filteredRecents.length === 0 && libraryMatches.length === 0 && (
        <div className="text-neutral-500 text-sm mb-4">No matching activities.</div>
      )}

      <button
        onClick={() => onCreateNew(query.trim())}
        className="w-full flex items-center justify-center gap-2 bg-white text-neutral-950 font-medium rounded-lg py-3"
      >
        <Plus size={16} /> Create new activity
      </button>
    </ModalShell>
  );
}
