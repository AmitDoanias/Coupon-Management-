"use client";

import { type TabId } from "./BottomNav";

interface DesktopSidebarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  totalBalance: number;
  totalSavings: number;
  activeCouponCount: number;
  onSignOut?: () => void;
}

const NAV_ITEMS: { id: TabId; label: string; icon: string }[] = [
  { id: "dashboard", label: "ראשי",          icon: "dashboard" },
  { id: "archive",   label: "קופונים ישנים", icon: "history" },
  { id: "stats",     label: "סטטיסטיקות",    icon: "analytics" },
];

export default function DesktopSidebar({
  active,
  onChange,
  onSignOut,
}: DesktopSidebarProps) {
  return (
    <aside
      className="hidden md:flex fixed right-0 top-0 h-full w-72 bg-surface-container-low flex-col p-6 text-right items-end z-50"
      aria-label="תפריט ניווט"
    >
      {/* App title */}
      <div className="mb-8 w-full">
        <h1 className="text-2xl font-black text-primary tracking-tight">ארנק הקופונים</h1>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col w-full gap-2 mt-4 flex-1" aria-label="ניווט">
        {NAV_ITEMS.map(({ id, label, icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-4 px-4 py-3 transition-all w-full justify-end ${
                isActive
                  ? "border-r-4 border-primary bg-white text-primary font-bold"
                  : "text-slate-600 hover:bg-white/50"
              }`}
            >
              <span>{label}</span>
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {icon}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Add coupon CTA */}
      <div className="mt-auto w-full">
        <button
          onClick={() => onChange("add")}
          className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 mb-4 hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
          <span>קופון חדש</span>
        </button>

        {/* Sign out */}
        {onSignOut && (
          <form action={onSignOut}>
            <button
              type="submit"
              className="flex items-center gap-4 px-4 py-3 text-slate-600 hover:bg-white/50 transition-all w-full justify-end"
            >
              <span>יציאה</span>
              <span className="material-symbols-outlined">logout</span>
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
