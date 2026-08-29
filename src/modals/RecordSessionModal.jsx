import React, { useState, useEffect } from "react";
import { ATTRS, ATTR_MAP } from "../constants";
import ModalShell from "../components/ModalShell";
import Field from "../components/Field";

export default function RecordSessionModal({ activity, onClose, onBack, onSubmit }) {
  const [duration, setDuration] = useState("");
  const [quantity, setQuantity] = useState("");
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState("");
  const [primaryAttribute, setPrimaryAttribute] = useState(activity.attribute || "constitution");
  const [secondaryAttribute, setSecondaryAttribute] = useState(activity.secondaryAttribute || activity.attribute || "constitution");

  const primaryMeta = ATTR_MAP[primaryAttribute];
  const secondaryMeta = ATTR_MAP[secondaryAttribute];

  useEffect(() => {
    if (secondaryAttribute === activity.attribute || secondaryAttribute === primaryAttribute) {
      setSecondaryAttribute(primaryAttribute);
    }
  }, [primaryAttribute, activity.attribute]);

  const handleSubmit = () => {
    onSubmit({
      duration,
      quantity,
      intensity,
      notes,
      primaryAttribute,
      secondaryAttribute,
    });
  };

  return (
    <ModalShell onClose={onClose} onBack={onBack} title={activity.name}>
      <div className="flex flex-col gap-4">
        <Field label="Duration (minutes)">
          <input
            type="number"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
          />
        </Field>

        {activity.tracking.quantity && (
          <Field label={`Quantity${activity.unit ? ` (${activity.unit})` : ""}`}>
            <input
              type="number"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
            />
          </Field>
        )}

        <Field label="Primary Attribute">
          <div className="grid grid-cols-6 gap-1.5">
            {ATTRS.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => setPrimaryAttribute(a.key)}
                className="flex flex-col items-center gap-1 rounded-lg py-1.5 border"
                style={{
                  borderColor: primaryAttribute === a.key ? a.color : "#333",
                  background: primaryAttribute === a.key ? `${a.color}22` : "transparent",
                }}
              >
                <a.icon size={14} color={a.color} />
                <span className="text-[9px] text-neutral-300">{a.label}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Secondary Attribute">
          <div className="grid grid-cols-6 gap-1.5">
            {ATTRS.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => setSecondaryAttribute(a.key)}
                className="flex flex-col items-center gap-1 rounded-lg py-1.5 border"
                style={{
                  borderColor: secondaryAttribute === a.key ? a.color : "#333",
                  background: secondaryAttribute === a.key ? `${a.color}22` : "transparent",
                }}
              >
                <a.icon size={14} color={a.color} />
                <span className="text-[9px] text-neutral-300">{a.label}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label={`Intensity: ${intensity}/10`}>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full accent-white"
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm resize-none"
          />
        </Field>

        <button
          onClick={handleSubmit}
          className="w-full font-medium rounded-lg py-3"
          style={{ background: primaryMeta.color, color: "#0a0a0a" }}
        >
          Record (+1 {primaryMeta.label} / +0.5 {secondaryMeta.label})
        </button>
      </div>
    </ModalShell>
  );
}
