import React, { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { ATTR_MAP } from "../constants";
import { activityStats } from "../utils/helpers";

export default function ActivitiesScreen({ state, onRecordAgain, onDeleteSession }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filteredActivities = useMemo(() => {
    if (!q) return state.activities;
    return state.activities.filter((a) => a.name.toLowerCase().includes(q));
  }, [state.activities, q]);

  const activityStatsMap = useMemo(() => {
    const map = new Map();
    for (const a of state.activities) {
      map.set(a.id, activityStats(a, state.sessions));
    }
    return map;
  }, [state.activities, state.sessions]);

  return (
    <div className="px-4 pt-6">
      <div className="text-lg font-semibold mb-4">Activities</div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search activities…"
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm mb-4"
      />
      {state.activities.length === 0 && (
        <div className="text-neutral-500 text-sm">No activities yet. Log something from the Map tab.</div>
      )}
      {q && filteredActivities.length === 0 && state.activities.length > 0 && (
        <div className="text-neutral-500 text-sm mb-4">No matching activities.</div>
      )}
      <div className="flex flex-col gap-2">
        {filteredActivities.map((activity) => {
          const attr = ATTR_MAP[activity.attribute];
          const stats = activityStatsMap.get(activity.id);
          return (
            <NavLink
              key={activity.id}
              to={`/activities/${activity.id}`}
              className="text-left bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{activity.name}</div>
                <div className="text-xs mt-0.5" style={{ color: attr.color }}>
                  {attr.label} +{stats.sessionCount}
                </div>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <div>{stats.sessionCount} sessions</div>
                <div>{stats.lastSession ? new Date(stats.lastSession.date).toLocaleDateString() : "—"}</div>
              </div>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}