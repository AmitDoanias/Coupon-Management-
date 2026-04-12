"use client";

import { LayoutGrid, Archive, Plus, TrendingUp } from "lucide-react";

export type TabId = "dashboard" | "archive" | "add" | "stats";

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: React.ElementType; isFab?: boolean }[] = [
  { id: "stats",     label: "סטטיסטיקה", icon: TrendingUp },
  { id: "archive",   label: "ארכיון",     icon: Archive },
  { id: "add",       label: "הוסף",       icon: Plus, isFab: true },
  { id: "dashboard", label: "ראשי",       icon: LayoutGrid },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-100 safe-bottom md:hidden"
      aria-label="ניווט ראשי"
    >
      <div className="flex items-end justify-around px-2 pb-2 pt-1 max-w-lg mx-auto">
        {TABS.map(({ id, label, icon: Icon, isFab }) => {
          const isActive = active === id;

          if (isFab) {
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                aria-label={label}
                className="
                  -mt-5 w-14 h-14 rounded-full bg-indigo-600 text-white
                  flex items-center justify-center shadow-lg shadow-indigo-300
                  hover:bg-indigo-700 active:scale-95 transition-all duration-150
                "
              >
                <Icon size={22} />
              </button>
            );
          }

          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[56px] relative"
            >
              {/* MD3 pill indicator */}
              {isActive && (
                <span className="absolute top-1 inset-x-2 h-8 rounded-full bg-indigo-100 -z-0" />
              )}
              <span className={`relative z-10 transition-colors duration-150 ${isActive ? "text-indigo-600" : "text-gray-400"}`}>
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} />
              </span>
              <span className={`text-[10px] font-medium leading-none transition-colors duration-150 ${
                isActive ? "text-indigo-600" : "text-gray-400"
              }`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
