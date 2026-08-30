import React from "react";
import { NavLink } from "react-router-dom";
import { Map as MapIcon, ListChecks, User } from "lucide-react";

const ITEMS = [
  { path: "/", label: "Map", icon: MapIcon },
  { path: "/activities", label: "Activities", icon: ListChecks },
  { path: "/character", label: "Character", icon: User },
];

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 flex z-40">
      {ITEMS.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) => `flex-1 flex flex-col items-center gap-1 py-3 text-xs ${
            isActive ? "text-white" : "text-neutral-500"
          }`}
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </div>
  );
}
