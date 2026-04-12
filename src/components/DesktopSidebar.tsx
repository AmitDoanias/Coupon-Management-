"use client";

import { LayoutGrid, Archive, Plus, TrendingUp, Wallet, LogOut } from "lucide-react";
import { type TabId } from "./BottomNav";

interface DesktopSidebarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  totalBalance: number;
  totalSavings: number;
  activeCouponCount: number;
  onSignOut?: () => void;
}

const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "ראשי",       icon: LayoutGrid },
  { id: "stats",     label: "סטטיסטיקה", icon: TrendingUp },
  { id: "archive",   label: "ארכיון",     icon: Archive },
];

function formatShort(n: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function DesktopSidebar({
  active,
  onChange,
  totalBalance,
  totalSavings,
  activeCouponCount,
  onSignOut,
}: DesktopSidebarProps) {
  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0 sticky top-0 h-screen border-r border-gray-100 bg-white"
      aria-label="תפריט ניווט"
      dir="rtl"
    >
      {/* Logo / App name */}
      <div className="px-5 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
            <Wallet size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 text-sm leading-tight">ארנק קופונים</h1>
            <p className="text-[11px] text-gray-400 leading-tight">{activeCouponCount} קופונים פעילים</p>
          </div>
          {onSignOut && (
            <form action={onSignOut}>
              <button
                type="submit"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="התנתק"
              >
                <LogOut size={15} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-4 py-4 space-y-2.5 border-b border-gray-100">
        <div className="bg-indigo-50 rounded-xl p-3">
          <p className="text-[11px] text-indigo-500 font-medium mb-0.5">יתרה כוללת</p>
          <p className="text-xl font-bold text-indigo-700">{formatShort(totalBalance)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-[11px] text-emerald-600 font-medium mb-0.5">חיסכון מצטבר</p>
          <p className="text-xl font-bold text-emerald-700">{formatShort(totalSavings)}</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 space-y-1" aria-label="ניווט">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 text-right
                ${isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.2 : 1.7}
                className={isActive ? "text-indigo-600" : "text-gray-400"}
              />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Add coupon CTA at bottom */}
      <div className="px-4 pb-6">
        <button
          onClick={() => onChange("add")}
          className="
            w-full flex items-center justify-center gap-2 py-3 rounded-xl
            bg-indigo-600 text-white text-sm font-semibold
            hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-200
          "
        >
          <Plus size={16} />
          הוסף קופון
        </button>
      </div>
    </aside>
  );
}
