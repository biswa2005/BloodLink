import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import { Button, Badge, Card, StatCard } from "../../components/ui";
import { LogoText, logoImg } from "../../components/Logo";
import { BLOOD_GROUPS, COMPONENTS, bloodBanks, platformStats } from "../../data";

// ─── Logo Hero Animation ──────────────────────────────────────────────────────
const BLOOD_DROPS = [
  { left: "12%", delay: "0s",    size: 11 },
  { left: "78%", delay: "1.1s",  size: 7  },
  { left: "38%", delay: "2.3s",  size: 9  },
  { left: "88%", delay: "0.5s",  size: 6  },
  { left: "22%", delay: "1.8s",  size: 8  },
  { left: "60%", delay: "3.1s",  size: 7  },
  { left: "50%", delay: "0.9s",  size: 5  },
];

function LogoHeroAnimation() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div
        className="relative overflow-hidden rounded-2xl shadow-2xl"
        style={{
          aspectRatio: "4/3",
          background: "radial-gradient(ellipse at 50% 42%, #1a0508 0%, #0d1520 55%, #060b14 100%)",
        }}
      >
        {/* Ambient red glow behind logo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 40%, rgba(215,38,61,0.22) 0%, transparent 62%)",
            animation: "logo-glow-pulse 3s ease-in-out infinite",
          }}
        />

        {/* Concentric pulsing rings */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: "12%" }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 90 + i * 58,
                height: 90 + i * 58,
                border: "1px solid rgba(215,38,61,0.55)",
                animation: "logo-pulse-ring 3.2s ease-out infinite",
                animationDelay: `${i * 0.8}s`,
                opacity: 0,
              }}
            />
          ))}
        </div>

        {/* Logo — floating */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ paddingBottom: "10%" }}
        >
          <div style={{ animation: "logo-float 4.5s ease-in-out infinite" }}>
            <img
              src={logoImg}
              alt="LifeDrop"
              className="w-44 h-auto select-none"
              style={{
                filter:
                  "drop-shadow(0 0 28px rgba(215,38,61,0.65)) drop-shadow(0 0 56px rgba(215,38,61,0.28)) drop-shadow(0 4px 20px rgba(0,0,0,0.7))",
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* ECG heartbeat line */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 72 }}>
          <svg
            className="w-full h-full"
            viewBox="0 0 480 72"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="ecgFade" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#D7263D" stopOpacity="0" />
                <stop offset="20%"  stopColor="#D7263D" stopOpacity="0.85" />
                <stop offset="80%"  stopColor="#D7263D" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#D7263D" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Repeated ECG pattern — wide enough to scroll seamlessly */}
            <path
              d="M-80 48 L20 48 L34 48 L46 14 L56 62 L64 22 L72 48 L120 48
                 L134 48 L146 14 L156 62 L164 22 L172 48 L220 48
                 L234 48 L246 14 L256 62 L264 22 L272 48 L320 48
                 L334 48 L346 14 L356 62 L364 22 L372 48 L440 48 L560 48"
              stroke="url(#ecgFade)"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: "ecg-slide 2.8s linear infinite" }}
            />
          </svg>
        </div>

        {/* Floating blood drops rising from bottom */}
        {BLOOD_DROPS.map((p, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: p.left,
              bottom: 72,
              animation: `blood-rise ${3.8 + i * 0.3}s ease-out infinite`,
              animationDelay: p.delay,
              opacity: 0,
            }}
          >
            <svg width={p.size} height={Math.round(p.size * 1.3)} viewBox="0 0 10 13" fill="none">
              <path
                d="M5 0C5 0 0 5.5 0 8C0 10.761 2.239 13 5 13C7.761 13 10 10.761 10 8C10 5.5 5 0 5 0Z"
                fill="#D7263D"
                fillOpacity="0.85"
              />
            </svg>
          </div>
        ))}

        {/* Subtle grid overlay — adds depth */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 300"
          style={{ opacity: 0.04 }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 27} x2="400" y2={i * 27} stroke="#D7263D" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 27} y1="0" x2={i * 27} y2="300" stroke="#D7263D" strokeWidth="0.5" />
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Quick Blood Search ───────────────────────────────────────────────────────
function QuickSearch() {
  const navigate = useNavigate();
  const [group, setGroup] = useState("");
  const [component, setComponent] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (group) params.set("group", group);
    if (component) params.set("component", component);
    if (location) params.set("location", location);
    navigate(`/find-blood?${params.toString()}`);
  };

  return (
    <section className="bg-white dark:bg-[#0D1520] border-b border-[#E5E7EB] dark:border-[#1E2D40]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-[#172033] dark:text-slate-100 mb-2 text-center" style={{ fontFamily: "Manrope" }}>
          Check blood availability near you
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 text-center mb-8">No login required. Search publicly available live inventory.</p>
        <div className="bg-[#F6F7F9] dark:bg-[#1C2A3E] rounded-2xl border border-[#E5E7EB] dark:border-[#1E2D40] p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-[#172033] dark:text-slate-200 block mb-1.5">Blood Group</label>
              <select
                value={group}
                onChange={e => setGroup(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none focus:ring-2 focus:ring-[#D7263D]/20"
              >
                <option value="">Any group</option>
                {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[#172033] dark:text-slate-200 block mb-1.5">Component</label>
              <select
                value={component}
                onChange={e => setComponent(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none focus:ring-2 focus:ring-[#D7263D]/20"
              >
                <option value="">Any component</option>
                {COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[#172033] dark:text-slate-200 block mb-1.5">Location</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="City, locality, or pincode"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-[#D7263D] focus:outline-none focus:ring-2 focus:ring-[#D7263D]/20"
                />
              </div>
              <button
                className="mt-1.5 flex items-center gap-1 text-xs text-[#D7263D] font-medium hover:underline"
                onClick={() => setLocation("Kolkata")}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use current location
              </button>
            </div>
            <div className="flex items-end">
              <Button className="w-full" size="lg" onClick={handleSearch}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Availability
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Live Availability ────────────────────────────────────────────────────────
function LiveAvailabilitySection() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#F6F7F9] dark:bg-[#091018] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Live Inventory</span>
            </div>
            <h2 className="text-2xl font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Nearby blood banks</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/find-blood")}>View all</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bloodBanks.slice(0, 3).map(bank => (
            <Card key={bank.id} className="p-5 hover:shadow-md transition-shadow" onClick={() => navigate(`/blood-bank/${bank.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#172033] dark:text-slate-100 text-sm" style={{ fontFamily: "Manrope" }}>{bank.name}</h3>
                    {bank.verified && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-green-700 font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{bank.address}</p>
                </div>
                <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-[#1C2A3E] px-2 py-1 rounded-full">{bank.distance}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {bank.inventory.filter(i => ["O+", "A+", "O−"].includes(i.group)).slice(0, 3).map(inv => (
                  <div key={inv.group} className="bg-[#F6F7F9] dark:bg-[#1C2A3E] rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-[#172033] dark:text-slate-100">{inv.group}</p>
                    <p className={`text-xs font-semibold ${inv.wholeBlood === 0 ? "text-red-600" : inv.wholeBlood <= 2 ? "text-amber-600" : "text-green-600"}`}>
                      {inv.wholeBlood === 0 ? "Out" : `${inv.wholeBlood}u`}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 mb-4">
                <span>Updated {bank.lastUpdate}</span>
                <span>{bank.openHours}</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/blood-bank/${bank.id}`); }}>View Details</Button>
                <a
                  href={`tel:${bank.phone}`}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-[#1C2A3E] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </a>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Inventory may change frequently. Contact the blood bank before travelling.</p>
          <Button variant="outline" onClick={() => navigate("/find-blood")}>See all blood banks →</Button>
        </div>
      </div>
    </section>
  );
}

// ─── Platform Impact ──────────────────────────────────────────────────────────
function ImpactSection() {
  const stats = [
    { value: "4,820", label: "Registered Donors", sub: "Active network" },
    { value: "128", label: "Connected Blood Banks", sub: "Verified facilities" },
    { value: "86", label: "Healthcare Centres", sub: "Hospitals & clinics" },
    { value: "312", label: "Requests Fulfilled", sub: "This month" },
    { value: "8 min", label: "Average Match Time", sub: "Donor to acceptance" },
    { value: "94%", label: "Fulfillment Rate", sub: "Completed requests" },
  ];

  return (
    <section className="bg-[#172033] dark:bg-[#080E18] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-[#D7263D] uppercase tracking-widest mb-3">Platform Impact</p>
          <h2 className="text-3xl font-extrabold text-white" style={{ fontFamily: "Manrope" }}>
            A network that responds when it matters
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-white mb-1" style={{ fontFamily: "Manrope" }}>{s.value}</p>
              <p className="text-sm font-semibold text-gray-300">{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      n: "01",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
      title: "Search",
      desc: "Find nearby blood availability by group, component, and location — instantly and without login."
    },
    {
      n: "02",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      title: "Request",
      desc: "Verified healthcare centres create emergency requests specifying blood group, component, units, and urgency."
    },
    {
      n: "03",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      title: "Match",
      desc: "Eligible nearby donors receive instant alerts and can accept or decline within seconds."
    },
    {
      n: "04",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      title: "Fulfill",
      desc: "Donor and healthcare centre coordinate directly until the request is marked complete."
    },
  ];

  return (
    <section className="bg-white dark:bg-[#0D1520] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-[#D7263D] uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="text-3xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
            From emergency to match in minutes
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.n} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-[#E5E7EB] dark:bg-[#1E2D40] z-0" style={{ width: "calc(100% - 4rem)", left: "4rem" }} />
              )}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF0F2] dark:bg-[#D7263D]/10 flex items-center justify-center text-[#D7263D]">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-black text-gray-100 dark:text-slate-700" style={{ fontFamily: "Manrope" }}>{step.n}</span>
                </div>
                <h3 className="text-lg font-bold text-[#172033] dark:text-slate-100 mb-2" style={{ fontFamily: "Manrope" }}>{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Emergency Network Visual ─────────────────────────────────────────────────
function EmergencyNetworkSection() {
  const navigate = useNavigate();
  return (
    <section className="bg-[#F6F7F9] dark:bg-[#091018] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs font-semibold text-[#D7263D] uppercase tracking-widest mb-3">Emergency Donor Network</p>
            <h2 className="text-3xl font-extrabold text-[#172033] dark:text-slate-100 mb-4 leading-tight" style={{ fontFamily: "Manrope" }}>
              One request can activate an entire nearby donor network
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-8 leading-relaxed">
              When a healthcare centre raises an emergency, LifeDrop instantly identifies all eligible donors within the selected radius and notifies them simultaneously — creating a coordinated response in real time.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[["24", "Donors notified"], ["6", "Responded"], ["2", "Matched"]].map(([v, l]) => (
                <div key={l} className="bg-white dark:bg-[#152030] rounded-xl p-4 border border-[#E5E7EB] dark:border-[#1E2D40] text-center">
                  <p className="text-2xl font-extrabold text-[#D7263D]" style={{ fontFamily: "Manrope" }}>{v}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{l}</p>
                </div>
              ))}
            </div>
            <Button onClick={() => navigate("/how-it-works")}>See how matching works →</Button>
          </div>

          {/* Network visual */}
          <div className="relative bg-white dark:bg-[#152030] rounded-2xl border border-[#E5E7EB] dark:border-[#1E2D40] p-6 shadow-sm">
            <div className="bg-[#D7263D] text-white rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-200 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Live Emergency Request</span>
              </div>
              <p className="font-bold text-xl mb-1" style={{ fontFamily: "Manrope" }}>O− Blood Required</p>
              <p className="text-red-200 text-sm">CityCare Medical Centre</p>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-white/20 rounded-lg p-2">
                  <p className="text-xs text-red-100">Component</p>
                  <p className="text-sm font-bold">Whole Blood</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <p className="text-xs text-red-100">Units</p>
                  <p className="text-sm font-bold">2</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <p className="text-xs text-red-100">Urgency</p>
                  <p className="text-sm font-bold">Critical</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Nearby donors notified</div>
              {[
                { name: "Aarav M.", group: "O+", km: "2.1 km", status: "Accepted", color: "green" },
                { name: "Sneha I.", group: "O−", km: "3.4 km", status: "Accepted", color: "green" },
                { name: "Rohan G.", group: "O+", km: "4.2 km", status: "Pending", color: "amber" },
                { name: "Meera P.", group: "O+", km: "5.1 km", status: "Pending", color: "amber" },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-[#F6F7F9] dark:bg-[#1C2A3E] rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#172033] flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">{d.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#172033] dark:text-slate-200">{d.name} · {d.group}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{d.km}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.color === "green" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Who Uses ─────────────────────────────────────────────────────────────────
function WhoUsesSection() {
  const navigate = useNavigate();
  const roles = [
    {
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
      title: "Donors",
      desc: "Receive verified emergency requests near you and help when your blood group is needed most.",
      cta: "Become a Donor",
      path: "/register?role=donor",
      accent: "#D7263D",
      bg: "#FFF0F2",
      darkBg: "dark:bg-[#D7263D]/10",
    },
    {
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
      title: "Blood Banks",
      desc: "Publish real-time stock and manage blood inventory across all groups and components.",
      cta: "Register Blood Bank",
      path: "/register?role=bloodbank",
      accent: "#172033",
      bg: "#F0F4FF",
      darkBg: "dark:bg-blue-900/20",
    },
    {
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
      title: "Healthcare Centres",
      desc: "Raise emergency requirements and connect instantly with nearby donors and blood banks.",
      cta: "Register Healthcare Centre",
      path: "/register?role=healthcare",
      accent: "#2563EB",
      bg: "#EFF6FF",
      darkBg: "dark:bg-blue-900/20",
    },
  ];

  return (
    <section className="bg-white dark:bg-[#0D1520] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Who uses LifeDrop</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-3">Three connected roles. One coordinated network.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map(role => (
            <div
              key={role.title}
              className="border border-[#E5E7EB] dark:border-[#1E2D40] rounded-2xl p-8 hover:shadow-lg transition-shadow flex flex-col dark:bg-[#152030]"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${role.darkBg}`} style={{ background: role.bg, color: role.accent }}>
                {role.icon}
              </div>
              <h3 className="text-xl font-bold text-[#172033] dark:text-slate-100 mb-3" style={{ fontFamily: "Manrope" }}>{role.title}</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 leading-relaxed flex-1">{role.desc}</p>
              <Button variant="outline" className="w-full" onClick={() => navigate(role.path)}>{role.cta}</Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trust & Safety ───────────────────────────────────────────────────────────
function TrustSection() {
  const points = [
    { icon: "✓", title: "Verified organizations only", desc: "Blood banks and healthcare centres go through a verification process before gaining full platform access." },
    { icon: "🔒", title: "Donor privacy protected", desc: "Donor contact details are never publicly shared. Coordination happens through the platform." },
    { icon: "⏱", title: "Live inventory timestamps", desc: "Every availability record shows when it was last updated so you know how fresh the data is." },
    { icon: "⚕", title: "Clinical assessment unchanged", desc: "LifeDrop coordinates availability and communication. Donors remain subject to medical screening at the point of donation." },
  ];

  return (
    <section className="bg-[#F6F7F9] dark:bg-[#091018] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-[#D7263D] uppercase tracking-widest mb-3">Trust & Safety</p>
          <h2 className="text-2xl font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Built for real-world healthcare use</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {points.map(p => (
            <div key={p.title} className="bg-white dark:bg-[#152030] rounded-xl border border-[#E5E7EB] dark:border-[#1E2D40] p-5 flex gap-4">
              <span className="text-xl flex-shrink-0">{p.icon}</span>
              <div>
                <h4 className="font-semibold text-[#172033] dark:text-slate-100 mb-1">{p.title}</h4>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section className="bg-[#D7263D] py-20">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <p className="text-red-200 text-sm font-semibold uppercase tracking-widest mb-4">Get started today</p>
        <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight" style={{ fontFamily: "Manrope" }}>
          Every drop. Closer when it matters most.
        </h2>
        <p className="text-red-100 mb-10 text-lg">
          Join 4,820 donors, 128 blood banks, and 86 healthcare centres already on the LifeDrop network.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/find-blood")}
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors bg-white text-[#D7263D] hover:bg-red-50 text-base px-8 py-3"
          >
            Find Blood Now
          </button>
          <button
            onClick={() => navigate("/register")}
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors border-2 border-white bg-transparent text-white hover:bg-white/10 text-base px-8 py-3"
          >
            Become a Donor
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Main HomePage ────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />

      {/* Hero */}
      <section className="bg-white dark:bg-[#0D1520] pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#FFF0F2] dark:bg-[#D7263D]/10 border border-red-100 dark:border-[#D7263D]/20 rounded-full px-3 py-1 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D7263D] animate-pulse" />
                <span className="text-xs font-bold text-[#D7263D] uppercase tracking-wider">Real-Time Blood Network</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-[#172033] dark:text-slate-100 leading-tight mb-6" style={{ fontFamily: "Manrope" }}>
                Find blood when every minute matters.
              </h1>
              <p className="text-lg text-gray-500 dark:text-slate-400 mb-10 leading-relaxed max-w-xl">
                Search live blood availability near you and connect healthcare centres with eligible nearby donors during emergencies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="text-base" onClick={() => navigate("/find-blood")}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Blood Now
                </Button>
                <Button variant="outline" size="lg" className="text-base" onClick={() => navigate("/register?role=donor")}>
                  Become a Donor
                </Button>
              </div>
              <button
                onClick={() => navigate("/how-it-works")}
                className="text-sm text-gray-400 dark:text-slate-500 hover:text-[#D7263D] font-medium transition-colors"
              >
                How LifeDrop Works →
              </button>
            </div>
            <div className="flex justify-center">
              <LogoHeroAnimation />
            </div>
          </div>
        </div>
      </section>

      <QuickSearch />
      <LiveAvailabilitySection />
      <ImpactSection />
      <HowItWorksSection />
      <EmergencyNetworkSection />
      <WhoUsesSection />
      <TrustSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
