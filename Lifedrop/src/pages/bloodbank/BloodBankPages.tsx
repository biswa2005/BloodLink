import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { Button, Card, Modal, useToast } from "../../components/ui";
import { bloodBanks, expiryItems, analyticsData, bloodGroupDemand } from "../../data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const myBank = bloodBanks[0];

const ALL_GROUPS = ["O+", "O−", "A+", "A−", "B+", "B−", "AB+", "AB−"] as const;
type BloodGroup = typeof ALL_GROUPS[number];
type Component = "Whole Blood" | "Platelets" | "Plasma";
const COMPONENTS: Component[] = ["Whole Blood", "Platelets", "Plasma"];

// seed inventory map: group → {wholeBlood, platelets, plasma}
const seedInventory = () => {
  const map: Record<BloodGroup, Record<Component, number>> = {} as any;
  for (const g of ALL_GROUPS) {
    const inv = myBank.inventory.find(i => i.group === g);
    map[g] = {
      "Whole Blood": inv?.wholeBlood ?? 0,
      "Platelets": inv?.platelets ?? 0,
      "Plasma": inv?.plasma ?? 0,
    };
  }
  return map;
};

function stockState(u: number): { label: string; cellCls: string; textCls: string } {
  if (u === 0) return { label: "Empty", cellCls: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50", textCls: "text-red-600 dark:text-red-400" };
  if (u <= 3) return { label: "Low", cellCls: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50", textCls: "text-amber-600 dark:text-amber-400" };
  return { label: "OK", cellCls: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50", textCls: "text-green-600 dark:text-green-400" };
}

// ─── Inventory flat list helpers ─────────────────────────────────────────────
const LOW_THRESHOLD = 4;

function flatInventory(inv: typeof myBank.inventory) {
  return inv.flatMap(i => [
    { group: i.group, component: "Whole Blood" as const, units: i.wholeBlood },
    { group: i.group, component: "Platelets" as const,   units: i.platelets  },
    { group: i.group, component: "Plasma" as const,      units: i.plasma     },
  ]);
}

const recentActivity = [
  { datetime: "Today, 10:42 AM", group: "O+",  component: "Whole Blood", delta: +20, type: "Stock Added"   },
  { datetime: "Today, 09:15 AM", group: "A+",  component: "Platelets",   delta:  +5, type: "Stock Added"   },
  { datetime: "Today, 08:00 AM", group: "O+",  component: "Whole Blood", delta:  -4, type: "Stock Updated" },
  { datetime: "Yesterday, 6:30 PM", group: "B+", component: "Plasma",    delta:  -2, type: "Stock Updated" },
  { datetime: "Yesterday, 2:00 PM", group: "AB+",component: "Whole Blood",delta: +8, type: "Stock Added"   },
];

// ─── Blood Bank Dashboard ─────────────────────────────────────────────────────
export function BBDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show, ToastEl } = useToast();
  const bankName = user?.name || myBank.name;

  const items = flatInventory(myBank.inventory);
  const totalUnits = items.reduce((s, i) => s + i.units, 0);
  const lowStockItems  = items.filter(i => i.units > 0 && i.units <= LOW_THRESHOLD);
  const outOfStockItems = items.filter(i => i.units === 0);

  return (
    <DashboardLayout>
      {ToastEl}

      {/* ── Welcome section ─────────────────────────────────────────── */}
      <div className="mb-7 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
            <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
              Welcome back, {bankName}
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Verified Blood Bank
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400">Monitor your blood inventory and respond to shortages.</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">NBTC Lic. WB-BB-2024-0021 · Last updated <span className="font-medium text-gray-500 dark:text-slate-400">4 min ago</span></p>
        </div>
        <Button onClick={() => navigate("/blood-bank/inventory")}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          Manage Inventory
        </Button>
      </div>

      {/* ── Summary stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {/* Total Blood Units */}
        <div className="bg-white dark:bg-[#152030] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-2xl p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3c0 0-7 7.5-7 12a7 7 0 0014 0c0-4.5-7-12-7-12z" /></svg>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-[#172033] dark:text-slate-100 leading-none" style={{ fontFamily: "Manrope" }}>{totalUnits}</p>
            <p className="text-sm font-semibold text-[#172033] dark:text-slate-200 mt-1">Total Blood Units</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Across all groups &amp; components</p>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white dark:bg-[#152030] border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 leading-none" style={{ fontFamily: "Manrope" }}>{lowStockItems.length}</p>
            <p className="text-sm font-semibold text-[#172033] dark:text-slate-200 mt-1">Low Stock Items</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">At or below {LOW_THRESHOLD}-unit threshold</p>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white dark:bg-[#152030] border border-red-200 dark:border-red-800/50 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-red-600 dark:text-red-400 leading-none" style={{ fontFamily: "Manrope" }}>{outOfStockItems.length}</p>
            <p className="text-sm font-semibold text-[#172033] dark:text-slate-200 mt-1">Out of Stock</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Zero units — immediate action needed</p>
          </div>
        </div>
      </div>

      {/* ── Main grid: alerts + activity ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">

        {/* Low Stock Alerts */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Low Stock Alerts</h2>
            <span className="text-xs font-medium text-gray-400 dark:text-slate-500">Threshold: {LOW_THRESHOLD} units</span>
          </div>

          {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
            <div className="bg-white dark:bg-[#152030] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-sm font-semibold text-[#172033] dark:text-slate-200">All inventory levels are healthy</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">No items below the low-stock threshold</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Out of stock first (red) */}
              {outOfStockItems.map((item, i) => (
                <div key={`oos-${i}`} className="bg-white dark:bg-[#152030] border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center font-extrabold text-red-600 dark:text-red-400 text-sm flex-shrink-0">{item.group}</div>
                    <div>
                      <p className="text-sm font-semibold text-[#172033] dark:text-slate-200">{item.component}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">0 units</span>
                        <span className="text-xs font-bold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 px-1.5 py-0.5 rounded-md">Out of Stock</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/blood-bank/inventory")}
                    className="text-xs font-semibold text-[#D7263D] hover:text-[#B01E30] border border-[#D7263D]/30 hover:border-[#D7263D] px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                  >
                    Update Stock
                  </button>
                </div>
              ))}
              {/* Low stock (amber) */}
              {lowStockItems.map((item, i) => (
                <div key={`low-${i}`} className="bg-white dark:bg-[#152030] border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center font-extrabold text-amber-700 dark:text-amber-400 text-sm flex-shrink-0">{item.group}</div>
                    <div>
                      <p className="text-sm font-semibold text-[#172033] dark:text-slate-200">{item.component}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{item.units} unit{item.units !== 1 ? "s" : ""}</span>
                        <span className="text-xs font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-1.5 py-0.5 rounded-md">Low Stock</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/blood-bank/inventory")}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 border border-amber-300 dark:border-amber-700/50 hover:border-amber-400 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                  >
                    Update Stock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Stock Activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Recent Activity</h2>
            <button onClick={() => navigate("/blood-bank/activity")} className="text-xs font-semibold text-[#D7263D] hover:underline">View all</button>
          </div>

          <div className="bg-white dark:bg-[#152030] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-2xl overflow-hidden">
            <div className="divide-y divide-[#F6F7F9] dark:divide-[#1E2D40]">
              {recentActivity.map((a, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${a.delta > 0 ? "bg-green-50 dark:bg-green-900/30" : "bg-gray-100 dark:bg-[#1C2A3E]"}`}>
                    {a.delta > 0
                      ? <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                      : <svg className="w-4 h-4 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#172033] dark:text-slate-100">{a.group}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">·</span>
                      <span className="text-xs text-gray-600 dark:text-slate-400 truncate">{a.component}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-bold ${a.delta > 0 ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-slate-400"}`}>
                        {a.delta > 0 ? `+${a.delta}` : a.delta} units
                      </span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${a.delta > 0 ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-[#1C2A3E] text-gray-500 dark:text-slate-400"}`}>
                        {a.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{a.datetime}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 bg-[#F9FAFB] dark:bg-[#1C2A3E] border-t border-[#F0F0F0] dark:border-[#1E2D40]">
              <button onClick={() => navigate("/blood-bank/activity")} className="text-xs font-semibold text-[#D7263D] hover:underline flex items-center gap-1">
                View all stock activity
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-[#172033] dark:text-slate-100 mb-3" style={{ fontFamily: "Manrope" }}>Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Update Blood Inventory",
              desc: "Add or adjust stock across blood groups",
              to: "/blood-bank/inventory",
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
              accent: "text-[#D7263D] bg-[#FFF0F2] dark:bg-[#D7263D]/10",
            },
            {
              label: "View Stock Activity",
              desc: "See full history of stock movements",
              to: "/blood-bank/activity",
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
              accent: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
            },
            {
              label: "Edit Blood Bank Profile",
              desc: "Update details, hours, and settings",
              to: "/blood-bank/profile",
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
              accent: "text-gray-600 bg-gray-100 dark:bg-[#1C2A3E] dark:text-slate-300",
            },
          ].map(qa => (
            <button
              key={qa.label}
              onClick={() => navigate(qa.to)}
              className="bg-white dark:bg-[#152030] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-xl p-4 flex items-start gap-3 hover:border-[#D7263D]/30 dark:hover:border-[#D7263D]/40 hover:shadow-sm transition-all text-left group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${qa.accent}`}>
                {qa.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#172033] dark:text-slate-100 group-hover:text-[#D7263D] transition-colors">{qa.label}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{qa.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Inventory — full 8×3 grid ────────────────────────────────────────────────
export function BBInventory({ inline = false }: { inline?: boolean }) {
  const [inventory, setInventory] = useState(seedInventory);
  const [activeComponent, setActiveComponent] = useState<Component>("Whole Blood");
  const [modal, setModal] = useState<{ group: BloodGroup; component: Component } | null>(null);
  const [draft, setDraft] = useState<number>(0);
  const { show, ToastEl } = useToast();

  const openModal = (group: BloodGroup, component: Component) => {
    setDraft(inventory[group][component]);
    setModal({ group, component });
  };

  const handleSave = () => {
    if (!modal) return;
    const prev = inventory[modal.group][modal.component];
    setInventory(inv => ({
      ...inv,
      [modal.group]: { ...inv[modal.group], [modal.component]: draft },
    }));
    show(`${modal.group} ${modal.component}: ${prev} → ${draft} (${draft >= prev ? "+" : ""}${draft - prev})`, "success");
    setModal(null);
  };

  const deltaStr = modal
    ? (() => {
        const prev = inventory[modal.group][modal.component];
        const diff = draft - prev;
        if (diff === 0) return `${prev} units (no change)`;
        return `${prev} → ${draft} (${diff > 0 ? "+" : ""}${diff})`;
      })()
    : "";

  const content = (
    <>
      {ToastEl}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className={`font-bold text-[#172033] dark:text-slate-100 ${inline ? "" : "text-xl"}`} style={{ fontFamily: "Manrope" }}>
          {inline ? "Blood Inventory" : "Inventory Matrix"}
        </h3>
        <div className="flex items-center gap-2">
          {/* Component tabs */}
          <div className="flex border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg overflow-hidden text-xs">
            {COMPONENTS.map(c => (
              <button
                key={c}
                onClick={() => setActiveComponent(c)}
                className={`px-3 py-1.5 font-semibold transition-colors ${activeComponent === c ? "bg-[#172033] dark:bg-[#D7263D] text-white" : "bg-white dark:bg-[#152030] text-gray-500 dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-200"}`}
              >
                {c === "Whole Blood" ? "Whole Blood" : c}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => openModal("O+" as BloodGroup, activeComponent)}>+ Add Stock</Button>
        </div>
      </div>

      {/* Grid header */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F6F7F9] dark:bg-[#1C2A3E] border-b border-[#E5E7EB] dark:border-[#1E2D40]">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-20">Group</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Units</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F6F7F9] dark:divide-[#1E2D40]">
            {ALL_GROUPS.map(group => {
              const qty = inventory[group][activeComponent];
              const s = stockState(qty);
              return (
                <tr key={group} className="hover:bg-[#F9FAFB] dark:hover:bg-[#1C2A3E]/50 transition-colors">
                  <td className="px-3 py-3">
                    <span className="font-extrabold text-[#172033] dark:text-slate-100 text-base">{group}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-block min-w-[3rem] text-center text-lg font-extrabold px-3 py-1 rounded-lg border ${s.cellCls} ${s.textCls}`} style={{ fontFamily: "Manrope" }}>
                      {qty}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 ml-1">u</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${s.cellCls} ${s.textCls}`}>{s.label}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => { setDraft(Math.max(0, inventory[group][activeComponent] - 1)); setModal({ group, component: activeComponent }); }}
                        className="w-7 h-7 rounded-md bg-[#F6F7F9] dark:bg-[#1C2A3E] border border-[#E5E7EB] dark:border-[#1E2D40] text-gray-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 font-bold text-base flex items-center justify-center transition-colors"
                      >−</button>
                      <button
                        onClick={() => { setDraft(inventory[group][activeComponent] + 1); setModal({ group, component: activeComponent }); }}
                        className="w-7 h-7 rounded-md bg-[#F6F7F9] dark:bg-[#1C2A3E] border border-[#E5E7EB] dark:border-[#1E2D40] text-gray-600 dark:text-slate-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 font-bold text-base flex items-center justify-center transition-colors"
                      >+</button>
                      <button
                        onClick={() => openModal(group, activeComponent)}
                        className="w-7 h-7 rounded-md bg-[#F6F7F9] dark:bg-[#1C2A3E] border border-[#E5E7EB] dark:border-[#1E2D40] text-gray-500 dark:text-slate-400 hover:bg-[#172033] dark:hover:bg-[#D7263D] hover:text-white text-xs flex items-center justify-center transition-colors"
                        title="Edit"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#F6F7F9] dark:bg-[#1C2A3E] border-t border-[#E5E7EB] dark:border-[#1E2D40]">
              <td className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400">Total</td>
              <td className="px-3 py-2 text-center text-sm font-bold text-[#172033] dark:text-slate-100">
                {ALL_GROUPS.reduce((s, g) => s + inventory[g][activeComponent], 0)} u
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Update stock modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title="Update Stock">
        {modal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium mb-1">Blood Group</p>
                <div className="flex gap-1.5 flex-wrap">
                  {ALL_GROUPS.map(g => (
                    <button
                      key={g}
                      onClick={() => { setModal({ group: g, component: modal.component }); setDraft(inventory[g][modal.component]); }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${modal.group === g ? "bg-[#D7263D] text-white border-[#D7263D]" : "bg-white dark:bg-[#152030] text-gray-600 dark:text-slate-400 border-[#E5E7EB] dark:border-[#1E2D40] hover:border-[#D7263D]/40"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium mb-1">Component</p>
                <div className="space-y-1.5">
                  {COMPONENTS.map(c => (
                    <label key={c} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs font-medium transition-all ${modal.component === c ? "border-[#D7263D] bg-[#FFF0F2] dark:bg-[#D7263D]/10 text-[#D7263D]" : "border-[#E5E7EB] dark:border-[#1E2D40] text-gray-600 dark:text-slate-400"}`}>
                      <input type="radio" name="mod-comp" value={c} checked={modal.component === c} onChange={() => { setModal({ group: modal.group, component: c }); setDraft(inventory[modal.group][c]); }} className="text-[#D7263D]" />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#172033] dark:text-slate-300 block mb-1">Available Units</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDraft(d => Math.max(0, d - 1))}
                  className="w-10 h-10 rounded-lg bg-[#F6F7F9] dark:bg-[#1C2A3E] border border-[#E5E7EB] dark:border-[#1E2D40] text-gray-600 dark:text-slate-300 font-bold text-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >−</button>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={draft}
                  onChange={e => setDraft(Math.max(0, Math.min(999, Number(e.target.value))))}
                  className="flex-1 text-center text-2xl font-extrabold px-3 py-2 border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-100 focus:border-[#D7263D] focus:outline-none focus:ring-2 focus:ring-[#D7263D]/20"
                  style={{ fontFamily: "Manrope" }}
                />
                <button
                  onClick={() => setDraft(d => Math.min(999, d + 1))}
                  className="w-10 h-10 rounded-lg bg-[#F6F7F9] dark:bg-[#1C2A3E] border border-[#E5E7EB] dark:border-[#1E2D40] text-gray-600 dark:text-slate-300 font-bold text-xl hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >+</button>
              </div>
              {/* Delta hint */}
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 text-center">{deltaStr}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave}>Save Stock</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );

  if (inline) return <Card className="p-5">{content}</Card>;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Blood Inventory</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Live stock across all blood groups and components — last updated 4 min ago</p>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {ALL_GROUPS.map(g => {
          const inv = seedInventory()[g];
          const total = inv["Whole Blood"] + inv["Platelets"] + inv["Plasma"];
          const s = stockState(inv["Whole Blood"]);
          return (
            <div key={g} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${s.cellCls} ${s.textCls}`}>
              <span className="font-extrabold">{g}</span>
              <span className="font-normal opacity-70">{total}u total</span>
            </div>
          );
        })}
      </div>

      <Card className="p-5">{content}</Card>
    </DashboardLayout>
  );
}

// ─── Expiry Tracking ──────────────────────────────────────────────────────────
export function ExpiryTrackingPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Expiry Tracking</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Units nearing expiry — act before waste occurs</p>
      </div>

      <div className="space-y-3">
        {expiryItems.map((item, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${item.severity === "Critical" ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50" : item.severity === "Warning" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50" : "bg-gray-50 dark:bg-[#1C2A3E] text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-[#1E2D40]"}`}>
                  {item.group}
                </div>
                <div>
                  <p className="font-bold text-[#172033] dark:text-slate-100">{item.component}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{item.units} units</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`font-bold text-sm ${item.severity === "Critical" ? "text-red-600 dark:text-red-400" : item.severity === "Warning" ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-slate-400"}`}>
                    Expires in {item.expiresIn}
                  </p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.severity === "Critical" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" : item.severity === "Warning" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-gray-100 dark:bg-[#1C2A3E] text-gray-600 dark:text-slate-400"}`}>
                    {item.severity}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">View Units</Button>
                  <Button size="sm">Update Status</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

// ─── Blood Bank Analytics ─────────────────────────────────────────────────────
export function BBAnalyticsPage() {
  const [tab, setTab] = useState("Weekly");

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Inventory trends and demand insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#172033] dark:text-slate-100">Request Activity</h3>
            <div className="flex items-center border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg overflow-hidden">
              {["Weekly", "Monthly"].map(t => (
                <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 text-xs font-semibold ${tab === t ? "bg-[#172033] dark:bg-[#D7263D] text-white" : "bg-white dark:bg-[#152030] text-gray-500 dark:text-slate-400"}`}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8 }} />
              <Bar dataKey="requests" fill="#D7263D" radius={[4, 4, 0, 0]} name="Requests" />
              <Bar dataKey="fulfilled" fill="#16A34A" radius={[4, 4, 0, 0]} name="Fulfilled" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-[#172033] dark:text-slate-100 mb-4">Blood Group Demand</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bloodGroupDemand} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="group" type="category" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8 }} />
              <Bar dataKey="demand" radius={[0, 4, 4, 0]} name="Requests">
                {bloodGroupDemand.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#D7263D" : i === 1 ? "#B01E30" : "#F0758A"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-[#172033] dark:text-slate-100 mb-2">7-Day Demand Forecast</h3>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Based on recent demand and historical usage patterns.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { group: "O+",  level: "High",     cls: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400" },
            { group: "A+",  level: "Moderate", cls: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400" },
            { group: "B+",  level: "Moderate", cls: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400" },
            { group: "AB−", level: "Stable",   cls: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400" },
            { group: "O−",  level: "High",     cls: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400" },
            { group: "A−",  level: "Stable",   cls: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400" },
            { group: "B−",  level: "Low",      cls: "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800/50 text-sky-700 dark:text-sky-400" },
            { group: "AB+", level: "Stable",   cls: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400" },
          ].map(g => (
            <div key={g.group} className={`border rounded-xl p-3 flex items-center justify-between ${g.cls}`}>
              <span className="font-bold">{g.group}</span>
              <span className="text-xs font-semibold">{g.level}</span>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
}

// ─── BB Requests ──────────────────────────────────────────────────────────────
export function BBRequestsPage() {
  const requests = [
    { id: "LR-2026-09421", centre: "CityCare Medical", group: "O−", component: "Whole Blood", units: 2, urgency: "Critical", time: "8 min ago", status: "Open" },
    { id: "LR-2026-09418", centre: "Metro Health",     group: "A+", component: "Platelets",   units: 4, urgency: "Urgent",   time: "55 min ago", status: "Open" },
    { id: "LR-2026-09415", centre: "Apollo City",      group: "B+", component: "Whole Blood", units: 6, urgency: "Standard", time: "2 hr ago",   status: "Fulfilled" },
    { id: "LR-2026-09408", centre: "Sunrise Hospital", group: "AB+",component: "Plasma",      units: 3, urgency: "Urgent",   time: "5 hr ago",   status: "Fulfilled" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Incoming Requests</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Requests we supplied or are supplying blood for</p>
      </div>
      <div className="space-y-3">
        {requests.map(r => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FFF0F2] dark:bg-[#D7263D]/10 flex items-center justify-center font-extrabold text-[#D7263D] text-sm">{r.group}</div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-[#172033] dark:text-slate-100">{r.component} · {r.units} units</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.urgency === "Critical" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" : r.urgency === "Urgent" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"}`}>{r.urgency}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{r.centre} · {r.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${r.status === "Open" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800/50" : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800/50"}`}>{r.status}</span>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{r.time}</p>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

// ─── BB Notifications ─────────────────────────────────────────────────────────
export function BBNotificationsPage() {
  const notifications = [
    { msg: "O− inventory dropped below threshold — 1 unit remaining", time: "Just now", type: "critical" },
    { msg: "4 B+ units expire within 48 hours", time: "2 hr ago", type: "warning" },
    { msg: "New request for A+ Platelets from Metro Health Centre", time: "55 min ago", type: "info" },
    { msg: "Inventory updated — A+ Whole Blood: 8 units", time: "4 min ago", type: "success" },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100 mb-6" style={{ fontFamily: "Manrope" }}>Notifications</h1>
      <div className="space-y-3">
        {notifications.map((n, i) => (
          <Card key={i} className={`p-4 ${i < 2 ? "border-l-4 border-l-[#D7263D]" : ""}`}>
            <p className="text-sm font-medium text-[#172033] dark:text-slate-100">{n.msg}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{n.time}</p>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

// ─── BB Profile ───────────────────────────────────────────────────────────────
export function BBProfilePage() {
  const [threshold, setThreshold] = useState(
    () => parseInt(localStorage.getItem("bb-low-threshold") || "4")
  );
  const { show, ToastEl } = useToast();
  const [form, setForm] = useState({
    name: myBank.name,
    address: myBank.address + ", " + myBank.city,
    lat: "22.5726", lng: "88.3639",
    contact: myBank.phone,
  });
  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const saveThreshold = () => {
    localStorage.setItem("bb-low-threshold", String(threshold));
    show("Low-stock threshold saved", "success");
  };

  return (
    <DashboardLayout>
      {ToastEl}
      <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100 mb-6" style={{ fontFamily: "Manrope" }}>Blood Bank Profile</h1>
      <div className="max-w-2xl space-y-5">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-[#172033] dark:bg-[#1C2A3E] flex items-center justify-center text-white text-xl font-bold">CC</div>
            <div>
              <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">{myBank.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">Verified</span>
                <span className="text-xs text-gray-400 dark:text-slate-500">NBTC WB-BB-2024-0021</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#172033] dark:text-slate-300 block mb-1">Organization Name</label>
              <input value={form.name} onChange={e => upd("name", e.target.value)} className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-[#172033] dark:text-slate-300 block mb-1">Address</label>
              <textarea rows={2} value={form.address} onChange={e => upd("address", e.target.value)} className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-[#172033] dark:text-slate-300 block mb-1">Latitude</label>
                <input value={form.lat} onChange={e => upd("lat", e.target.value)} className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#172033] dark:text-slate-300 block mb-1">Longitude</label>
                <input value={form.lng} onChange={e => upd("lng", e.target.value)} className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#172033] dark:text-slate-300 block mb-1">Contact Phone</label>
              <input value={form.contact} onChange={e => upd("contact", e.target.value)} className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none" />
            </div>
            <div className="flex items-center justify-between py-2 border-t border-[#F6F7F9] dark:border-[#1E2D40]">
              <p className="text-sm text-gray-400 dark:text-slate-500">Email (login)</p>
              <p className="text-sm font-medium text-[#172033] dark:text-slate-200">{myBank.email}</p>
            </div>
          </div>

          <Button className="w-full mt-4" onClick={() => show("Changes saved (demo)", "success")}>Save Changes</Button>
        </Card>

        {/* Low-stock threshold */}
        <Card className="p-6">
          <h3 className="font-bold text-[#172033] dark:text-slate-100 mb-1">Low-Stock Threshold</h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Alert triggers when any component drops at or below this unit count.</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setThreshold(t => Math.max(1, t - 1))} className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#1E2D40] bg-[#F6F7F9] dark:bg-[#1C2A3E] text-gray-600 dark:text-slate-300 font-bold text-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">−</button>
            <input
              type="number" min={1} max={20} value={threshold}
              onChange={e => setThreshold(Math.max(1, Math.min(20, Number(e.target.value))))}
              className="w-20 text-center text-xl font-bold border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg py-2 bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-100 focus:outline-none focus:border-[#D7263D]"
            />
            <button onClick={() => setThreshold(t => Math.min(20, t + 1))} className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#1E2D40] bg-[#F6F7F9] dark:bg-[#1C2A3E] text-gray-600 dark:text-slate-300 font-bold text-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">+</button>
            <span className="text-sm text-gray-500 dark:text-slate-400">units</span>
            <Button size="sm" className="ml-auto" onClick={saveThreshold}>Save</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// ─── Stock Activity (placeholder) ─────────────────────────────────────────────
export function BBStockActivityPage() {
  const navigate = useNavigate();
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Stock Activity</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Full history of inventory movements</p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F6F7F9] dark:bg-[#1C2A3E] border-b border-[#E5E7EB] dark:border-[#1E2D40]">
              <tr>{["Date & Time","Blood Group","Component","Quantity","Type","Performed By"].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-[#F6F7F9] dark:divide-[#1E2D40]">
              {recentActivity.concat([
                { datetime: "26 Sep, 11:00 AM", group: "B−", component: "Whole Blood", delta: +6, type: "Stock Added"   },
                { datetime: "25 Sep,  4:00 PM", group: "A−", component: "Plasma",      delta: +3, type: "Stock Added"   },
                { datetime: "25 Sep, 10:00 AM", group: "AB−",component: "Whole Blood", delta: -1, type: "Stock Updated" },
              ]).map((a,i)=>(
                <tr key={i} className="hover:bg-[#F9FAFB] dark:hover:bg-[#1C2A3E]/50">
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{a.datetime}</td>
                  <td className="px-4 py-3 font-bold text-[#D7263D]">{a.group}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400">{a.component}</td>
                  <td className={`px-4 py-3 font-bold ${a.delta>0?"text-green-600 dark:text-green-400":"text-gray-500 dark:text-slate-400"}`}>{a.delta>0?`+${a.delta}`:a.delta}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.delta>0?"bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400":"bg-gray-100 dark:bg-[#1C2A3E] text-gray-600 dark:text-slate-400"}`}>{a.type}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500">Staff</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}

// ─── Hospitals Supplied (placeholder) ────────────────────────────────────────
export function BBHospitalsPage() {
  const hospitals = [
    { name: "CityCare Medical Centre",  type: "Hospital", lastSupply: "Today, 09:00 AM", units: 4,  group: "O+", status: "Active"   },
    { name: "Metro Health Centre",      type: "Clinic",   lastSupply: "Yesterday",       units: 6,  group: "A+", status: "Active"   },
    { name: "Apollo City Hospital",     type: "Hospital", lastSupply: "2 days ago",      units: 10, group: "B+", status: "Active"   },
    { name: "LifeLine Hospital",        type: "Hospital", lastSupply: "5 days ago",      units: 2,  group: "O−", status: "Inactive" },
  ];
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Hospitals Supplied</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Healthcare centres we have supplied blood to</p>
      </div>
      <div className="space-y-3">
        {hospitals.map((h,i)=>(
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">{h.name[0]}{h.name.split(" ")[1]?.[0]}</div>
                <div>
                  <p className="font-semibold text-[#172033] dark:text-slate-100">{h.name}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{h.type} · Last supply: {h.lastSupply}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-[#172033] dark:text-slate-200">{h.group} · {h.units}u</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${h.status==="Active"?"bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400":"bg-gray-100 dark:bg-[#1C2A3E] text-gray-500 dark:text-slate-400"}`}>{h.status}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
