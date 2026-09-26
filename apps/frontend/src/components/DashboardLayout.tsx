import { useState, ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogoText } from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "./ui";

interface NavItem { label: string; to: string; icon: ReactNode }

const donorNav: NavItem[] = [
  { label: "Dashboard", to: "/donor/dashboard", icon: <HomeIcon /> },
  { label: "Emergency Requests", to: "/donor/requests", icon: <AlertIcon /> },
  { label: "Map", to: "/donor/map", icon: <MapIcon /> },
  { label: "Donation History", to: "/donor/history", icon: <HistoryIcon /> },
  { label: "Rewards", to: "/donor/rewards", icon: <AwardIcon /> },
  { label: "Notifications", to: "/donor/notifications", icon: <BellIcon /> },
  { label: "Profile", to: "/donor/profile", icon: <UserIcon /> },
];

const bbNav: NavItem[] = [
  { label: "Dashboard",         to: "/blood-bank/dashboard", icon: <HomeIcon /> },
  { label: "Blood Inventory",   to: "/blood-bank/inventory", icon: <DropIcon /> },
  { label: "Stock Activity",    to: "/blood-bank/activity",  icon: <ActivityIcon /> },
  { label: "Hospitals Supplied",to: "/blood-bank/hospitals", icon: <HospitalIcon /> },
  { label: "Profile & Settings",to: "/blood-bank/profile",   icon: <SettingsIcon /> },
];

const hcNav: NavItem[] = [
  { label: "Dashboard", to: "/healthcare/dashboard", icon: <HomeIcon /> },
  { label: "Raise Blood Request", to: "/healthcare/create-request", icon: <AlertIcon /> },
  { label: "Request History", to: "/healthcare/requests", icon: <HistoryIcon /> },
  { label: "Live Map", to: "/healthcare/map", icon: <MapIcon /> },
  { label: "Notifications", to: "/healthcare/notifications", icon: <BellIcon /> },
  { label: "Profile & Verification", to: "/healthcare/profile", icon: <UserIcon /> },
];

const adminNav: NavItem[] = [
  { label: "Overview", to: "/admin/dashboard", icon: <HomeIcon /> },
  { label: "Donors", to: "/admin/donors", icon: <UserIcon /> },
  { label: "Blood Banks", to: "/admin/blood-banks", icon: <DropIcon /> },
  { label: "Healthcare Centres", to: "/admin/healthcare", icon: <MedIcon /> },
  { label: "Emergency Requests", to: "/admin/emergency", icon: <AlertIcon /> },
  { label: "Verification", to: "/admin/verification", icon: <ShieldIcon /> },
  { label: "Analytics", to: "/admin/analytics", icon: <ChartIcon /> },
  { label: "Notifications", to: "/admin/notifications", icon: <BellIcon /> },
  { label: "Platform", to: "/admin/platform", icon: <SettingsIcon /> },
  { label: "Settings", to: "/admin/settings", icon: <SettingsIcon /> },
];

function getNav(role: string | null) {
  if (role === "donor") return donorNav;
  if (role === "bloodbank") return bbNav;
  if (role === "healthcare") return hcNav;
  if (role === "admin") return adminNav;
  return [];
}

function getRoleLabel(role: string | null) {
  if (role === "donor") return "Donor";
  if (role === "bloodbank") return "Blood Bank";
  if (role === "healthcare") return "Healthcare Centre";
  if (role === "admin") return "Administrator";
  return "";
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
    >
      {theme === "dark" ? (
        <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}

const bbNotifications = [
  { title: "O− Whole Blood critically low", sub: "1 unit remaining — below threshold", time: "Just now", dot: "bg-red-500" },
  { title: "A+ Platelets restocked: +5 units", sub: "Inventory updated by staff", time: "1 hr ago", dot: "bg-green-500" },
  { title: "New supply request from Metro Health", sub: "A+ Whole Blood · 4 units", time: "2 hr ago", dot: "bg-blue-500" },
  { title: "AB− Plasma out of stock", sub: "Replenishment required", time: "3 hr ago", dot: "bg-red-400" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = getNav(user?.role || null);
  const roleLabel = getRoleLabel(user?.role || null);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-[#F6F7F9] dark:bg-[#091018] flex">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#172033] text-white flex flex-col transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-white/10">
          <Link to="/" className="block">
            <LogoText light />
          </Link>
          <div className="mt-3 px-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{roleLabel} Portal</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map(item => {
              const active = location.pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-[#D7263D] text-white shadow-sm"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="w-5 h-5 flex-shrink-0 opacity-80">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-1 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#D7263D] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.split(" ").map(w => w[0]).slice(0, 2).join("") || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-gray-400">{roleLabel}</p>
                {user?.role === "bloodbank" && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white dark:bg-[#0D1520] border-b border-[#E5E7EB] dark:border-[#1E2D40] h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-slate-400"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base font-semibold text-[#172033] dark:text-slate-100 hidden sm:block">
              {navItems.find(n => n.to === location.pathname)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "healthcare" && (
              <Button size="sm" onClick={() => navigate("/healthcare/create-request")}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Request
              </Button>
            )}
            {user?.role === "bloodbank" && (
              <Button size="sm" onClick={() => navigate("/blood-bank/inventory")}>Update Inventory</Button>
            )}
            <ThemeToggle />
            <div className="relative">
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-slate-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {!notifOpen && <span className="absolute top-1 right-1 w-2 h-2 bg-[#D7263D] rounded-full" />}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#152030] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#F6F7F9] dark:border-[#1E2D40]">
                      <p className="text-sm font-bold text-[#172033] dark:text-slate-100">Notifications</p>
                      <span className="text-xs font-semibold text-[#D7263D] bg-[#FFF0F2] dark:bg-[#D7263D]/10 px-2 py-0.5 rounded-full">{bbNotifications.length} new</span>
                    </div>
                    <div className="divide-y divide-[#F6F7F9] dark:divide-[#1E2D40] max-h-72 overflow-y-auto">
                      {bbNotifications.map((n, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-[#F9FAFB] dark:hover:bg-[#1C2A3E] cursor-pointer transition-colors">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${n.dot}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#172033] dark:text-slate-100 leading-snug">{n.title}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{n.sub}</p>
                            <p className="text-xs text-gray-300 dark:text-slate-600 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2.5 border-t border-[#F6F7F9] dark:border-[#1E2D40] bg-[#F9FAFB] dark:bg-[#1C2A3E]">
                      <button className="text-xs font-semibold text-[#D7263D] hover:underline" onClick={() => setNotifOpen(false)}>
                        Mark all as read
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto dark:bg-[#091018]">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-[#0D1520] border-t border-[#E5E7EB] dark:border-[#1E2D40] flex">
        {navItems.slice(0, 5).map(item => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${active ? "text-[#D7263D]" : "text-gray-400 dark:text-slate-500"}`}
            >
              <span className="w-5 h-5">{item.icon}</span>
              <span className="truncate max-w-full px-1">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function HomeIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>; }
function AlertIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>; }
function MapIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>; }
function HistoryIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function AwardIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>; }
function BellIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>; }
function UserIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
function DropIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3c0 0-7 7.5-7 12a7 7 0 0014 0c0-4.5-7-12-7-12z" /></svg>; }
function ClockIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function ChartIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
function ActivityIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>; }
function HospitalIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>; }
function SearchIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>; }
function MedIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>; }
function ShieldIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>; }
function SettingsIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
