/**
 * All Supabase DB operations for coupons.
 * Used from client components via the browser Supabase client.
 */

import { Coupon, CouponType, CouponCategory, CouponStatus } from "@/types/coupon";
import { SupabaseClient } from "@supabase/supabase-js";

// ── DB row ↔ Coupon type mapping ─────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCoupon(row: any): Coupon {
  return {
    id: row.id,
    brand: row.brand,
    couponType: row.coupon_type as CouponType,
    code: row.code,
    category: row.category as CouponCategory,
    originalValue: Number(row.original_value),
    purchaseCost: Number(row.purchase_cost),
    currentBalance: Number(row.current_balance),
    expiryDate: row.expiry_date,
    status: row.status as CouponStatus,
    description: row.description ?? undefined,
    cardNumber: row.card_number ?? undefined,
    cardExpiry: row.card_expiry ?? undefined,
    cardCvv: row.card_cvv ?? undefined,
    redemptions: row.redemptions ?? [],
    createdAt: row.created_at,
  };
}

function couponToRow(coupon: Coupon, userId: string) {
  return {
    id: coupon.id,
    user_id: userId,
    brand: coupon.brand,
    coupon_type: coupon.couponType,
    code: coupon.code,
    category: coupon.category,
    original_value: coupon.originalValue,
    purchase_cost: coupon.purchaseCost,
    current_balance: coupon.currentBalance,
    expiry_date: coupon.expiryDate,
    status: coupon.status,
    description: coupon.description ?? null,
    card_number: coupon.cardNumber ?? null,
    card_expiry: coupon.cardExpiry ?? null,
    card_cvv: coupon.cardCvv ?? null,
    redemptions: coupon.redemptions,
    created_at: coupon.createdAt,
  };
}

// ── CRUD operations ───────────────────────────────────────────────

export async function fetchCoupons(supabase: SupabaseClient): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToCoupon);
}

export async function insertCoupon(
  supabase: SupabaseClient,
  coupon: Coupon,
  userId: string
): Promise<Coupon> {
  const row = couponToRow(coupon, userId);
  const { data, error } = await supabase
    .from("coupons")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return rowToCoupon(data);
}

export async function updateCoupon(
  supabase: SupabaseClient,
  coupon: Coupon,
  userId: string
): Promise<Coupon> {
  const row = couponToRow(coupon, userId);
  const { data, error } = await supabase
    .from("coupons")
    .update(row)
    .eq("id", coupon.id)
    .select()
    .single();

  if (error) throw error;
  return rowToCoupon(data);
}

export async function deleteCoupon(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw error;
}
