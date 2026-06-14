"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ title, description, open, onClose, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/35 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-lg border border-stone-300 bg-[#FFFDF8] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 p-5">
          <div>
            <h2 className="text-2xl font-semibold text-stone-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-stone-600">{description}</p>
            ) : null}
          </div>
          <button
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 text-stone-700 hover:border-stone-600"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}
