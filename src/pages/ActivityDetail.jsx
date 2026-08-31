import React, { useState } from "react";
import { ChevronLeft, Trophy, Edit, Trash2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ATTR_MAP } from "../constants";
import { activityStats } from "../utils/helpers";
import StatCard from "../components/StatCard";

export default function ActivityDetail({ activity, state, onBack, onRecordAgain, onEditSession, onDeleteSession, backLabel }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const attr = ATTR_MAP[activity.attribute];
  const stats = activityStats(activity, state.sessions);
  const chartData = stats.sessions.map((s, i) => ({
    idx: i + 1,
    quantity: s.quantity,
    duration: s.duration,
    intensity: s.intensity,
  }));

  return (
    <div className="px-4 pt-6">
      <button onClick={onBack} className="flex items-center gap-1 text-neutral-400 text-sm mb-4">
        <ChevronLeft size={16} /> {backLabel || "Activities"}
      </button>

      <div className="flex items-center justify-between mb-1">
        <div className="text-xl font-semibold">{activity.name}</div>
        <attr.icon size={20} color={attr.color} />
      </div>
      <div className="text-sm mb-5" style={{ color: attr.color }}>
        {attr.label} +{stats.sessionCount}
      </div>

      {chartData.length > 1 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-2 mb-4" style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
              <XAxis dataKey="idx" stroke="#525252" fontSize={10} />
              <YAxis stroke="#525252" fontSize={10} />
              <Tooltip contentStyle={{ background: "#171717", border: "1px solid #333", fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey={activity.tracking.quantity ? "quantity" : "duration"}
                stroke={attr.color}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatCard label="Sessions" value={stats.sessionCount} />
        <StatCard label="Total time" value={`${Math.floor(stats.totalDuration / 60)}h ${stats.totalDuration % 60}m`} />
        {activity.tracking.quantity && <StatCard label={`Best (${activity.unit})`} value={stats.bestQuantity} />}
        <StatCard label="Avg intensity" value={stats.avgIntensity.toFixed(1)} />
      </div>

      <button
        onClick={() => onRecordAgain(activity)}
        className="w-full bg-white text-neutral-950 font-medium rounded-xl py-3 mb-6"
      >
        Log another session
      </button>

      <div className="text-sm text-neutral-400 mb-2">Recent sessions</div>
      <div className="flex flex-col gap-2">
        {stats.sessions
          .slice()
          .reverse()
          .map((s) => (
            <div key={s.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm">
              <div className="flex justify-between text-neutral-300">
                <span>{new Date(s.date).toLocaleDateString()}</span>
                <span>
                  {s.duration}min{activity.tracking.quantity ? ` · ${s.quantity}${activity.unit}` : ""} · int {s.intensity}
                </span>
              </div>
              {s.notes && <div className="text-neutral-500 mt-1">{s.notes}</div>}
              {s.personalBests.length > 0 && (
                <div className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                  <Trophy size={12} /> New best: {s.personalBests.join(", ")}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-800">
                <button
                  onClick={() => onEditSession(activity, s)}
                  className="flex items-center gap-1 text-neutral-400 hover:text-white text-xs px-2 py-1 rounded"
                >
                  <Edit size={12} /> Edit
                </button>
                {confirmDelete === s.id ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-red-400">Delete?</span>
                    <button
                      onClick={() => { onDeleteSession(activity, s.id); setConfirmDelete(null); }}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/30"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(s.id)}
                    className="flex items-center gap-1 text-neutral-400 hover:text-red-400 text-xs px-2 py-1 rounded"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
