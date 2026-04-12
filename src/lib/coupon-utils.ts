import { Coupon } from "@/types/coupon";

// ── Brand avatar color system ─────────────────────────────────────
const BRAND_COLOR_PAIRS = [
  { bg: "bg-indigo-100",  text: "text-indigo-700"  },
  { bg: "bg-violet-100",  text: "text-violet-700"  },
  { bg: "bg-pink-100",    text: "text-pink-700"    },
  { bg: "bg-orange-100",  text: "text-orange-700"  },
  { bg: "bg-teal-100",    text: "text-teal-700"    },
  { bg: "bg-cyan-100",    text: "text-cyan-700"    },
  { bg: "bg-rose-100",    text: "text-rose-700"    },
  { bg: "bg-amber-100",   text: "text-amber-700"   },
  { bg: "bg-lime-100",    text: "text-lime-700"    },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
];

export function getBrandColors(brand: string): { bg: string; text: string } {
  const idx = brand
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0) % BRAND_COLOR_PAIRS.length;
  return BRAND_COLOR_PAIRS[idx];
}

export function getBrandInitial(brand: string): string {
  return brand.charAt(0).toUpperCase();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function daysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(expiryDate: string): boolean {
  return daysUntilExpiry(expiryDate) <= 7;
}

export function isExpired(expiryDate: string): boolean {
  return daysUntilExpiry(expiryDate) < 0;
}

export function getSavings(coupon: Coupon): number {
  return coupon.originalValue - coupon.purchaseCost;
}

export function getBalancePercent(coupon: Coupon): number {
  if (coupon.originalValue === 0) return 0;
  return Math.round((coupon.currentBalance / coupon.originalValue) * 100);
}

export function redeemFromCoupon(coupon: Coupon, amount: number): Coupon {
  const newBalance = Math.max(0, coupon.currentBalance - amount);
  const record = {
    id: crypto.randomUUID(),
    date: new Date().toISOString().split("T")[0],
    amount,
  };
  return {
    ...coupon,
    currentBalance: newBalance,
    status: newBalance <= 0 ? "archived" : coupon.status,
    redemptions: [...coupon.redemptions, record],
  };
}
