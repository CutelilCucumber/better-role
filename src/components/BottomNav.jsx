import React from "react";
import { Map as MapIcon, ListChecks, User } from "lucide-react";

const ITEMS = [
  { key: "map", label: "Map", icon: MapIcon },
  { key: "activities", label: "Activities", icon: ListChecks },
  { key: "character", label: "Character", icon: User },
];

export default function BottomNav({ tab, setTab }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 flex z-40">
      {ITEMS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs ${
            tab === key ? "text-white" : "text-neutral-500"
          }`}
        >
          <Icon size={20} />
          {label}
        </button>
      ))}
    </div>
  );
}
