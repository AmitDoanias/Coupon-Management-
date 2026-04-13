"use server";

/**
 * Server Actions for coupon CRUD.
 * Runs exclusively on the server — encryption key never reaches the browser.
 * Auth is verified server-side via Supabase session (not passed from client).
 * All input is validated server-side before any DB write.
 */

import { createClient } from "@/lib/supabase/server";
import {
  fetchCoupons,
  insertCoupon,
  updateCoupon,
  deleteCoupon,
} from "@/lib/supabase/coupons-db";
import { encryptField, decryptField } from "@/lib/crypto";
import { Coupon } from "@/types/coupon";

// ── Validation ────────────────────────────────────────────────────

const VALID_CATEGORIES = ["קניות", "אוכל", "אופנה", "פנאי", "אחר"] as const;
const VALID_TYPES      = ["barcode", "card"] as const;
const VALID_STATUSES   = ["active", "archived"] as const;

function validateCoupon(coupon: Coupon, isNew: boolean): void {
  const errors: string[] = [];

  // Brand
  if (!coupon.brand?.trim()) errors.push("שם מותג חובה");

  // Type
  if (!VALID_TYPES.includes(coupon.couponType as typeof VALID_TYPES[number]))
    errors.push("סוג קופון לא תקין");

  // Category
  if (!VALID_CATEGORIES.includes(coupon.category as typeof VALID_CATEGORIES[number]))
    errors.push("קטגוריה לא תקינה");

  // Status
  if (!VALID_STATUSES.includes(coupon.status as typeof VALID_STATUSES[number]))
    errors.push("סטטוס לא תקין");

  // Original value
  if (!isFinite(coupon.originalValue) || coupon.originalValue <= 0)
    errors.push("ערך נקוב חייב להיות חיובי");

  // Purchase cost
  if (!isFinite(coupon.purchaseCost) || coupon.purchaseCost < 0)
    errors.push("עלות רכישה לא תקינה");
  if (coupon.purchaseCost > coupon.originalValue)
    errors.push("עלות רכישה לא יכולה לעלות על הערך הנקוב");

  // Current balance
  if (!isFinite(coupon.currentBalance) || coupon.currentBalance < 0)
    errors.push("יתרה לא תקינה");
  if (coupon.currentBalance > coupon.originalValue)
    errors.push("יתרה לא יכולה לעלות על הערך הנקוב");

  // Expiry date
  if (!coupon.expiryDate) {
    errors.push("תאריך תפוגה חובה");
  } else {
    const expiry = new Date(coupon.expiryDate);
    if (isNaN(expiry.getTime())) errors.push("תאריך תפוגה לא תקין");
    else if (isNew) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiry < today) errors.push("תאריך התפוגה כבר עבר");
    }
  }

  // Barcode-specific
  if (coupon.couponType === "barcode") {
    if (!coupon.code?.trim()) errors.push("קוד קופון חובה לסוג ברקוד");
  }

  // Card-specific
  if (coupon.couponType === "card") {
    const digits = (coupon.cardNumber ?? "").replace(/\s/g, "");
    if (digits.length !== 16 || !/^\d{16}$/.test(digits))
      errors.push("מספר כרטיס חייב להכיל 16 ספרות");
    if (!/^\d{2}\/\d{2}$/.test(coupon.cardExpiry ?? ""))
      errors.push("תוקף כרטיס לא תקין (MM/YY)");
    if (!/^\d{3}$/.test(coupon.cardCvv ?? ""))
      errors.push("CVV חייב להיות 3 ספרות");
  }

  if (errors.length > 0) throw new Error(errors.join(" | "));
}

// ── Helpers ───────────────────────────────────────────────────────

async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

/** Encrypts card fields before writing to DB. */
function encryptCoupon(coupon: Coupon): Coupon {
  if (coupon.couponType !== "card") return coupon;
  return {
    ...coupon,
    cardNumber: encryptField(coupon.cardNumber),
    cardExpiry: encryptField(coupon.cardExpiry),
    cardCvv:    encryptField(coupon.cardCvv),
  };
}

/** Decrypts card fields after reading from DB. */
function decryptCoupon(coupon: Coupon): Coupon {
  if (coupon.couponType !== "card") return coupon;
  return {
    ...coupon,
    cardNumber: decryptField(coupon.cardNumber),
    cardExpiry: decryptField(coupon.cardExpiry),
    cardCvv:    decryptField(coupon.cardCvv),
  };
}

// ── Actions ───────────────────────────────────────────────────────

export async function fetchCouponsAction(): Promise<Coupon[]> {
  const { supabase } = await getSession();
  const rows = await fetchCoupons(supabase);
  return rows.map(decryptCoupon);
}

export async function insertCouponAction(coupon: Coupon): Promise<Coupon> {
  validateCoupon(coupon, true);
  const { supabase, userId } = await getSession();
  const saved = await insertCoupon(supabase, encryptCoupon(coupon), userId);
  return decryptCoupon(saved);
}

export async function updateCouponAction(coupon: Coupon): Promise<Coupon> {
  validateCoupon(coupon, false);
  const { supabase, userId } = await getSession();
  const saved = await updateCoupon(supabase, encryptCoupon(coupon), userId);
  return decryptCoupon(saved);
}

export async function deleteCouponAction(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("מזהה קופון חסר");
  const { supabase } = await getSession();
  await deleteCoupon(supabase, id);
}
