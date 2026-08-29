import React from "react";
import { ATTR_MAP } from "../constants";
import { activityStats } from "../utils/helpers";
import ActivityDetail from "./ActivityDetail";

export default function ActivitiesScreen({ state, view, setView, onRecordAgain }) {
  if (view.name === "detail") {
    const activity = state.activities.find((a) => a.id === view.activityId);
    if (!activity) {
      setView({ name: "list" });
      return null;
    }
    return (
      <ActivityDetail
        activity={activity}
        state={state}
        onBack={() => setView({ name: "list" })}
        onRecordAgain={onRecordAgain}
      />
    );
  }

  return (
    <div className="px-4 pt-6">
      <div className="text-lg font-semibold mb-4">Activities</div>
      {state.activities.length === 0 && (
        <div className="text-neutral-500 text-sm">No activities yet. Log something from the Map tab.</div>
      )}
      <div className="flex flex-col gap-2">
        {state.activities.map((activity) => {
          const attr = ATTR_MAP[activity.attribute];
          const stats = activityStats(activity, state.sessions);
          return (
            <button
              key={activity.id}
              onClick={() => setView({ name: "detail", activityId: activity.id })}
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
