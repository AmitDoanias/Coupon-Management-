"use client";

import { useEffect, useState } from "react";

export type ToastType = "added" | "deleted" | "updated";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const CONFIG: Record<ToastType, { icon: string; bg: string }> = {
  added:   { icon: "check_circle", bg: "bg-secondary" },
  deleted: { icon: "delete",       bg: "bg-error" },
  updated: { icon: "edit",         bg: "bg-primary" },
};

export default function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [onClose]);

  const { icon, bg } = CONFIG[type];

  return (
    <div
      dir="rtl"
      className={`
        fixed bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3 px-5 py-3.5 rounded-full shadow-lg text-white text-sm font-medium
        transition-all duration-300
        ${bg}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      <span className="material-symbols-outlined flex-shrink-0 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
      <span>{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        className="mr-1 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="סגור"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );
}
