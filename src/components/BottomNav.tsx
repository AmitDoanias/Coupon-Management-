"use client";

export type TabId = "dashboard" | "archive" | "add" | "stats";

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: string; isFab?: boolean }[] = [
  { id: "stats",     label: "נתונים",  icon: "leaderboard" },
  { id: "archive",   label: "ארכיון",  icon: "inventory_2" },
  { id: "add",       label: "הוסף",    icon: "add", isFab: true },
  { id: "dashboard", label: "בית",     icon: "home" },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md flex flex-row-reverse justify-around items-center px-4 pb-6 pt-3 shadow-[0_-12px_32px_rgba(25,28,30,0.06)] z-50 rounded-t-xl safe-bottom"
      aria-label="ניווט ראשי"
    >
      {TABS.map(({ id, label, icon, isFab }) => {
        const isActive = active === id;

        if (isFab) {
          return (
            <div key={id} className="relative -top-8">
              <button
                onClick={() => onChange(id)}
                aria-label={label}
                className="w-16 h-16 bg-gradient-to-br from-primary to-primary-container text-white rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-3xl">add</span>
              </button>
            </div>
          );
        }

        return (
          <a
            key={id}
            href="#"
            onClick={(e) => { e.preventDefault(); onChange(id); }}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center ${
              isActive
                ? "bg-indigo-50 text-primary rounded-[1.5rem] px-4 py-1"
                : "text-slate-400"
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {icon}
            </span>
            <span className="text-xs font-bold tracking-wide mt-1">{label}</span>
          </a>
        );
      })}
    </nav>
  );
}
