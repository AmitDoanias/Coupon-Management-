"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Coupon, CouponCategory } from "@/types/coupon";
import { formatCurrency, getSavings, redeemFromCoupon, isExpired } from "@/lib/coupon-utils";
import { createClient } from "@/lib/supabase/client";
import { fetchCouponsAction, insertCouponAction, updateCouponAction, deleteCouponAction } from "@/app/actions/coupons";
import { signOut } from "@/app/auth/actions";
import BrandGroup from "@/components/BrandGroup";
import AddCouponModal from "@/components/AddCouponModal";
import BottomNav, { type TabId } from "@/components/BottomNav";
import DesktopSidebar from "@/components/DesktopSidebar";
import StatsView from "@/components/StatsView";
import Toast, { type ToastType } from "@/components/Toast";
import CouponCard from "@/components/CouponCard";

const ALL_CATEGORIES = "הכל";
const CATEGORIES: (CouponCategory | typeof ALL_CATEGORIES)[] = [
  ALL_CATEGORIES, "קניות", "אוכל", "אופנה", "פנאי", "אחר",
];

type SortOrder = "default" | "expiry-asc" | "expiry-desc";

export default function App() {
  const supabase = createClient();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<CouponCategory>>(new Set());
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  function showToast(message: string, type: ToastType) { setToast({ message, type }); }

  const supabaseConfigured = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").startsWith("http");

  const loadData = useCallback(async () => {
    if (!supabaseConfigured) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const data = await fetchCouponsAction();
    setCoupons(data);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, supabaseConfigured]);

  useEffect(() => { loadData(); }, [loadData]);

  const activeCoupons = useMemo(() => coupons.filter(c => c.status === "active"), [coupons]);
  const archivedCoupons = useMemo(() => coupons.filter(c => c.status === "archived"), [coupons]);
  const totalBalance = useMemo(() => activeCoupons.reduce((s, c) => s + c.currentBalance, 0), [activeCoupons]);
  const totalSavings = useMemo(() => coupons.reduce((s, c) => s + getSavings(c), 0), [coupons]);

  const filterCoupons = useCallback((list: Coupon[]) =>
    list.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchSearch = q === "" || c.brand.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q);
      const matchCat = selectedCategories.size === 0 || selectedCategories.has(c.category);
      return matchSearch && matchCat;
    }), [searchQuery, selectedCategories]);

  const filteredActive = useMemo(() => filterCoupons(activeCoupons), [filterCoupons, activeCoupons]);
  const filteredArchived = useMemo(() => filterCoupons(archivedCoupons), [filterCoupons, archivedCoupons]);

  const brandGroups = useMemo(() => {
    const map = new Map<string, Coupon[]>();
    for (const c of filteredActive) {
      const list = map.get(c.brand) ?? [];
      list.push(c);
      map.set(c.brand, list);
    }
    return Array.from(map.entries()).sort(([, a], [, b]) => {
      if (sortOrder === "expiry-asc") return Math.min(...a.map(c => new Date(c.expiryDate).getTime())) - Math.min(...b.map(c => new Date(c.expiryDate).getTime()));
      if (sortOrder === "expiry-desc") return Math.min(...b.map(c => new Date(c.expiryDate).getTime())) - Math.min(...a.map(c => new Date(c.expiryDate).getTime()));
      const aAlert = a.some(c => { const d = new Date(c.expiryDate).getTime() - Date.now(); return d >= 0 && d < 7 * 86400_000; });
      const bAlert = b.some(c => { const d = new Date(c.expiryDate).getTime() - Date.now(); return d >= 0 && d < 7 * 86400_000; });
      if (aAlert !== bAlert) return aAlert ? -1 : 1;
      return b.reduce((s, c) => s + c.currentBalance, 0) - a.reduce((s, c) => s + c.currentBalance, 0);
    });
  }, [filteredActive, sortOrder]);

  async function handleRedeem(id: string, amount: number) {
    const coupon = coupons.find(c => c.id === id);
    if (!coupon) return;
    const updated = redeemFromCoupon(coupon, amount);
    setCoupons(prev => prev.map(c => c.id === id ? updated : c));
    await updateCouponAction(updated);
  }

  async function handleAddCoupon(coupon: Coupon) {
    const saved = await insertCouponAction(coupon);
    setCoupons(prev => [saved, ...prev]);
    showToast("קופון נוסף בהצלחה", "added");
  }

  async function handleUpdateCoupon(coupon: Coupon) {
    const saved = await updateCouponAction(coupon);
    setCoupons(prev => prev.map(c => c.id === saved.id ? saved : c));
    setEditingCoupon(null);
    showToast("קופון עודכן בהצלחה", "updated");
  }

  async function handleDeleteCoupon(id: string) {
    setCoupons(prev => prev.filter(c => c.id !== id));
    await deleteCouponAction(id);
    showToast("קופון נמחק", "deleted");
  }

  function handleTabChange(tab: TabId) {
    if (tab === "add") { setAddModalOpen(true); return; }
    setActiveTab(tab);
  }

  function toggleCategory(cat: CouponCategory | typeof ALL_CATEGORIES) {
    if (cat === ALL_CATEGORIES) { setSelectedCategories(new Set()); return; }
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  function cycleSortOrder() {
    setSortOrder(prev => prev === "default" ? "expiry-asc" : prev === "expiry-asc" ? "expiry-desc" : "default");
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary mx-auto animate-pulse" />
          <p className="text-sm text-outline">טוען...</p>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────
  const DashboardContent = (
    <div className="space-y-10 pb-8">
      {/* Quick Stats Bento — matches Stitch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary text-white p-8 rounded-xl relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-[0_12px_32px_rgba(53,37,205,0.12)]">
          <div className="z-10">
            <p className="text-primary-fixed opacity-90 font-bold mb-1">יתרה כוללת</p>
            <h2 className="text-4xl font-black tracking-tight">{formatCurrency(totalBalance)}</h2>
          </div>
          <div className="absolute -left-4 -bottom-4 opacity-20 transform -rotate-12">
            <span className="material-symbols-outlined" style={{ fontSize: "8rem" }}>account_balance_wallet</span>
          </div>
          <div className="z-10 text-sm text-primary-fixed font-medium mt-4 bg-white/10 px-3 py-1 rounded-full w-fit">
            {activeCoupons.length} קופונים פעילים
          </div>
        </div>
        <div className="bg-secondary text-white p-8 rounded-xl relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-[0_12px_32px_rgba(0,108,73,0.12)]">
          <div className="z-10">
            <p className="text-secondary-fixed opacity-90 font-bold mb-1">חיסכון צבור</p>
            <h2 className="text-4xl font-black tracking-tight">{formatCurrency(totalSavings)}</h2>
          </div>
          <div className="absolute -left-4 -bottom-4 opacity-20 transform -rotate-12">
            <span className="material-symbols-outlined" style={{ fontSize: "8rem" }}>savings</span>
          </div>
          <div className="z-10 text-sm text-secondary-fixed font-medium mt-4 bg-white/10 px-3 py-1 rounded-full w-fit">
            על {coupons.length} קופונים
          </div>
        </div>
      </div>

      {/* Search & Filters — matches Stitch */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="חפש קופון, מותג או קטגוריה..."
            className="w-full bg-surface-container-low border-none rounded-md py-4 px-6 pr-12 focus:ring-2 focus:ring-primary text-on-surface placeholder:text-outline transition-all"
          />
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline">search</span>
        </div>
        <div className="flex flex-row-reverse gap-3 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map(cat => {
            const isAll = cat === ALL_CATEGORIES;
            const isActive = isAll ? selectedCategories.size === 0 : selectedCategories.has(cat as CouponCategory);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary text-white font-bold"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {cat}
              </button>
            );
          })}
          <button
            onClick={cycleSortOrder}
            className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center gap-1 transition-all ${
              sortOrder !== "default"
                ? "bg-primary text-white"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {sortOrder === "expiry-asc" ? "arrow_upward" : sortOrder === "expiry-desc" ? "arrow_downward" : "swap_vert"}
            </span>
            <span className="text-sm font-medium">מיון</span>
          </button>
        </div>
      </div>

      {/* Brand Groups — matches Stitch */}
      {brandGroups.length > 0 ? (
        <div className="space-y-12">
          {brandGroups.map(([brand, groupCoupons]) => (
            <BrandGroup
              key={brand}
              brand={brand}
              coupons={groupCoupons}
              onRedeem={handleRedeem}
              onEdit={setEditingCoupon}
              onDelete={handleDeleteCoupon}
            />
          ))}
        </div>
      ) : (
        <EmptyState hasFilter={searchQuery !== "" || selectedCategories.size > 0} />
      )}
    </div>
  );

  // ── Archive — matches Stitch ─────────────────────────────────────
  const ArchiveContent = (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row-reverse md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-2 tracking-tight">ארכיון קופונים</h1>
          <p className="text-slate-500 font-medium">ניהול ומעקב אחר היסטוריית הקופונים שלך</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="חיפוש קופונים בארכיון..."
            className="w-full bg-surface-container-low border-none rounded-xl py-4 pr-12 pl-4 text-right focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {filteredArchived.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArchived.map(c => {
              const expired = isExpired(c.expiryDate);
              return (
                <div
                  key={c.id}
                  className="group relative bg-surface-container-lowest rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 shadow-[0_12px_32px_rgba(25,28,30,0.06)] flex flex-col"
                >
                  <div className="p-8 text-right flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-4 py-1 rounded-full text-xs font-bold tracking-wide ${
                        expired
                          ? "bg-tertiary text-on-tertiary-container"
                          : "bg-secondary text-on-secondary"
                      }`}>
                        {expired ? "פג תוקף" : "מומש במלואו"}
                      </div>
                      <h3 className="text-2xl font-bold">{c.brand}</h3>
                    </div>
                    {c.description && (
                      <p className="text-slate-500 text-sm leading-relaxed mb-6">{c.description}</p>
                    )}
                    <div className="mt-auto pt-6 border-t border-outline-variant/10 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400">
                        {expired ? "פג ב:" : "מימוש:"} {new Date(c.expiryDate).toLocaleDateString("he-IL")}
                      </span>
                      <span className="text-xl font-black text-slate-400">{formatCurrency(c.originalValue)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Archive footer banner — matches Stitch */}
          <div className="mt-16 bg-primary-container rounded-xl p-10 flex flex-col md:flex-row-reverse items-center justify-between gap-8 text-on-primary-container overflow-hidden relative">
            <div className="relative z-10 text-right">
              <h2 className="text-3xl font-black mb-2">
                חסכת סך הכל {formatCurrency(filteredArchived.reduce((s, c) => s + getSavings(c), 0))} בארכיון
              </h2>
              <p className="text-indigo-100/80 font-medium">המשך להשתמש בקופונים וחסוך יותר בכל קנייה!</p>
            </div>
            <button className="relative z-10 bg-surface-container-lowest text-primary font-black px-10 py-4 rounded-full shadow-lg hover:scale-105 transition-transform">
              צפה בדוח המלא
            </button>
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl" />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <span className="text-5xl mb-3">📦</span>
          <p className="text-base font-medium">הארכיון ריק</p>
          <p className="text-sm mt-1">קופונים שמומשו במלואם יופיעו כאן</p>
        </div>
      )}
    </div>
  );

  const tabContent: Record<Exclude<TabId, "add">, React.ReactNode> = {
    dashboard: DashboardContent,
    archive: ArchiveContent,
    stats: <StatsView coupons={coupons} />,
  };

  const currentContent = activeTab !== "add" ? tabContent[activeTab] : DashboardContent;

  return (
    <div className="min-h-dvh bg-background text-on-surface" dir="rtl">
      {/* Desktop Side Navigation (Right) — matches Stitch */}
      <DesktopSidebar
        active={activeTab}
        onChange={handleTabChange}
        totalBalance={totalBalance}
        totalSavings={totalSavings}
        activeCouponCount={activeCoupons.length}
        onSignOut={signOut}
      />

      {/* Mobile Top Bar — matches Stitch */}
      <header className="md:hidden sticky top-0 bg-background/80 backdrop-blur-md px-6 py-4 flex flex-row-reverse justify-between items-center w-full z-50">
        <h1 className="text-2xl font-black text-primary">ארנק הקופונים</h1>
        <div className="flex gap-2">
          <form action={signOut}>
            <button type="submit" className="p-2 text-primary hover:bg-surface-container-low rounded-full transition-all" aria-label="התנתק">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Canvas — offset for desktop sidebar */}
      <main className="md:mr-72 min-h-screen pb-32 md:pb-12">
        <div className="max-w-6xl mx-auto px-6 pt-8">
          {currentContent}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav active={activeTab} onChange={handleTabChange} />

      {addModalOpen && <AddCouponModal onClose={() => setAddModalOpen(false)} onAdd={handleAddCoupon} />}
      {editingCoupon && <AddCouponModal onClose={() => setEditingCoupon(null)} onUpdate={handleUpdateCoupon} initialCoupon={editingCoupon} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
      <span className="text-5xl mb-4">🎫</span>
      <p className="text-base font-medium">לא נמצאו קופונים</p>
      <p className="text-sm mt-1">
        {hasFilter ? "נסה לשנות את הסינון" : "לחץ + כדי להוסיף את הקופון הראשון שלך"}
      </p>
    </div>
  );
}
