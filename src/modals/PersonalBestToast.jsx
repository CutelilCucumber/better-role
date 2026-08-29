import React from "react";
import { Trophy } from "lucide-react";

export default function PersonalBestToast({ pb, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6" onClick={onClose}>
      <div
        className="bg-neutral-900 border border-amber-500/50 rounded-2xl p-6 text-center max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Trophy className="mx-auto mb-2" size={32} color="#fbbf24" />
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-1">New personal best</div>
        <div className="text-lg font-semibold mb-3">{pb.activity.name}</div>
        {pb.bests.map((b) => (
          <div key={b.label} className="text-sm text-neutral-300 mb-1">
            {b.label}: <span className="font-semibold text-white">{b.value}</span>
            {b.prev > 0 && <span className="text-neutral-500"> (prev {b.prev})</span>}
          </div>
        ))}
        <button onClick={onClose} className="mt-4 w-full bg-white text-neutral-950 rounded-lg py-2 text-sm font-medium">
          Nice
        </button>
      </div>
    </div>
  );
}
