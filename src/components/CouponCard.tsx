"use client";

import { useState } from "react";
import { AlertTriangle, Tag, Zap, CheckCircle, Eye, EyeOff, CreditCard, FileText, Pencil, Trash2 } from "lucide-react";
import { Coupon } from "@/types/coupon";
import {
  formatCurrency,
  daysUntilExpiry,
  isExpiringSoon,
  isExpired,
  getSavings,
  getBalancePercent,
  getBrandColors,
  getBrandInitial,
} from "@/lib/coupon-utils";

interface CouponCardProps {
  coupon: Coupon;
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

const CARD_GRADIENTS: Record<string, string> = {
  קניות: "from-indigo-500 to-violet-600",
  אוכל:  "from-orange-500 to-red-500",
  אופנה: "from-pink-500 to-rose-500",
  פנאי:  "from-teal-500 to-cyan-600",
  אחר:   "from-gray-500 to-slate-600",
};

function BalanceBar({ percent }: { percent: number }) {
  const color =
    percent > 60 ? "bg-emerald-500" : percent >= 30 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.max(2, percent)}%` }}
      />
    </div>
  );
}

function CardFace({ coupon }: { coupon: Coupon }) {
  const [show, setShow] = useState(false);
  const gradient = CARD_GRADIENTS[coupon.category] ?? CARD_GRADIENTS["אחר"];
  const last4 = coupon.cardNumber?.slice(-4) ?? "????";
  const maskedNum = `•••• •••• •••• ${last4}`;
  const fullNum = coupon.cardNumber?.replace(/(.{4})/g, "$1 ").trim() ?? "";

  return (
    <div className={`relative rounded-xl p-4 mb-3 bg-gradient-to-br ${gradient} text-white overflow-hidden select-none`}>
      <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <CreditCard size={18} className="opacity-70" />
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
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
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
  const brandColors = getBrandColors(coupon.brand);
  const initial = getBrandInitial(coupon.brand);
  const categoryColor = CATEGORY_COLORS[coupon.category] ?? CATEGORY_COLORS["אחר"];

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

  return (
    <div className={`
      bg-white rounded-2xl border overflow-hidden transition-all duration-200
      hover:shadow-md hover:-translate-y-0.5
      ${expiringSoon && !expired ? "border-amber-200 shadow-amber-50" : "border-gray-100"}
      ${expired ? "opacity-55" : "shadow-sm"}
    `}>
      {/* Accent stripe */}
      <div className={`h-1 ${
        expired ? "bg-gray-200" : expiringSoon ? "bg-amber-400" : "bg-indigo-500"
      }`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Initial avatar */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${brandColors.bg} ${brandColors.text}`}>
              {initial}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{coupon.brand}</h3>
              <span className={`inline-block mt-0.5 text-[11px] px-1.5 py-0.5 rounded-md font-medium ${categoryColor}`}>
                {coupon.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {expired ? (
              <span className="flex items-center gap-1 text-[11px] font-medium bg-red-50 text-red-500 px-2 py-1 rounded-full">
                <AlertTriangle size={10} />פג תוקף
              </span>
            ) : expiringSoon ? (
              <span className="flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
                <AlertTriangle size={10} />
                {days === 0 ? "היום!" : `${days} ימים`}
              </span>
            ) : (
              <span className="text-[11px] text-gray-400">
                {new Date(coupon.expiryDate).toLocaleDateString("he-IL")}
              </span>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(coupon)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                aria-label="ערוך קופון"
              >
                <Pencil size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="מחק קופון"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-xl p-3 text-right">
            <p className="text-xs font-medium text-red-700 mb-2">האם למחוק את הקופון?</p>
            <div className="flex gap-2">
              <button
                onClick={() => onDelete?.(coupon.id)}
                className="flex-1 bg-red-500 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-red-600 transition-colors"
              >
                מחק
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-white text-gray-600 text-xs font-semibold py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        {coupon.description && (
          <div className="flex items-start gap-1.5 mb-3 bg-gray-50 rounded-lg px-2.5 py-2">
            <FileText size={12} className="flex-shrink-0 text-gray-400 mt-0.5" />
            <span className="text-xs text-gray-600 leading-relaxed">{coupon.description}</span>
          </div>
        )}

        {/* Card face or barcode */}
        {coupon.couponType === "card" ? (
          <CardFace coupon={coupon} />
        ) : (
          <div className="flex items-center gap-1.5 mb-3">
            <Tag size={11} className="flex-shrink-0 text-gray-400" />
            <span className="font-mono text-xs text-gray-500 tracking-wider">{coupon.code}</span>
          </div>
        )}

        {/* Balance */}
        <div className="mb-3">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs text-gray-400">יתרה</span>
            <div className="text-right">
              <span className="text-base font-bold text-indigo-600">{formatCurrency(coupon.currentBalance)}</span>
              <span className="text-xs text-gray-300 font-normal"> / {formatCurrency(coupon.originalValue)}</span>
            </div>
          </div>
          <BalanceBar percent={percent} />
          <div className="flex justify-between text-[11px] text-gray-400 mt-1">
            <span>נרכש {new Date(coupon.createdAt).toLocaleDateString("he-IL")}</span>
            <span>{percent}%</span>
          </div>
        </div>

        {/* Savings badge */}
        {savings > 0 && (
          <div className="flex items-center gap-1 mb-3 text-xs text-emerald-600 font-medium">
            <CheckCircle size={11} />
            חסכת {formatCurrency(savings)}
            <span className="text-gray-300 font-normal">· שילמת {formatCurrency(coupon.purchaseCost)}</span>
          </div>
        )}

        {/* Redeem */}
        {!redeemOpen ? (
          <button
            onClick={() => !expired && setRedeemOpen(true)}
            disabled={expired || coupon.currentBalance <= 0}
            className={`
              w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
              transition-all duration-150 active:scale-[0.98]
              ${expired || coupon.currentBalance <= 0
                ? "bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100"
                : justRedeemed
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200"
              }
            `}
          >
            <Zap size={14} />
            {justRedeemed ? "עודכן בהצלחה!" : "מימוש מהיר"}
          </button>
        ) : (
          <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <p className="text-xs font-medium text-indigo-700 mb-2">כמה השתמשת? (₪)</p>
            <input
              type="number"
              min="1"
              max={coupon.currentBalance}
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleConfirmRedeem()}
              placeholder={`עד ${formatCurrency(coupon.currentBalance)}`}
              autoFocus
              className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-right mb-2"
            />
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleConfirmRedeem}
                className="flex-1 bg-indigo-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all"
              >
                אשר מימוש
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-white text-gray-500 text-xs font-semibold py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
