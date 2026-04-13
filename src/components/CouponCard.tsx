"use client";

import { useState } from "react";
import { Coupon } from "@/types/coupon";
import {
  formatCurrency,
  daysUntilExpiry,
  isExpiringSoon,
  isExpired,
  getSavings,
  getBalancePercent,
} from "@/lib/coupon-utils";

interface CouponCardProps {
  coupon: Coupon;
  onRedeem: (id: string, amount: number) => void;
  onEdit?: (coupon: Coupon) => void;
  onDelete?: (id: string) => void;
}

const CARD_GRADIENTS: Record<string, string> = {
  קניות: "from-indigo-500 to-violet-600",
  אוכל:  "from-orange-500 to-red-500",
  אופנה: "from-pink-500 to-rose-500",
  פנאי:  "from-teal-500 to-cyan-600",
  אחר:   "from-gray-500 to-slate-600",
};

function CardFace({ coupon }: { coupon: Coupon }) {
  const [show, setShow] = useState(false);
  const gradient = CARD_GRADIENTS[coupon.category] ?? CARD_GRADIENTS["אחר"];
  const last4 = coupon.cardNumber?.slice(-4) ?? "????";
  const maskedNum = `•••• •••• •••• ${last4}`;
  const fullNum = coupon.cardNumber?.replace(/(.{4})/g, "$1 ").trim() ?? "";

  return (
    <div className={`relative rounded-xl p-4 mb-4 bg-gradient-to-br ${gradient} text-white overflow-hidden select-none`}>
      <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="material-symbols-outlined text-white/70 text-lg">credit_card</span>
          <span className="text-xs opacity-60 font-medium">{coupon.brand}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-sm tracking-widest opacity-90">
            {show ? fullNum : maskedNum}
          </span>
          <button
            onClick={() => setShow(v => !v)}
            className="opacity-60 hover:opacity-100 transition-opacity p-1"
            aria-label={show ? "הסתר פרטים" : "הצג פרטים"}
          >
            <span className="material-symbols-outlined text-sm">
              {show ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
        <div className="flex gap-5 text-xs opacity-70">
          <div>
            <div className="text-[10px] opacity-70 mb-0.5">תוקף</div>
            <span className="font-mono">{coupon.cardExpiry}</span>
          </div>
          <div>
            <div className="text-[10px] opacity-70 mb-0.5">CVV</div>
            <span className="font-mono">{show ? coupon.cardCvv : "•••"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CouponCard({ coupon, onRedeem, onEdit, onDelete }: CouponCardProps) {
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [justRedeemed, setJustRedeemed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const days = daysUntilExpiry(coupon.expiryDate);
  const expiringSoon = isExpiringSoon(coupon.expiryDate);
  const expired = isExpired(coupon.expiryDate);
  const savings = getSavings(coupon);
  const percent = getBalancePercent(coupon);

  function handleConfirmRedeem() {
    const amount = parseFloat(inputValue);
    if (isNaN(amount) || amount <= 0) { setError("יש להזין סכום חיובי"); return; }
    if (amount > coupon.currentBalance) {
      setError(`הסכום גבוה מהיתרה (${formatCurrency(coupon.currentBalance)})`);
      return;
    }
    onRedeem(coupon.id, amount);
    setRedeemOpen(false);
    setInputValue("");
    setError("");
    setJustRedeemed(true);
    setTimeout(() => setJustRedeemed(false), 2000);
  }

  function handleCancel() {
    setRedeemOpen(false);
    setInputValue("");
    setError("");
  }

  // Badge config based on status
  const badgeConfig = expired
    ? { text: "פג תוקף", icon: "error", cls: "bg-tertiary-fixed/30 text-on-tertiary-fixed" }
    : expiringSoon
    ? { text: days === 0 ? "היום!" : `${days} ימים`, icon: "timer", cls: "bg-secondary-container/30 text-on-secondary-container" }
    : { text: "ACTIVE", icon: "check_circle", cls: "bg-secondary-container/30 text-on-secondary-container" };

  return (
    <div className={`bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_24px_rgba(25,28,30,0.04)] border border-outline-variant/15 hover:translate-y-[-4px] transition-transform duration-300 ${expired ? "opacity-60" : ""}`}>
      {/* Top row: badge + balance */}
      <div className="flex flex-row-reverse justify-between mb-4">
        <div className={`${badgeConfig.cls} px-3 py-1 rounded-full flex items-center gap-1`}>
          <span className="text-[10px] font-bold uppercase">{badgeConfig.text}</span>
          <span className="material-symbols-outlined text-xs">{badgeConfig.icon}</span>
        </div>
        <span className="text-2xl font-black text-on-surface">{formatCurrency(coupon.currentBalance)}</span>
      </div>

      {/* Title */}
      <h4 className="text-lg font-bold mb-2 text-right">{coupon.brand}</h4>
      {coupon.description && (
        <p className="text-xs text-outline mb-3 text-right">{coupon.description}</p>
      )}

      {/* Card face or barcode */}
      {coupon.couponType === "card" ? (
        <CardFace coupon={coupon} />
      ) : coupon.code ? (
        <div className="flex items-center gap-2 mb-4 bg-surface-container-low px-3 py-2 rounded-lg">
          <span className="material-symbols-outlined text-outline text-sm">qr_code</span>
          <span className="font-mono text-xs text-on-surface-variant tracking-wider">{coupon.code.replace(/(.{4})(?=.)/g, "$1-")}</span>
        </div>
      ) : null}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mb-4 bg-error-container border border-error/20 rounded-xl p-3 text-right">
          <p className="text-xs font-medium text-error mb-2">האם למחוק את הקופון?</p>
          <div className="flex gap-2">
            <button
              onClick={() => onDelete?.(coupon.id)}
              className="flex-1 bg-error text-on-error text-xs font-semibold py-1.5 rounded-lg transition-colors"
            >
              מחק
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 bg-white text-on-surface-variant text-xs font-semibold py-1.5 rounded-lg border border-outline-variant/30 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-2 mb-6">
        <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.max(2, percent)}%` }}
          />
        </div>
        <div className="flex flex-row-reverse justify-between text-xs text-outline font-medium">
          <span>נוצלו {formatCurrency(coupon.originalValue - coupon.currentBalance)}</span>
          <span>נותרו {formatCurrency(coupon.currentBalance)}</span>
        </div>
      </div>

      {/* Savings badge */}
      {savings > 0 && (
        <div className="flex items-center gap-2 mb-4 bg-secondary-container/20 border border-secondary/10 rounded-lg px-3 py-2">
          <span className="material-symbols-outlined text-on-secondary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          <span className="text-xs font-bold text-on-secondary-container">חסכת {formatCurrency(savings)}</span>
        </div>
      )}

      {/* Actions (edit/delete) */}
      {(onEdit || onDelete) && (
        <div className="flex flex-row-reverse gap-1 mb-3">
          {onEdit && (
            <button onClick={() => onEdit(coupon)} className="p-1.5 rounded-lg text-outline hover:text-primary transition-colors" aria-label="ערוך">
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
          )}
          {onDelete && (
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-outline hover:text-error transition-colors" aria-label="מחק">
              <span className="material-symbols-outlined text-base">delete</span>
            </button>
          )}
        </div>
      )}

      {/* Redeem button */}
      {!redeemOpen ? (
        <button
          onClick={() => !expired && setRedeemOpen(true)}
          disabled={expired || coupon.currentBalance <= 0}
          className={`w-full py-3 rounded-md font-bold transition-all ${
            expired || coupon.currentBalance <= 0
              ? "bg-surface-container-low text-outline cursor-not-allowed"
              : justRedeemed
              ? "bg-secondary-container/30 text-on-secondary-container"
              : "bg-surface-container-high text-on-primary-fixed-variant hover:bg-primary hover:text-white"
          }`}
        >
          {justRedeemed ? "עודכן בהצלחה!" : "מימוש קופון"}
        </button>
      ) : (
        <div className="bg-primary-fixed rounded-xl p-3 border border-primary/15">
          <p className="text-xs font-bold text-primary mb-2 text-right">כמה השתמשת? (₪)</p>
          <input
            type="number"
            min="1"
            max={coupon.currentBalance}
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleConfirmRedeem()}
            placeholder={`עד ${formatCurrency(coupon.currentBalance)}`}
            autoFocus
            className="w-full bg-surface-container-lowest border border-primary/20 rounded-lg px-3 py-2 text-sm text-on-surface text-right focus:outline-none focus:ring-2 focus:ring-primary/30 mb-2"
          />
          {error && <p className="text-xs text-error mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleConfirmRedeem}
              className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg active:scale-95 transition-all"
            >
              אשר מימוש
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-surface-container-lowest text-on-surface-variant text-xs font-bold py-2 rounded-lg transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
