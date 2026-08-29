import React from "react";

export default function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1.5">{label}</div>
      {children}
    </div>
  );
}
