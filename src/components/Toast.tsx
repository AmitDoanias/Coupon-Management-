"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Trash2, PencilLine, X } from "lucide-react";

export type ToastType = "added" | "deleted" | "updated";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const ICONS: Record<ToastType, React.ElementType> = {
  added:   CheckCircle,
  deleted: Trash2,
  updated: PencilLine,
};

const COLORS: Record<ToastType, string> = {
  added:   "bg-emerald-600",
  deleted: "bg-red-500",
  updated: "bg-indigo-600",
};

export default function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // mount → slide in
    const show = setTimeout(() => setVisible(true), 10);
    // auto-dismiss after 3s
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [onClose]);

  const Icon = ICONS[type];
  const color = COLORS[type];

  return (
    <div
      dir="rtl"
      className={`
        fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-white text-sm font-medium
        transition-all duration-300
        ${color}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span>{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="mr-1 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}
