"use client";

import { Coupon } from "@/types/coupon";
import { formatCurrency, getSavings, getBalancePercent, isExpiringSoon, isExpired } from "@/lib/coupon-utils";
import { getBrandColors, getBrandInitial } from "@/lib/coupon-utils";
import { AlertTriangle, TrendingUp, Wallet, Percent, Package } from "lucide-react";

interface StatsViewProps {
  coupons: Coupon[];
}

const CATEGORY_COLORS: Record<string, string> = {
  קניות: "bg-indigo-500",
  אוכל:  "bg-orange-500",
  אופנה: "bg-pink-500",
  פנאי:  "bg-teal-500",
  אחר:   "bg-gray-400",
};

export default function StatsView({ coupons }: StatsViewProps) {
  const active = coupons.filter(c => c.status === "active");
  const totalBalance = active.reduce((s, c) => s + c.currentBalance, 0);
  const totalSavings = coupons.reduce((s, c) => s + getSavings(c), 0);
  const expiringSoon = active.filter(c => isExpiringSoon(c.expiryDate) && !isExpired(c.expiryDate));
  const avgUtilization = active.length
    ? Math.round(active.reduce((s, c) => s + getBalancePercent(c), 0) / active.length)
    : 0;

  // Per-category breakdown
  const byCategory = active.reduce<Record<string, { balance: number; count: number }>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = { balance: 0, count: 0 };
    acc[c.category].balance += c.currentBalance;
    acc[c.category].count += 1;
    return acc;
  }, {});
  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1].balance - a[1].balance);

  // Top brands
  const byBrand = active.reduce<Record<string, number>>((acc, c) => {
    acc[c.brand] = (acc[c.brand] ?? 0) + c.currentBalance;
    return acc;
  }, {});
  const topBrands = Object.entries(byBrand).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-5 pb-6">
      <h2 className="text-lg font-bold text-gray-900">סטטיסטיקה</h2>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          label="יתרה כוללת"
          value={formatCurrency(totalBalance)}
          icon={<Wallet size={16} />}
          color="bg-indigo-600"
        />
        <KpiCard
          label="חיסכון מצטבר"
          value={formatCurrency(totalSavings)}
          icon={<TrendingUp size={16} />}
          color="bg-emerald-600"
        />
        <KpiCard
          label="קופונים פעילים"
          value={String(active.length)}
          icon={<Package size={16} />}
          color="bg-violet-600"
        />
        <KpiCard
          label="ניצול ממוצע"
          value={`${avgUtilization}%`}
          icon={<Percent size={16} />}
          color="bg-cyan-600"
        />
      </div>

      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">
              {expiringSoon.length} קופונים פגים בקרוב
            </p>
            <ul className="space-y-0.5">
              {expiringSoon.map(c => (
                <li key={c.id} className="text-xs text-amber-700">
                  {c.brand} — {formatCurrency(c.currentBalance)} · {new Date(c.expiryDate).toLocaleDateString("he-IL")}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">לפי קטגוריה</h3>
        <div className="space-y-3">
          {categoryEntries.map(([cat, { balance, count }]) => {
            const pct = totalBalance > 0 ? Math.round((balance / totalBalance) * 100) : 0;
            const barColor = CATEGORY_COLORS[cat] ?? "bg-gray-400";
            return (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">{count} קופון{count !== 1 ? "ים" : ""}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{pct}%</span>
                    <span className="font-semibold text-gray-800">{cat}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-0.5 text-left">{formatCurrency(balance)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top brands */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">מותגים מובילים לפי יתרה</h3>
        <div className="space-y-2.5">
          {topBrands.map(([brand, balance], i) => {
            const colors = getBrandColors(brand);
            const initial = getBrandInitial(brand);
            return (
              <div key={brand} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${colors.bg} ${colors.text}`}>
                  {initial}
                </div>
                <span className="flex-1 text-sm text-gray-700 font-medium">{brand}</span>
                <span className="text-sm font-bold text-indigo-600">{formatCurrency(balance)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl mb-2 ${color} text-white`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
