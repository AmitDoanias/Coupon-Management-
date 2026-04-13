"use client";

import { Coupon } from "@/types/coupon";
import {
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

export default function BrandGroup({ brand, coupons, onRedeem, onEdit, onDelete }: BrandGroupProps) {
  const brandColors = getBrandColors(brand);
  const initial = getBrandInitial(brand);

  return (
    <section>
      {/* Brand header — matches Stitch dashboard */}
      <div className="flex flex-row-reverse items-center justify-between mb-6">
        <div className="flex flex-row-reverse items-center gap-4">
          <div className={`w-12 h-12 bg-white rounded-md shadow-sm flex items-center justify-center p-2 font-bold text-lg ${brandColors.text}`}>
            {initial}
          </div>
          <h3 className="text-xl font-black text-on-surface">{brand}</h3>
        </div>
        <button className="text-primary font-bold flex items-center gap-1">
          <span>הצג הכל</span>
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>
      </div>

      {/* Cards grid — matches Stitch layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map(coupon => (
          <CouponCard
            key={coupon.id}
            coupon={coupon}
            onRedeem={onRedeem}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
