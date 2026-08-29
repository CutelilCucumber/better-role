import React from "react";

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-neutral-800 border border-neutral-700 text-sm px-4 py-2 rounded-full shadow-lg z-50 animate-pulse">
      {message}
    </div>
  );
}
