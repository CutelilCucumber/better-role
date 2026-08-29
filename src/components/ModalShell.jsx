import React from "react";
import { X, ChevronLeft } from "lucide-react";

export default function ModalShell({ children, onClose, title, onBack }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50">
      <div className="bg-neutral-950 border border-neutral-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          {onBack ? (
            <button onClick={onBack} className="text-neutral-400">
              <ChevronLeft size={20} />
            </button>
          ) : (
            <div />
          )}
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="text-neutral-400">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
