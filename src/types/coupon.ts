export type CouponCategory = 'אוכל' | 'אופנה' | 'פנאי' | 'קניות' | 'אחר';
export type CouponStatus = 'active' | 'archived';
export type CouponType = 'barcode' | 'card';

export interface RedemptionRecord {
  id: string;
  date: string;   // ISO date string
  amount: number;
  note?: string;
}

export interface Coupon {
  id: string;
  brand: string;
  couponType: CouponType;
  code: string;             // barcode string (empty string for card type)
  category: CouponCategory;
  originalValue: number;    // face value in ₪
  purchaseCost: number;     // what user paid (for savings calc)
  currentBalance: number;   // remaining balance
  expiryDate: string;       // YYYY-MM-DD
  status: CouponStatus;
  imageUrl?: string;
  redemptions: RedemptionRecord[];
  createdAt: string;        // YYYY-MM-DD
  description?: string;     // optional: what this coupon is for (e.g. "ארוחת ביג מק רויאל")
  // Card-type fields (only when couponType === 'card')
  cardNumber?: string;      // 16 digit string, no spaces
  cardExpiry?: string;      // MM/YY
  cardCvv?: string;         // 3 digits
}
