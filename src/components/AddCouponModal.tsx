"use client";

import { useState } from "react";
import { X, CreditCard, Tag, ChevronDown } from "lucide-react";
import { Coupon, CouponCategory, CouponType } from "@/types/coupon";

interface AddCouponModalProps {
  onClose: () => void;
  onAdd?: (coupon: Coupon) => void;
  onUpdate?: (coupon: Coupon) => void;
  initialCoupon?: Coupon;
}

const CATEGORIES: CouponCategory[] = ["קניות", "אוכל", "אופנה", "פנאי", "אחר"];

function formatCardDisplay(raw: string): string {
  return raw.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}

export default function AddCouponModal({ onClose, onAdd, onUpdate, initialCoupon }: AddCouponModalProps) {
  const isEdit = !!initialCoupon;

  const [couponType, setCouponType] = useState<CouponType>(initialCoupon?.couponType ?? "barcode");
  const [brand, setBrand] = useState(initialCoupon?.brand ?? "");
  const [category, setCategory] = useState<CouponCategory>(initialCoupon?.category ?? "קניות");
  const [code, setCode] = useState(initialCoupon?.code ?? "");
  const [description, setDescription] = useState(initialCoupon?.description ?? "");
  const [cardNumber, setCardNumber] = useState(
    initialCoupon?.cardNumber ? formatCardDisplay(initialCoupon.cardNumber) : ""
  );
  const [cardExpiry, setCardExpiry] = useState(initialCoupon?.cardExpiry ?? "");
  const [cardCvv, setCardCvv] = useState(initialCoupon?.cardCvv ?? "");
  const [originalValue, setOriginalValue] = useState(initialCoupon?.originalValue.toString() ?? "");
  const [purchaseCost, setPurchaseCost] = useState(initialCoupon?.purchaseCost.toString() ?? "");
  const [currentBalance, setCurrentBalance] = useState(initialCoupon?.currentBalance.toString() ?? "");
  const [expiryDate, setExpiryDate] = useState(initialCoupon?.expiryDate ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!brand.trim()) e.brand = "שם מותג חובה";
    if (!originalValue || parseFloat(originalValue) <= 0) e.originalValue = "ערך נקוב חובה";
    if (!purchaseCost || parseFloat(purchaseCost) <= 0) e.purchaseCost = "עלות רכישה חובה";
    if (parseFloat(purchaseCost) > parseFloat(originalValue))
      e.purchaseCost = "עלות לא יכולה לעלות על הערך הנקוב";
    if (isEdit) {
      const bal = parseFloat(currentBalance);
      if (isNaN(bal) || bal < 0) e.currentBalance = "יתרה לא תקינה";
      if (bal > parseFloat(originalValue)) e.currentBalance = "יתרה לא יכולה לעלות על הערך הנקוב";
    }
    if (!expiryDate) e.expiryDate = "תאריך תפוגה חובה";
    if (couponType === "barcode" && !code.trim()) e.code = "קוד קופון חובה";
    if (couponType === "card") {
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length !== 16) e.cardNumber = "מספר כרטיס חייב להכיל 16 ספרות";
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) e.cardExpiry = "פורמט MM/YY";
      if (!/^\d{3}$/.test(cardCvv)) e.cardCvv = "CVV חייב להיות 3 ספרות";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const bal = isEdit ? parseFloat(currentBalance) : parseFloat(originalValue);

    const couponData: Coupon = {
      id: initialCoupon?.id ?? crypto.randomUUID(),
      brand: brand.trim(),
      couponType,
      code: couponType === "barcode" ? code.trim() : "",
      category,
      originalValue: parseFloat(originalValue),
      purchaseCost: parseFloat(purchaseCost),
      currentBalance: bal,
      expiryDate,
      status: bal <= 0 ? "archived" : (initialCoupon?.status ?? "active"),
      description: description.trim() || undefined,
      redemptions: initialCoupon?.redemptions ?? [],
      createdAt: initialCoupon?.createdAt ?? new Date().toISOString().split("T")[0],
      ...(couponType === "card" && {
        cardNumber: cardNumber.replace(/\s/g, ""),
        cardExpiry,
        cardCvv,
      }),
    };

    if (isEdit) {
      onUpdate?.(couponData);
    } else {
      onAdd?.(couponData);
    }
    onClose();
  }

  function handleCardNumberChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    setCardNumber(formatCardDisplay(digits));
  }

  function handleCardExpiryChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardExpiry(digits);
    }
  }

  const inputClass = (field: string) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 text-right transition-colors ${
      errors[field]
        ? "border-red-300 focus:ring-red-300"
        : "border-gray-200 focus:ring-indigo-300 focus:border-indigo-400"
    }`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[92dvh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={18} />
          </button>
          <h2 className="font-bold text-gray-900 text-lg">
            {isEdit ? "עריכת קופון" : "הוספת קופון חדש"}
          </h2>
          <div className="w-8" />
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Coupon type toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              סוג קופון
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCouponType("card")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  couponType === "card"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                }`}
              >
                <CreditCard size={15} />
                כרטיס
              </button>
              <button
                type="button"
                onClick={() => setCouponType("barcode")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  couponType === "barcode"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                }`}
              >
                <Tag size={15} />
                ברקוד / קוד
              </button>
            </div>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
              שם מותג / רשת
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="למשל: BuyMe, תו הזהב, זארה"
              className={inputClass("brand")}
            />
            {errors.brand && <p className="text-xs text-red-500 mt-1 text-right">{errors.brand}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
              קטגוריה
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CouponCategory)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-right appearance-none cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Description (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
              למה מיועד הקופון?
              <span className="text-gray-400 font-normal text-xs me-1">(אופציונלי)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="למשל: ארוחת ביג מק רויאל + גלידה"
              className={inputClass("description")}
            />
          </div>

          {/* Barcode fields */}
          {couponType === "barcode" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                קוד קופון
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="למשל: BUYME2024"
                className={inputClass("code")}
              />
              {errors.code && <p className="text-xs text-red-500 mt-1 text-right">{errors.code}</p>}
            </div>
          )}

          {/* Card fields */}
          {couponType === "card" && (
            <div className="space-y-3 bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
              <div>
                <label className="block text-sm font-medium text-indigo-800 mb-1.5 text-right">
                  מספר כרטיס
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  placeholder="•••• •••• •••• ••••"
                  className={`${inputClass("cardNumber")} font-mono tracking-widest`}
                />
                {errors.cardNumber && (
                  <p className="text-xs text-red-500 mt-1 text-right">{errors.cardNumber}</p>
                )}
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-indigo-800 mb-1.5 text-right">
                    תוקף (MM/YY)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardExpiry}
                    onChange={(e) => handleCardExpiryChange(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className={`${inputClass("cardExpiry")} font-mono`}
                  />
                  {errors.cardExpiry && (
                    <p className="text-xs text-red-500 mt-1 text-right">{errors.cardExpiry}</p>
                  )}
                </div>
                <div className="w-28">
                  <label className="block text-sm font-medium text-indigo-800 mb-1.5 text-right">
                    CVV
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="•••"
                    maxLength={3}
                    className={`${inputClass("cardCvv")} font-mono`}
                  />
                  {errors.cardCvv && (
                    <p className="text-xs text-red-500 mt-1 text-right">{errors.cardCvv}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Values row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                ערך נקוב (₪)
              </label>
              <input
                type="number"
                min="1"
                value={originalValue}
                onChange={(e) => setOriginalValue(e.target.value)}
                placeholder="200"
                className={inputClass("originalValue")}
              />
              {errors.originalValue && (
                <p className="text-xs text-red-500 mt-1 text-right">{errors.originalValue}</p>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                שילמת (₪)
              </label>
              <input
                type="number"
                min="1"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                placeholder="160"
                className={inputClass("purchaseCost")}
              />
              {errors.purchaseCost && (
                <p className="text-xs text-red-500 mt-1 text-right">{errors.purchaseCost}</p>
              )}
            </div>
          </div>

          {/* Current balance (edit mode only) */}
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                יתרה נוכחית (₪)
              </label>
              <input
                type="number"
                min="0"
                max={originalValue}
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                placeholder="120"
                className={inputClass("currentBalance")}
              />
              {errors.currentBalance && (
                <p className="text-xs text-red-500 mt-1 text-right">{errors.currentBalance}</p>
              )}
            </div>
          )}

          {/* Expiry date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
              תאריך תפוגה
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className={inputClass("expiryDate")}
            />
            {errors.expiryDate && (
              <p className="text-xs text-red-500 mt-1 text-right">{errors.expiryDate}</p>
            )}
          </div>

          {/* Savings preview */}
          {originalValue && purchaseCost && parseFloat(purchaseCost) < parseFloat(originalValue) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 text-right">
              ✅ תחסוך{" "}
              <strong>
                ₪{(parseFloat(originalValue) - parseFloat(purchaseCost)).toFixed(0)}
              </strong>{" "}
              ({Math.round((1 - parseFloat(purchaseCost) / parseFloat(originalValue)) * 100)}% הנחה)
            </div>
          )}

          <div className="h-2" />
        </div>

        {/* Sticky submit */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white">
          <button
            onClick={handleSubmit}
            className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all text-base shadow-sm"
          >
            {isEdit ? "עדכן קופון" : "הוסף קופון"}
          </button>
        </div>
      </div>
    </>
  );
}
