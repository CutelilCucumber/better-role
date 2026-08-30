import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import { ATTRS } from "../constants";
import { activityStats, nodeRadius } from "../utils/helpers";

export default function MapScreen({ state, onOpenNew, onOpenActivity }) {
  const size = 340;
  const center = size / 2;
  const baseRadius = 108;

  const nodesByAttr = useMemo(() => {
    const grouped = {};
    for (const a of ATTRS) grouped[a.key] = [];
    for (const activity of state.activities) {
      const stats = activityStats(activity, state.sessions);
      if (stats.sessionCount > 0) {
        grouped[activity.attribute]?.push({ activity, stats });
      }
    }
    return grouped;
  }, [state.activities, state.sessions]);

  return (
    <div className="px-4 pt-6">
      <div className="text-center mb-4">
        <div className="text-xs uppercase tracking-widest text-neutral-500">Better Role</div>
        <div className="text-lg font-semibold">{state.user.name}</div>
      </div>

      <div className="relative mx-auto" style={{ width: size, height: size }}>
        {/* attribute labels + spokes */}
        {ATTRS.map((attr) => {
          const rad = (attr.angle * Math.PI) / 180;
          const lx = center + Math.cos(rad) * (baseRadius + 34);
          const ly = center + Math.sin(rad) * (baseRadius + 34);
          const attrVal = state.attributes[attr.key] || 0;
          return (
            <div key={attr.key}>
              <svg className="absolute top-0 left-0 pointer-events-none" width={size} height={size}>
                <line
                  x1={center}
                  y1={center}
                  x2={center + Math.cos(rad) * baseRadius}
                  y2={center + Math.sin(rad) * baseRadius}
                  stroke="#262626"
                  strokeWidth="1"
                />
              </svg>
              <div
                className="absolute flex flex-col items-center text-center"
                style={{ left: lx, top: ly, transform: "translate(-50%,-50%)", width: 70 }}
              >
                <attr.icon size={14} color={attr.color} />
                <div className="text-[10px] uppercase tracking-wide text-neutral-400 mt-0.5">{attr.label}</div>
                <div className="text-[11px] font-semibold" style={{ color: attr.color }}>{attrVal}</div>
              </div>
            </div>
          );
        })}

        {/* activity nodes */}
        {ATTRS.map((attr) => {
          const nodes = nodesByAttr[attr.key];
          const spread = 26; // degrees spread among siblings
          return nodes.map((n, i) => {
            const offset =
              nodes.length > 1
                ? (i - (nodes.length - 1) / 2) * (spread / Math.max(nodes.length - 1, 1))
                : 0;
            const nodeAngle = ((attr.angle + offset) * Math.PI) / 180;
            const dist = baseRadius * 0.68;
            const nx = center + Math.cos(nodeAngle) * dist;
            const ny = center + Math.sin(nodeAngle) * dist;
            const r = nodeRadius(n.stats.sessionCount);
            return (
              <button
                key={n.activity.id}
                onClick={() => onOpenActivity(n.activity)}
                className="absolute flex items-center justify-center rounded-full text-[10px] font-medium leading-tight text-center px-1"
                style={{
                  left: nx,
                  top: ny,
                  width: r * 2,
                  height: r * 2,
                  transform: "translate(-50%,-50%)",
                  background: `${attr.color}33`,
                  border: `1.5px solid ${attr.color}`,
                  color: "#f5f5f5",
                }}
              >
                {n.activity.name.length > 10 ? n.activity.name.slice(0, 9) + "…" : n.activity.name}
              </button>
            );
          });
        })}

        {/* center button */}
        <button
          onClick={onOpenNew}
          className="absolute rounded-full bg-white text-neutral-950 flex flex-col items-center justify-center font-semibold shadow-lg"
          style={{ left: center, top: center, width: 88, height: 88, transform: "translate(-50%,-50%)" }}
        >
          <Plus size={22} />
          <span className="text-[10px] mt-0.5">New</span>
        </button>
      </div>

      {!state.activities.some((a) => activityStats(a, state.sessions).sessionCount > 0) && (
        <div className="text-center text-neutral-500 text-sm mt-10 px-6">
          Nothing on the map yet. Tap the center button to log your first activity.
        </div>
      )}
    </div>
  );
}
