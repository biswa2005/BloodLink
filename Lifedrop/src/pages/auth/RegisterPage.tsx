import { useNavigate } from "react-router-dom";
import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import { LogoText } from "../../components/Logo";

const options = [
  {
    title: "Become a Donor",
    desc: "Register as a blood donor and receive verified emergency alerts near your location.",
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    path: "/donor/register",
    iconCls: "bg-[#FFF0F2] dark:bg-[#D7263D]/15 text-[#D7263D]",
    btnCls: "border-[#D7263D] text-[#D7263D] hover:bg-[#FFF0F2] dark:border-[#F87171] dark:text-[#F87171] dark:hover:bg-[#D7263D]/10",
    points: ["Receive emergency alerts near you", "Track donation history and eligibility", "Earn badges and certificates"],
  },
  {
    title: "Register a Blood Bank",
    desc: "Publish live blood inventory and connect with healthcare centres in real time.",
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    path: "/blood-bank/register",
    iconCls: "bg-[#F0F4FF] dark:bg-slate-700/40 text-[#172033] dark:text-slate-200",
    btnCls: "border-[#172033] text-[#172033] hover:bg-[#F0F4FF] dark:border-slate-400 dark:text-slate-200 dark:hover:bg-slate-700/30",
    points: ["Manage live blood inventory", "Receive incoming requirements", "Track stock levels and expiry"],
  },
  {
    title: "Register a Healthcare Centre",
    desc: "Create emergency blood requests and find eligible donors and blood banks instantly.",
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    path: "/healthcare/register",
    iconCls: "bg-[#EFF6FF] dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400",
    btnCls: "border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20",
    points: ["Raise emergency blood requests", "Alert nearby donors instantly", "Track request status in real time"],
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] dark:bg-[#0D1520]">
      <PublicNav />
      <main className="flex-1 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <LogoText size="lg" />
            <h1 className="text-3xl font-extrabold text-[#172033] dark:text-slate-100 mt-8 mb-2" style={{ fontFamily: "Manrope" }}>Join the LifeDrop Network</h1>
            <p className="text-gray-500 dark:text-slate-400">Choose how you want to use LifeDrop.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {options.map(opt => (
              <div
                key={opt.title}
                className="bg-white dark:bg-[#152030] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-2xl p-6 flex flex-col hover:shadow-lg hover:border-[#D7263D]/30 transition-all cursor-pointer"
                onClick={() => navigate(opt.path)}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${opt.iconCls}`}>
                  {opt.icon}
                </div>
                <h2 className="text-lg font-bold text-[#172033] dark:text-slate-100 mb-2" style={{ fontFamily: "Manrope" }}>{opt.title}</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 leading-relaxed flex-1">{opt.desc}</p>
                <ul className="space-y-2 mb-6">
                  {opt.points.map(p => (
                    <li key={p} className="flex items-start gap-2 text-xs text-gray-600 dark:text-slate-400">
                      <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-colors border-2 ${opt.btnCls}`}
                  onClick={(e) => { e.stopPropagation(); navigate(opt.path); }}
                >
                  {opt.title}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center mt-8 text-sm text-gray-500 dark:text-slate-400">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="text-[#D7263D] font-semibold hover:underline">Log in</button>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
