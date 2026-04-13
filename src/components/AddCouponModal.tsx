"use client";

import { useState } from "react";
import { Coupon, CouponCategory, CouponType } from "@/types/coupon";

interface AddCouponModalProps {
  onClose: () => void;
  onAdd?: (coupon: Coupon) => void;
  onUpdate?: (coupon: Coupon) => void;
  initialCoupon?: Coupon;
}

const CATEGORIES: CouponCategory[] = ["קניות", "אוכל", "אופנה", "פנאי", "אחר"];

const QUICK_ADD_PRESETS = [
  { label: "BuyMe",       brand: "BuyMe",       couponType: "barcode" as CouponType, category: "קניות" as CouponCategory, description: "כרטיס מתנה BuyMe" },
  { label: "Love Gift",   brand: "Love Gift",   couponType: "barcode" as CouponType, category: "קניות" as CouponCategory, description: "כרטיס מתנה Love Gift" },
  { label: "רמי לוי",     brand: "רמי לוי",     couponType: "barcode" as CouponType, category: "קניות" as CouponCategory, description: "כרטיס מתנה רמי לוי" },
];

function formatCardDisplay(raw: string): string {
  return raw.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}

function formatBarcodeDisplay(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits.replace(/(.{4})(?=.)/g, "$1-");
}

export default function AddCouponModal({ onClose, onAdd, onUpdate, initialCoupon }: AddCouponModalProps) {
  const isEdit = !!initialCoupon;

  const [couponType, setCouponType] = useState<CouponType>(initialCoupon?.couponType ?? "barcode");
  const [brand, setBrand] = useState(initialCoupon?.brand ?? "");
  const [category, setCategory] = useState<CouponCategory>(initialCoupon?.category ?? "קניות");
  const [code, setCode] = useState(initialCoupon?.code ? formatBarcodeDisplay(initialCoupon.code) : "");
  const [description, setDescription] = useState(initialCoupon?.description ?? "");
  const [cardNumber, setCardNumber] = useState(initialCoupon?.cardNumber ? formatCardDisplay(initialCoupon.cardNumber) : "");
  const [cardExpiry, setCardExpiry] = useState(initialCoupon?.cardExpiry ?? "");
  const [cardCvv, setCardCvv] = useState(initialCoupon?.cardCvv ?? "");
  const [originalValue, setOriginalValue] = useState(initialCoupon?.originalValue.toString() ?? "");
  const [purchaseCost, setPurchaseCost] = useState(initialCoupon?.purchaseCost.toString() ?? "");
  const [currentBalance, setCurrentBalance] = useState(initialCoupon?.currentBalance.toString() ?? "");
  const [expiryDate, setExpiryDate] = useState(initialCoupon?.expiryDate ?? "");
  const [isGift, setIsGift] = useState(initialCoupon?.isGift ?? false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function applyPreset(preset: typeof QUICK_ADD_PRESETS[0]) {
    setBrand(preset.brand);
    setCouponType(preset.couponType);
    setCategory(preset.category);
    setDescription(preset.description);
    setSelectedPreset(preset.label);
  }

  function handleGiftToggle() {
    const newVal = !isGift;
    setIsGift(newVal);
    if (newVal) setPurchaseCost("0");
    else setPurchaseCost("");
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!brand.trim()) e.brand = "שם מותג חובה";
    if (!originalValue || parseFloat(originalValue) <= 0) e.originalValue = "ערך נקוב חובה";
    if (!isGift) {
      if (!purchaseCost || parseFloat(purchaseCost) <= 0) e.purchaseCost = "עלות רכישה חובה";
    }
    if (parseFloat(purchaseCost) > parseFloat(originalValue))
      e.purchaseCost = "עלות לא יכולה לעלות על הערך הנקוב";
    if (isEdit) {
      const bal = parseFloat(currentBalance);
      if (isNaN(bal) || bal < 0) e.currentBalance = "יתרה לא תקינה";
      if (bal > parseFloat(originalValue)) e.currentBalance = "יתרה לא יכולה לעלות על הערך הנקוב";
    }
    if (!expiryDate) {
      e.expiryDate = "תאריך תפוגה חובה";
    } else if (!isEdit) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(expiryDate) < today) e.expiryDate = "תאריך התפוגה כבר עבר";
    }
    if (couponType === "barcode" && !code.replace(/[^0-9]/g, "")) e.code = "קוד קופון חובה";
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
    const cost = isGift ? 0 : parseFloat(purchaseCost);
    const couponData: Coupon = {
      id: initialCoupon?.id ?? crypto.randomUUID(),
      brand: brand.trim(),
      couponType,
      code: couponType === "barcode" ? code.replace(/[^0-9]/g, "") : "",
      category,
      originalValue: parseFloat(originalValue),
      purchaseCost: cost,
      currentBalance: bal,
      expiryDate,
      status: bal <= 0 ? "archived" : (initialCoupon?.status ?? "active"),
      isGift,
      description: description.trim() || undefined,
      redemptions: initialCoupon?.redemptions ?? [],
      createdAt: initialCoupon?.createdAt ?? new Date().toISOString().split("T")[0],
      ...(couponType === "card" && { cardNumber: cardNumber.replace(/\s/g, ""), cardExpiry, cardCvv }),
    };
    if (isEdit) onUpdate?.(couponData);
    else onAdd?.(couponData);
    onClose();
  }

  function handleCardNumberChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    setCardNumber(formatCardDisplay(digits));
  }

  function handleCardExpiryChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    else setCardExpiry(digits);
  }

  const inputCls = (field: string) =>
    `w-full bg-surface-container-low border-none rounded-md px-4 py-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all text-right ${
      errors[field] ? "ring-2 ring-error/30" : ""
    }`;

  const savings = originalValue && purchaseCost && !isGift
    ? parseFloat(originalValue) - parseFloat(purchaseCost)
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-on-surface/10 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50">
        <div
          className="relative z-50 w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-[0_-12px_32px_rgba(25,28,30,0.06)] overflow-hidden flex flex-col md:max-h-[90vh]"
          style={{ maxHeight: "92dvh" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex flex-row-reverse justify-between items-center px-8 py-6 border-b border-outline-variant/15">
            <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h1 className="text-2xl font-black text-primary leading-[1.5]">
              {isEdit ? "עריכת קופון" : "קופון חדש"}
            </h1>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
            {/* Preset Brand Chips */}
            {!isEdit && (
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-on-surface-variant tracking-wide">מותגים נפוצים</h3>
                <div className="flex flex-wrap gap-3">
                  {QUICK_ADD_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`px-5 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                        selectedPreset === preset.label
                          ? "bg-primary-fixed text-primary font-bold"
                          : "bg-surface-container-low hover:bg-primary-fixed text-on-surface"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${selectedPreset === preset.label ? "bg-primary" : "bg-outline-variant"}`} />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Type Toggle */}
            <div className="bg-surface-container-low p-1.5 rounded-full flex w-fit self-end">
              <button
                type="button"
                onClick={() => setCouponType("card")}
                className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${
                  couponType === "card"
                    ? "bg-surface-container-lowest shadow-sm text-primary"
                    : "text-on-surface-variant"
                }`}
              >
                כרטיס
              </button>
              <button
                type="button"
                onClick={() => setCouponType("barcode")}
                className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${
                  couponType === "barcode"
                    ? "bg-surface-container-lowest shadow-sm text-primary"
                    : "text-on-surface-variant"
                }`}
              >
                ברקוד
              </button>
            </div>

            {/* Form Grid */}
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
              {/* Brand */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-bold text-on-surface mr-3">שם המותג / חנות</label>
                <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="לדוגמה: זארה, קפה נטו..." className={inputCls("brand")} />
                {errors.brand && <p className="text-xs text-error text-right">{errors.brand}</p>}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface mr-3">קטגוריה</label>
                <select value={category} onChange={e => setCategory(e.target.value as CouponCategory)} className="w-full bg-surface-container-low border-none rounded-md px-4 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 appearance-none text-right">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Code (barcode) */}
              {couponType === "barcode" && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface mr-3">מספר קופון / קוד</label>
                  <input type="text" value={code} onChange={e => setCode(formatBarcodeDisplay(e.target.value))} placeholder="0000-0000-0000" className={inputCls("code")} />
                  {errors.code && <p className="text-xs text-error text-right">{errors.code}</p>}
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface mr-3">תיאור <span className="text-outline text-xs font-normal">(אופציונלי)</span></label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="ארוחת ביג מק + גלידה" className={inputCls("description")} />
              </div>

              {/* Card fields */}
              {couponType === "card" && (
                <>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-bold text-on-surface mr-3">מספר כרטיס</label>
                    <input type="text" inputMode="numeric" value={cardNumber} onChange={e => handleCardNumberChange(e.target.value)} placeholder="•••• •••• •••• ••••" className={`${inputCls("cardNumber")} font-mono tracking-widest`} />
                    {errors.cardNumber && <p className="text-xs text-error text-right">{errors.cardNumber}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface mr-3">תוקף</label>
                    <div className="relative">
                      <input type="text" inputMode="numeric" value={cardExpiry} onChange={e => handleCardExpiryChange(e.target.value)} placeholder="MM/YY" maxLength={5} className={`${inputCls("cardExpiry")} font-mono`} />
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">calendar_today</span>
                    </div>
                    {errors.cardExpiry && <p className="text-xs text-error text-right">{errors.cardExpiry}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface mr-3">CVV / קוד סודי</label>
                    <input type="password" inputMode="numeric" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="***" maxLength={3} className={inputCls("cardCvv")} />
                    {errors.cardCvv && <p className="text-xs text-error text-right">{errors.cardCvv}</p>}
                  </div>
                </>
              )}

              {/* Face Value */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface mr-3">ערך נקוב (₪)</label>
                <input type="number" min="1" value={originalValue} onChange={e => setOriginalValue(e.target.value)} placeholder="200" className={inputCls("originalValue")} />
                {errors.originalValue && <p className="text-xs text-error text-right">{errors.originalValue}</p>}
              </div>

              {/* Cost */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface mr-3">כמה שילמת (₪)</label>
                <input type="number" min="0" value={purchaseCost} onChange={e => { if (!isGift) setPurchaseCost(e.target.value); }} placeholder={isGift ? "0" : "180"} disabled={isGift} className={`${inputCls("purchaseCost")} ${isGift ? "opacity-50 cursor-not-allowed" : ""}`} />
                {errors.purchaseCost && <p className="text-xs text-error text-right">{errors.purchaseCost}</p>}
              </div>

              {/* Gift Checkbox */}
              <div className="md:col-span-2 flex items-center gap-3 py-2 mr-1">
                <input type="checkbox" id="gift" checked={isGift} onChange={handleGiftToggle} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all" />
                <label className="text-on-surface font-medium" htmlFor="gift">קיבלתי במתנה</label>
              </div>

              {/* Current balance (edit only) */}
              {isEdit && (
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-on-surface mr-3">יתרה נוכחית (₪)</label>
                  <input type="number" min="0" max={originalValue} value={currentBalance} onChange={e => setCurrentBalance(e.target.value)} placeholder="120" className={inputCls("currentBalance")} />
                  {errors.currentBalance && <p className="text-xs text-error text-right">{errors.currentBalance}</p>}
                </div>
              )}

              {/* Expiry */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-bold text-on-surface mr-3">תאריך פקיעה</label>
                <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className={inputCls("expiryDate")} />
                {errors.expiryDate && <p className="text-xs text-error text-right">{errors.expiryDate}</p>}
              </div>
            </form>

            {/* Savings Preview */}
            {savings > 0 && (
              <div className="bg-secondary-container/20 rounded-md p-4 flex items-center justify-between border border-secondary/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <div>
                    <p className="text-on-secondary-container font-bold">חיסכון מתוכנן</p>
                    <p className="text-xs text-on-secondary-container/80">
                      חסכת ₪{savings.toFixed(0)} ברכישה זו ({Math.round((1 - parseFloat(purchaseCost) / parseFloat(originalValue)) * 100)}%)
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-black text-secondary leading-none">₪{savings.toFixed(0)}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="px-8 py-6 bg-surface-container-low flex flex-row-reverse gap-4">
            <button
              onClick={handleSubmit}
              className="gradient-btn text-on-primary px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex-1 md:flex-none"
            >
              {isEdit ? "עדכן קופון" : "הוסף קופון"}
            </button>
            <button
              onClick={onClose}
              className="text-on-surface-variant font-bold px-8 py-4 rounded-full hover:bg-surface-container-high transition-all flex-1 md:flex-none"
            >
              ביטול
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}
