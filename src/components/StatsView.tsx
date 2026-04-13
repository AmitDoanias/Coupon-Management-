"use client";

import { Coupon } from "@/types/coupon";
import { formatCurrency, getSavings, getBalancePercent, isExpiringSoon, isExpired, getBrandColors, getBrandInitial } from "@/lib/coupon-utils";

interface StatsViewProps {
  coupons: Coupon[];
}

export default function StatsView({ coupons }: StatsViewProps) {
  const active = coupons.filter(c => c.status === "active");
  const totalBalance = active.reduce((s, c) => s + c.currentBalance, 0);
  const totalSavings = coupons.reduce((s, c) => s + getSavings(c), 0);
  const expiringSoon = active.filter(c => isExpiringSoon(c.expiryDate) && !isExpired(c.expiryDate));
  const avgUtilization = active.length
    ? Math.round(active.reduce((s, c) => s + getBalancePercent(c), 0) / active.length)
    : 0;

  const byCategory = active.reduce<Record<string, { balance: number; count: number }>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = { balance: 0, count: 0 };
    acc[c.category].balance += c.currentBalance;
    acc[c.category].count += 1;
    return acc;
  }, {});
  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1].balance - a[1].balance);
  const maxCatBalance = categoryEntries[0]?.[1].balance ?? 1;

  const byBrand = active.reduce<Record<string, number>>((acc, c) => {
    acc[c.brand] = (acc[c.brand] ?? 0) + c.currentBalance;
    return acc;
  }, {});
  const topBrands = Object.entries(byBrand).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxBrandBalance = topBrands[0]?.[1] ?? 1;

  const BAR_COLORS = ["bg-primary", "bg-primary-container", "bg-secondary-fixed-dim", "bg-outline-variant"];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">ניתוח ביצועים</h1>
          <p className="text-on-surface-variant mt-2 text-lg">מעקב אחר הניצול והחיסכון בארנק הדיגיטלי שלך</p>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main column */}
        <div className="lg:col-span-8 space-y-8">
          {/* KPI grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Balance */}
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(25,28,30,0.04)] relative overflow-hidden group">
              <div className="absolute -left-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined" style={{ fontSize: "8rem" }}>account_balance_wallet</span>
              </div>
              <p className="text-on-surface-variant font-medium mb-1">יתרה כוללת</p>
              <h2 className="text-5xl font-black text-primary leading-tight">{formatCurrency(totalBalance)}</h2>
              <div className="mt-4 inline-flex items-center text-xs font-bold bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full">
                {active.length} קופונים פעילים
              </div>
            </div>
            {/* Savings */}
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(25,28,30,0.04)] relative overflow-hidden group">
              <div className="absolute -left-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined" style={{ fontSize: "8rem" }}>savings</span>
              </div>
              <p className="text-on-surface-variant font-medium mb-1">חיסכון מצטבר</p>
              <h2 className="text-5xl font-black text-secondary leading-tight">{formatCurrency(totalSavings)}</h2>
              <p className="text-xs text-on-surface-variant mt-4 font-medium italic">נחסך מאז פתיחת הארנק</p>
            </div>
            {/* Active count */}
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(25,28,30,0.04)] relative overflow-hidden group">
              <div className="absolute -left-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined" style={{ fontSize: "8rem" }}>confirmation_number</span>
              </div>
              <p className="text-on-surface-variant font-medium mb-1">קופונים פעילים</p>
              <h2 className="text-5xl font-black text-on-surface leading-tight">{active.length}</h2>
              <p className="text-xs text-on-surface-variant mt-4">מתוכם {expiringSoon.length} פגים בקרוב</p>
            </div>
            {/* Avg utilization */}
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(25,28,30,0.04)] relative overflow-hidden group">
              <div className="absolute -left-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined" style={{ fontSize: "8rem" }}>speed</span>
              </div>
              <p className="text-on-surface-variant font-medium mb-1">ניצול ממוצע %</p>
              <h2 className="text-5xl font-black text-on-tertiary-fixed-variant leading-tight">{avgUtilization}%</h2>
              <div className="w-full bg-surface-container-low h-2 mt-4 rounded-full">
                <div className="bg-tertiary h-full rounded-full" style={{ width: `${avgUtilization}%` }} />
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          {categoryEntries.length > 0 && (
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(25,28,30,0.04)]">
              <div className="flex justify-between items-center mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">פירוט</span>
                <h3 className="text-xl font-bold">פירוט לפי קטגוריה</h3>
              </div>
              <div className="space-y-6">
                {categoryEntries.map(([cat, { balance }], i) => {
                  const pct = Math.round((balance / maxCatBalance) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold">{formatCurrency(balance)}</span>
                        <span className="text-sm font-medium">{cat}</span>
                      </div>
                      <div className="w-full h-4 bg-surface-container-low rounded-full overflow-hidden">
                        <div className={`h-full ${BAR_COLORS[i % BAR_COLORS.length]} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Side column */}
        <div className="lg:col-span-4 space-y-8">
          {/* Expiring soon */}
          {expiringSoon.length > 0 && (
            <div className="bg-tertiary-fixed p-6 rounded-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4 text-tertiary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                <h3 className="font-bold text-lg">פג תוקף בקרוב</h3>
              </div>
              <div className="space-y-3">
                {expiringSoon.slice(0, 5).map(c => (
                  <div key={c.id} className="bg-white/40 p-4 rounded-lg flex justify-between items-center">
                    <span className="text-sm font-bold text-tertiary">
                      {new Date(c.expiryDate).toLocaleDateString("he-IL")}
                    </span>
                    <span className="text-sm font-black">{c.brand}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 border-2 border-tertiary text-tertiary font-bold rounded-full hover:bg-tertiary hover:text-white transition-all">
                צפייה בכל הקופונים
              </button>
            </div>
          )}

          {/* Top brands */}
          {topBrands.length > 0 && (
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(25,28,30,0.04)]">
              <h3 className="text-xl font-bold mb-8">המותגים המובילים</h3>
              <div className="space-y-8">
                {topBrands.map(([brand, balance]) => {
                  const colors = getBrandColors(brand);
                  const initial = getBrandInitial(brand);
                  const pct = Math.round((balance / maxBrandBalance) * 100);
                  return (
                    <div key={brand} className="flex items-center gap-4">
                      <div className="flex-1 text-right">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-bold text-primary">{formatCurrency(balance)}</span>
                          <p className="font-bold">{brand}</p>
                        </div>
                        <div className="w-full h-1.5 bg-surface-container-low rounded-full">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${colors.bg} ${colors.text}`}>
                        {initial}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Invite card */}
          <div className="bg-primary p-6 rounded-xl text-white relative overflow-hidden group cursor-pointer">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-1">הזמן חבר</h4>
              <p className="text-primary-fixed text-sm opacity-80">קבלו ₪20 לכל הצטרפות</p>
            </div>
            <div className="absolute -left-6 -bottom-6 opacity-20 group-hover:rotate-12 transition-transform">
              <span className="material-symbols-outlined" style={{ fontSize: "6rem" }}>card_giftcard</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
