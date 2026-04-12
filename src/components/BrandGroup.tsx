"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, CreditCard, Tag } from "lucide-react";
import { Coupon } from "@/types/coupon";
import {
  formatCurrency,
  isExpiringSoon,
  isExpired,
  getSavings,
  getBrandColors,
  getBrandInitial,
} from "@/lib/coupon-utils";
import CouponCard from "./CouponCard";

interface BrandGroupProps {
  brand: string;
  coupons: Coupon[];
  onRedeem: (id: string, amount: number) => void;
  onEdit?: (coupon: Coupon) => void;
  onDelete?: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  קניות: "bg-indigo-50 text-indigo-600",
  אוכל:  "bg-orange-50 text-orange-600",
  אופנה: "bg-pink-50 text-pink-600",
  פנאי:  "bg-teal-50 text-teal-600",
  אחר:   "bg-gray-100 text-gray-500",
};

export default function BrandGroup({ brand, coupons, onRedeem, onEdit, onDelete }: BrandGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const totalBalance = coupons.reduce((s, c) => s + c.currentBalance, 0);
  const totalSavings = coupons.reduce((s, c) => s + getSavings(c), 0);
  const hasExpiringSoon = coupons.some(c => isExpiringSoon(c.expiryDate) && !isExpired(c.expiryDate));
  const hasExpired = coupons.some(c => isExpired(c.expiryDate));
  const brandColors = getBrandColors(brand);
  const initial = getBrandInitial(brand);
  const category = coupons[0]?.category ?? "אחר";
  const categoryColor = CATEGORY_COLORS[category] ?? CATEGORY_COLORS["אחר"];
  const cardCount = coupons.filter(c => c.couponType === "card").length;

  // Soonest expiry among non-expired coupons
  const soonestExpiry = coupons
    .filter(c => !isExpired(c.expiryDate))
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];

  return (
    <div className={`
      bg-white rounded-2xl border overflow-hidden transition-all duration-200
      ${hasExpiringSoon && !hasExpired ? "border-amber-200" : "border-gray-100"}
      shadow-sm hover:shadow-md
    `}>
      {/* Accent stripe */}
      <div className={`h-1 ${
        hasExpired ? "bg-gray-200" : hasExpiringSoon ? "bg-amber-400" : "bg-indigo-500"
      }`} />

      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-right px-4 py-3.5 hover:bg-gray-50/70 active:bg-gray-100 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          {/* Chevron */}
          <span className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-0" : ""}`}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>

          {/* Main row */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Brand avatar */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-base ${brandColors.bg} ${brandColors.text}`}>
              {initial}
            </div>

            {/* Brand info */}
            <div className="flex-1 min-w-0 text-right">
              <div className="flex items-center justify-end gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm">{brand}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${categoryColor}`}>
                  {category}
                </span>
                {cardCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                    <CreditCard size={10} />
                    {cardCount === coupons.length ? "כרטיס" : `${cardCount} כרטיס`}
                  </span>
                )}
                {cardCount === 0 && (
                  <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                    <Tag size={10} />ברקוד
                  </span>
                )}
                {(hasExpiringSoon || hasExpired) && (
                  <span className={`flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                    hasExpired ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
                  }`}>
                    <AlertTriangle size={9} />
                    {hasExpired ? "פג תוקף" : "פג בקרוב"}
                  </span>
                )}
              </div>

              {/* Summary row */}
              <div className="flex items-center justify-end gap-3 mt-0.5">
                <span className="text-xs text-gray-400">{coupons.length} קופון{coupons.length !== 1 ? "ים" : ""}</span>
                <span className="text-sm font-bold text-indigo-600">{formatCurrency(totalBalance)}</span>
                {totalSavings > 0 && (
                  <span className="text-xs text-emerald-600 font-medium">חיסכון {formatCurrency(totalSavings)}</span>
                )}
              </div>

              {/* Soonest expiry hint (collapsed only) */}
              {!expanded && soonestExpiry && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  תוקף: {new Date(soonestExpiry.expiryDate).toLocaleDateString("he-IL")}
                </p>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded coupon cards */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-3 pb-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coupons.map(coupon => (
              <CouponCard key={coupon.id} coupon={coupon} onRedeem={onRedeem} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
