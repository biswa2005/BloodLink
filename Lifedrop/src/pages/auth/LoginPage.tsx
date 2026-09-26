import { useNavigate } from "react-router-dom";
import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import { LogoText } from "../../components/Logo";

const portals = [
  {
    role: "donor",
    label: "Donor",
    sub: "Donor Login",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    path: "/donor/login",
    accent: "#D7263D",
    bg: "#FFF0F2",
  },
  {
    role: "bloodbank",
    label: "Blood Bank",
    sub: "Blood Bank Login",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    path: "/blood-bank/login",
    accent: "#172033",
    bg: "#F0F4FF",
  },
  {
    role: "healthcare",
    label: "Healthcare Centre",
    sub: "Healthcare Centre Login",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    path: "/healthcare/login",
    accent: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    role: "admin",
    label: "Administrator",
    sub: "Admin Login",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    path: "/admin/login",
    accent: "#4B5563",
    bg: "#F9FAFB",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] dark:bg-[#0D1520]">
      <PublicNav />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-xl">
          <div className="text-center mb-10">
            <LogoText size="lg" />
            <h1 className="text-3xl font-extrabold text-[#172033] dark:text-slate-100 mt-6 mb-2" style={{ fontFamily: "Manrope" }}>Welcome back</h1>
            <p className="text-gray-500 dark:text-slate-400">Choose your LifeDrop portal to sign in.</p>
          </div>

          <div className="space-y-3">
            {portals.map(portal => (
              <button
                key={portal.role}
                onClick={() => navigate(portal.path)}
                className="w-full bg-white dark:bg-[#152030] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-xl p-4 flex items-center gap-4 hover:border-[#D7263D]/40 hover:shadow-md transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: portal.bg, color: portal.accent }}>
                  {portal.icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>{portal.label}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{portal.sub}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-[#D7263D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-8">
            Don't have an account?{" "}
            <button onClick={() => navigate("/register")} className="text-[#D7263D] font-semibold hover:underline">Register</button>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
