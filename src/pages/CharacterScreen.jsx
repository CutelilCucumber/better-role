import React from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from "recharts";
import { ATTRS, ARCHETYPE_EMOJI } from "../constants";
import { computeArchetype } from "../utils/helpers";

export default function CharacterScreen({ state }) {
  const attrs = state.attributes;
  const radarData = ATTRS.map((a) => ({
    attribute: a.label.slice(0, 3).toUpperCase(),
    value: attrs[a.key] || 0,
  }));
  const archetype = computeArchetype(attrs);
  const sorted = [...ATTRS].sort((a, b) => (attrs[b.key] || 0) - (attrs[a.key] || 0));
  const strongest = sorted.slice(0, 2);
  const weakest = sorted.slice(-2).reverse();
  const maxVal = Math.max(4, ...ATTRS.map((a) => attrs[a.key] || 0));

  return (
    <div className="px-4 pt-6">
      <div className="text-lg font-semibold mb-4">Character</div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-2 mb-4" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="72%">
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="attribute" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, maxVal]} tick={false} axisLine={false} />
            <Radar dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.35} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center mb-5">
        <div className="text-4xl mb-1">{ARCHETYPE_EMOJI[archetype]}</div>
        <div className="text-xs text-neutral-500 uppercase tracking-widest">Your current build resembles</div>
        <div className="text-2xl font-bold">{archetype}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        {ATTRS.map((a) => (
          <div key={a.key} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <a.icon size={15} color={a.color} />
              <span className="text-sm text-neutral-300">{a.label}</span>
            </div>
            <span className="font-semibold" style={{ color: a.color }}>{attrs[a.key] || 0}</span>
          </div>
        ))}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Strongest attributes</div>
        <div className="text-sm mb-3">{strongest.map((a) => a.label).join(", ")}</div>
        <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Recommended progression</div>
        <div className="text-sm">{weakest.map((a) => a.label).join(", ")}</div>
      </div>
    </div>
  );
}
