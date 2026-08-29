import React, { useState } from "react";
import { ATTR_MAP } from "../constants";
import Field from "../components/Field";

export default function CreateActivityForm({ onSubmit, initial }) {
  const [name, setName] = useState(initial?.name || "");
  const [unit, setUnit] = useState(initial?.unit || "");
  const secondaryAttribute = initial?.secondaryAttribute || null;
  const secondaryMeta = secondaryAttribute ? ATTR_MAP[secondaryAttribute] : null;

  return (
    <div className="flex flex-col gap-4">
      {initial && (
        <div className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2">
          From the activity library — feel free to tweak anything before creating it.
        </div>
      )}

      <Field label="Activity name">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Running"
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Quantity unit (optional, e.g. miles, pages)">
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="miles"
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
        />
      </Field>

      {secondaryMeta && (
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <secondaryMeta.icon size={13} color={secondaryMeta.color} />
          Also lightly trains {secondaryMeta.label}
        </div>
      )}

      <button
        disabled={!name.trim()}
        onClick={() => onSubmit({ name, unit, secondaryAttribute })}
        className="w-full bg-white text-neutral-950 font-medium rounded-lg py-3 disabled:opacity-40"
      >
        Create activity
      </button>
    </div>
  );
}
