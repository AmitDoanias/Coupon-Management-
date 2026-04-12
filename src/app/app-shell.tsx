"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown, LogOut } from "lucide-react";
import { Coupon, CouponCategory } from "@/types/coupon";
import { formatCurrency, getSavings, redeemFromCoupon } from "@/lib/coupon-utils";
import { createClient } from "@/lib/supabase/client";
import { fetchCoupons, insertCoupon, updateCoupon, deleteCoupon } from "@/lib/supabase/coupons-db";
import { signOut } from "@/app/auth/actions";
import BrandGroup from "@/components/BrandGroup";
import CouponCard from "@/components/CouponCard";
import AddCouponModal from "@/components/AddCouponModal";
import BottomNav, { type TabId } from "@/components/BottomNav";
import DesktopSidebar from "@/components/DesktopSidebar";
import StatsView from "@/components/StatsView";
import Toast, { type ToastType } from "@/components/Toast";

const ALL_CATEGORIES = "הכל";
const CATEGORIES: (CouponCategory | typeof ALL_CATEGORIES)[] = [
  ALL_CATEGORIES, "קניות", "אוכל", "אופנה", "פנאי", "אחר",
];

type SortOrder = "default" | "expiry-asc" | "expiry-desc";

export default function App() {
  const supabase = createClient();

  // ── Auth + data state ───────────────────────────────────────────
  const [userId, setUserId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // ── UI state ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<CouponCategory>>(new Set());
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  function showToast(message: string, type: ToastType) {
    setToast({ message, type });
  }

  // ── Load user + coupons on mount ────────────────────────────────
  const supabaseConfigured = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").startsWith("http");

  const loadData = useCallback(async () => {
    if (!supabaseConfigured) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);
    const data = await fetchCoupons(supabase);
    setCoupons(data);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, supabaseConfigured]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived state ───────────────────────────────────────────────
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
      if (sortOrder === "expiry-asc") {
        const aMin = Math.min(...a.map(c => new Date(c.expiryDate).getTime()));
        const bMin = Math.min(...b.map(c => new Date(c.expiryDate).getTime()));
        return aMin - bMin;
      }
      if (sortOrder === "expiry-desc") {
        const aMin = Math.min(...a.map(c => new Date(c.expiryDate).getTime()));
        const bMin = Math.min(...b.map(c => new Date(c.expiryDate).getTime()));
        return bMin - aMin;
      }
      const aAlert = a.some(c => { const d = new Date(c.expiryDate).getTime() - Date.now(); return d >= 0 && d < 7 * 86400_000; });
      const bAlert = b.some(c => { const d = new Date(c.expiryDate).getTime() - Date.now(); return d >= 0 && d < 7 * 86400_000; });
      if (aAlert !== bAlert) return aAlert ? -1 : 1;
      return b.reduce((s, c) => s + c.currentBalance, 0) - a.reduce((s, c) => s + c.currentBalance, 0);
    });
  }, [filteredActive, sortOrder]);

  // ── Handlers ───────────────────────────────────────────────────
  async function handleRedeem(id: string, amount: number) {
    const coupon = coupons.find(c => c.id === id);
    if (!coupon || !userId) return;
    const updated = redeemFromCoupon(coupon, amount);
    setCoupons(prev => prev.map(c => c.id === id ? updated : c));
    await updateCoupon(supabase, updated, userId);
  }

  async function handleAddCoupon(coupon: Coupon) {
    if (!userId) return;
    const saved = await insertCoupon(supabase, coupon, userId);
    setCoupons(prev => [saved, ...prev]);
    showToast("קופון נוסף בהצלחה", "added");
  }

  async function handleUpdateCoupon(coupon: Coupon) {
    if (!userId) return;
    const saved = await updateCoupon(supabase, coupon, userId);
    setCoupons(prev => prev.map(c => c.id === saved.id ? saved : c));
    setEditingCoupon(null);
    showToast("קופון עודכן בהצלחה", "updated");
  }

  async function handleDeleteCoupon(id: string) {
    setCoupons(prev => prev.filter(c => c.id !== id));
    await deleteCoupon(supabase, id);
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
    setSortOrder(prev =>
      prev === "default" ? "expiry-asc" : prev === "expiry-asc" ? "expiry-desc" : "default"
    );
  }

  const SortIcon = sortOrder === "expiry-asc" ? ArrowUp : sortOrder === "expiry-desc" ? ArrowDown : ArrowUpDown;
  const sortLabel = sortOrder === "expiry-asc" ? "תפוגה קרובה" : sortOrder === "expiry-desc" ? "תפוגה רחוקה" : "מיון";

  // ── Loading skeleton ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 mx-auto animate-pulse" />
          <p className="text-sm text-gray-400">טוען...</p>
        </div>
      </div>
    );
  }

  // ── Content panels ─────────────────────────────────────────────
  const DashboardContent = (
    <div className="space-y-5 pb-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-600 text-white rounded-2xl p-4 shadow-sm shadow-indigo-200">
          <p className="text-xs opacity-75 mb-1">יתרה כוללת</p>
          <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
          <p className="text-[11px] opacity-60 mt-0.5">{activeCoupons.length} קופונים פעילים</p>
        </div>
        <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-sm shadow-emerald-200">
          <p className="text-xs opacity-75 mb-1">חיסכון מצטבר</p>
          <p className="text-2xl font-bold">{formatCurrency(totalSavings)}</p>
          <p className="text-[11px] opacity-60 mt-0.5">על {coupons.length} קופונים</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="relative">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="חיפוש לפי מותג, קוד או תיאור..."
            className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <SlidersHorizontal size={14} className="flex-shrink-0 text-gray-400" />
          {CATEGORIES.map(cat => {
            const isAll = cat === ALL_CATEGORIES;
            const active = isAll ? selectedCategories.size === 0 : selectedCategories.has(cat as CouponCategory);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  active ? "bg-indigo-600 text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-300"
                }`}
              >
                {cat}
              </button>
            );
          })}
          <button
            onClick={cycleSortOrder}
            className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-all border ${
              sortOrder !== "default"
                ? "bg-violet-600 text-white border-violet-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-violet-300"
            }`}
          >
            <SortIcon size={11} />
            {sortLabel}
          </button>
        </div>
      </div>

      {brandGroups.length > 0 ? (
        <div className="space-y-2.5">
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

  const ArchiveContent = (
    <div className="space-y-5 pb-6">
      <h2 className="text-lg font-bold text-gray-900">ארכיון קופונים</h2>
      <div className="relative">
        <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="חיפוש בארכיון..."
          className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-400"
        />
      </div>
      {filteredArchived.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredArchived.map(c => (
            <CouponCard
              key={c.id}
              coupon={c}
              onRedeem={handleRedeem}
              onEdit={setEditingCoupon}
              onDelete={handleDeleteCoupon}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <span className="text-5xl mb-3">📦</span>
          <p className="text-base font-medium">הארכיון ריק</p>
          <p className="text-sm mt-1">קופונים שמומשו במלואם יופיעו כאן</p>
        </div>
      )}
    </div>
  );

  const tabContent: Record<Exclude<TabId, "add">, React.ReactNode> = {
    dashboard: DashboardContent,
    archive:   ArchiveContent,
    stats:     <StatsView coupons={coupons} />,
  };

  const currentContent = activeTab !== "add" ? tabContent[activeTab] : DashboardContent;

  const PAGE_TITLES: Record<Exclude<TabId, "add">, string> = {
    dashboard: "ארנק הקופונים",
    archive:   "ארכיון",
    stats:     "סטטיסטיקה",
  };

  return (
    <div className="min-h-dvh bg-gray-50" dir="rtl">
      <div className="flex flex-row md:flex-row">
        <DesktopSidebar
          active={activeTab}
          onChange={handleTabChange}
          totalBalance={totalBalance}
          totalSavings={totalSavings}
          activeCouponCount={activeCoupons.length}
          onSignOut={signOut}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-3.5">
              <form action={signOut}>
                <button type="submit" className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="התנתק">
                  <LogOut size={16} />
                </button>
              </form>
              <h1 className="text-base font-bold text-gray-900">
                {PAGE_TITLES[activeTab !== "add" ? activeTab : "dashboard"]}
              </h1>
            </div>
          </header>

          <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
            <h1 className="text-lg font-bold text-gray-900">
              {PAGE_TITLES[activeTab !== "add" ? activeTab : "dashboard"]}
            </h1>
          </header>

          <main className="flex-1 px-4 md:px-6 pt-5 pb-24 md:pb-8 max-w-3xl w-full mx-auto">
            {currentContent}
          </main>
        </div>
      </div>

      <BottomNav active={activeTab} onChange={handleTabChange} />

      {addModalOpen && (
        <AddCouponModal
          onClose={() => setAddModalOpen(false)}
          onAdd={handleAddCoupon}
        />
      )}

      {editingCoupon && (
        <AddCouponModal
          onClose={() => setEditingCoupon(null)}
          onUpdate={handleUpdateCoupon}
          initialCoupon={editingCoupon}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <span className="text-5xl mb-3">🎫</span>
      <p className="text-base font-medium">לא נמצאו קופונים</p>
      <p className="text-sm mt-1">
        {hasFilter ? "נסה לשנות את הסינון" : "לחץ + כדי להוסיף את הקופון הראשון שלך"}
      </p>
    </div>
  );
}
