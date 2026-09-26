import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";
import DashboardLayout from "../../components/DashboardLayout";
import { Button, Card, StatCard, Badge, StatusBadge, Modal, useToast } from "../../components/ui";
import { emergencyRequests, donationHistory } from "../../data";
import { useTheme } from "../../context/ThemeContext";

const DONOR_CENTER: [number, number] = [22.548, 88.3421];

const DONOR_YOU_ICON = L.divIcon({
  html: `<div style="display:flex;flex-direction:column;align-items:center">
    <div style="background:#D7263D;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:5px;box-shadow:0 2px 8px rgba(215,38,61,0.4);white-space:nowrap">You</div>
    <div style="width:2px;height:10px;background:#D7263D;opacity:0.6"></div>
    <div style="width:14px;height:14px;border-radius:50%;background:#D7263D;border:3px solid white;box-shadow:0 2px 8px rgba(215,38,61,0.5)"></div>
  </div>`,
  className: "",
  iconSize: [44, 40],
  iconAnchor: [22, 40],
});

const DONOR_REQUEST_MARKERS = [
  { pos: [22.558, 88.330] as [number, number], label: "O− · Critical", color: "#D7263D" },
  { pos: [22.537, 88.360] as [number, number], label: "A+ · Urgent", color: "#D97706" },
  { pos: [22.527, 88.348] as [number, number], label: "B+ · Standard", color: "#2563EB" },
].map(r => ({
  ...r,
  icon: L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="background:${r.color};color:#fff;font-size:10px;font-weight:700;padding:3px 9px;border-radius:5px;box-shadow:0 2px 6px rgba(0,0,0,0.2);white-space:nowrap">${r.label}</div>
      <div style="width:2px;height:8px;background:${r.color};opacity:0.6"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:${r.color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.15)"></div>
    </div>`,
    className: "",
    iconSize: [110, 34],
    iconAnchor: [55, 34],
  }),
}));

// ─── Emergency Requests Page ─────────────────────────────────────────────────
export function EmergencyRequestsPage() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState<string[]>([]);
  const { show, ToastEl } = useToast();

  const nearby = [
    { ...emergencyRequests[0], km: "3.4 km" },
    { ...emergencyRequests[1], km: "4.8 km" },
    { bloodGroup: "B+" as const, component: "Platelets" as const, urgency: "Standard" as const, units: 2, healthcareCentre: "Apollo City Hospital", location: "Canal Road, Kolkata", requestedAgo: "22 min ago", id: "LR-2026-09400", km: "6.2 km" },
  ];

  const handleAccept = (id: string) => {
    setAccepted(a => [...a, id]);
    show("Request accepted! Healthcare centre has been notified.", "success");
  };

  return (
    <DashboardLayout>
      {ToastEl}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Emergency Requests</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">3 active requests within your 10 km radius</p>
      </div>

      <div className="space-y-4">
        {nearby.map(req => (
          <Card key={req.id} className="p-5">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-[#FFF0F2] dark:bg-[#D7263D]/10 flex items-center justify-center">
                  <span className="text-xl font-extrabold text-[#D7263D]" style={{ fontFamily: "Manrope" }}>{req.bloodGroup}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="font-bold text-[#172033] dark:text-slate-100">{req.component}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${req.urgency === "Critical" ? "bg-red-50 text-red-700 border border-red-100" : req.urgency === "Urgent" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-sky-50 text-sky-700 border border-sky-100"}`}>{req.urgency}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{req.healthcareCentre}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">{(req as any).km}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{req.requestedAgo}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#F6F7F9] dark:bg-[#1C2A3E] rounded-lg p-2.5 text-center">
                <p className="text-xs text-gray-400 dark:text-slate-500">Units</p>
                <p className="font-bold text-[#172033] dark:text-slate-100">{req.units}</p>
              </div>
              <div className="bg-[#F6F7F9] dark:bg-[#1C2A3E] rounded-lg p-2.5 text-center">
                <p className="text-xs text-gray-400 dark:text-slate-500">Location</p>
                <p className="font-bold text-[#172033] dark:text-slate-100 text-xs">{(req as any).km}</p>
              </div>
              <div className="bg-[#F6F7F9] dark:bg-[#1C2A3E] rounded-lg p-2.5 text-center">
                <p className="text-xs text-gray-400 dark:text-slate-500">Notified</p>
                <p className="font-bold text-[#172033] dark:text-slate-100">{(req as any).donorsNotified || 18}</p>
              </div>
            </div>

            {accepted.includes(req.id) ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <p className="text-sm font-semibold text-green-800">You accepted this request</p>
                  <p className="text-xs text-green-600">Healthcare centre has been notified</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => handleAccept(req.id)}>I Can Donate</Button>
                <Button variant="secondary" size="sm">Not Available</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

// ─── Donation History Page ────────────────────────────────────────────────────
export function DonationHistoryPage() {
  const [certModal, setCertModal] = useState<number | null>(null);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Donation History</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Your complete donation record</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Donations" value={6} sub="Since Sep 2024" />
        <StatCard label="Lives Impacted" value={18} sub="Estimated" accent />
        <StatCard label="Member Since" value="2024" sub="2 years" />
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB] dark:border-[#1E2D40]">
          <h2 className="font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>All Donations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F6F7F9] dark:bg-[#1C2A3E] border-b border-[#E5E7EB] dark:border-[#1E2D40]">
              <tr>
                {["Date", "Component", "Facility", "Status", "Certificate"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6F7F9] dark:divide-[#1E2D40]">
              {donationHistory.map((d, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB] dark:hover:bg-[#1C2A3E]">
                  <td className="px-4 py-3 text-sm font-medium text-[#172033] dark:text-slate-200">{d.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">{d.component}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">{d.centre}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => setCertModal(i)}>
                      <svg className="w-4 h-4 text-[#D7263D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={certModal !== null} onClose={() => setCertModal(null)} title="Donation Certificate">
        {certModal !== null && (
          <div className="text-center">
            <div className="border-4 border-[#D7263D] rounded-2xl p-8 bg-gradient-to-br from-[#FFF0F2] to-white dark:from-[#D7263D]/10 dark:to-[#152030] mb-4">
              <p className="text-xs font-semibold text-[#D7263D] uppercase tracking-widest mb-3">LifeDrop</p>
              <h3 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100 mb-2" style={{ fontFamily: "Manrope" }}>Certificate of Donation</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">This certifies that</p>
              <p className="text-xl font-bold text-[#D7263D] mb-2">Aarav Mehta</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">donated <strong>{donationHistory[certModal].component}</strong> on <strong>{donationHistory[certModal].date}</strong></p>
              <p className="text-sm text-gray-500 dark:text-slate-400">at <strong>{donationHistory[certModal].centre}</strong></p>
            </div>
            <Button className="w-full">Download Certificate</Button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

// ─── Rewards Page ─────────────────────────────────────────────────────────────
export function RewardsPage() {
  const badges = [
    { name: "First Drop", desc: "Completed first donation", icon: "💧", earned: true, date: "Sep 2024" },
    { name: "Emergency Hero", desc: "Responded to a critical request", icon: "🏆", earned: true, date: "Feb 2025" },
    { name: "3-Time Donor", desc: "Donated 3 times", icon: "⭐", earned: true, date: "Jun 2025" },
    { name: "Community Lifesaver", desc: "Donated 5 times", icon: "🌟", earned: true, date: "Feb 2026" },
    { name: "Regular Donor", desc: "Donated in 3 consecutive 3-month periods", icon: "🔄", earned: true, date: "Jun 2026" },
    { name: "Super Donor", desc: "Complete 10 donations", icon: "👑", earned: false },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Rewards & Badges</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Recognizing your commitment to saving lives</p>
      </div>

      <div className="bg-[#172033] dark:bg-[#080E18] rounded-2xl p-6 mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-gray-400 text-sm mb-1">Your impact</p>
          <p className="text-4xl font-extrabold text-white" style={{ fontFamily: "Manrope" }}>6 donations</p>
          <p className="text-red-300 text-sm mt-1">≈ 18 lives potentially impacted</p>
        </div>
        <div className="text-right">
          <p className="text-3xl mb-1">🏅</p>
          <p className="text-sm font-semibold text-gray-300">5 of 6 badges earned</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map(badge => (
          <Card key={badge.name} className={`p-5 ${!badge.earned ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${badge.earned ? "bg-amber-50 border-2 border-amber-200" : "bg-gray-100 dark:bg-[#1C2A3E] border-2 border-gray-200 dark:border-[#1E2D40]"}`}>
                {badge.earned ? badge.icon : "🔒"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#172033] dark:text-slate-100">{badge.name}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">{badge.desc}</p>
                {badge.earned && badge.date && <p className="text-xs text-[#D7263D] mt-1">Earned {badge.date}</p>}
                {!badge.earned && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Not yet earned</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 bg-[#F6F7F9] dark:bg-[#1C2A3E] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-xl p-4 text-xs text-gray-500 dark:text-slate-400">
        Donation recognition is for informational purposes. Eligibility to donate remains subject to medical screening at each donation point.
      </div>
    </DashboardLayout>
  );
}

// ─── Donor Notifications ──────────────────────────────────────────────────────
export function DonorNotificationsPage() {
  const notifications = [
    { id: 1, type: "urgent", message: "O− blood requested 3.2 km away — CityCare Medical Centre", time: "8 min ago", read: false },
    { id: 2, type: "info", message: "You are now eligible to donate again", time: "3 days ago", read: false },
    { id: 3, type: "success", message: "Donation certificate for 12 Jun 2026 is available for download", time: "4 mo ago", read: true },
    { id: 4, type: "urgent", message: "A+ Platelets requested 4.5 km away — Metro Health Centre", time: "2 days ago", read: true },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Notifications</h1>
        <Button variant="ghost" size="sm">Mark all as read</Button>
      </div>
      <div className="space-y-3">
        {notifications.map(n => (
          <Card key={n.id} className={`p-4 ${!n.read ? "border-l-4 border-l-[#D7263D]" : ""}`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${n.type === "urgent" ? "bg-red-50 text-red-600" : n.type === "success" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}>
                {n.type === "urgent" ? "🔴" : n.type === "success" ? "✓" : "ℹ"}
              </div>
              <div className="flex-1">
                <p className={`text-sm ${!n.read ? "font-semibold text-[#172033] dark:text-slate-100" : "text-gray-600 dark:text-slate-400"}`}>{n.message}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{n.time}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-[#D7263D] mt-2 flex-shrink-0" />}
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

// ─── Donor Profile ────────────────────────────────────────────────────────────
export function DonorProfilePage() {
  const [radius, setRadius] = useState("10");

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Profile</h1>
      </div>
      <div className="max-w-2xl space-y-5">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#D7263D] flex items-center justify-center text-white text-2xl font-bold">A</div>
            <div>
              <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">Aarav Mehta</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">aarav.mehta@email.com · +91 98765 43210</p>
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Active Donor
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[["Blood Group", "O+"], ["Last Donation", "12 Jun 2026"], ["City", "Kolkata"], ["Member Since", "Sep 2024"]].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">{l}</p>
                <p className="font-semibold text-[#172033] dark:text-slate-200">{v}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-[#172033] dark:text-slate-100 mb-4">Notification Radius</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Receive emergency alerts for requests within this radius.</p>
          <div className="grid grid-cols-4 gap-2">
            {["5", "10", "25", "50"].map(r => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`py-2.5 text-sm font-semibold rounded-lg border transition-all ${radius === r ? "bg-[#D7263D] text-white border-[#D7263D]" : "bg-white dark:bg-[#1C2A3E] text-gray-600 dark:text-slate-300 border-[#E5E7EB] dark:border-[#1E2D40] hover:border-[#D7263D]/40"}`}
              >
                {r} km
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-[#172033] dark:text-slate-100 mb-4">Privacy & Safety</h3>
          <div className="space-y-3">
            {[
              { label: "Receive emergency alerts", on: true },
              { label: "Share general location with requests", on: true },
              { label: "Receive eligibility reminders", on: true },
              { label: "Profile visible to healthcare centres", on: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-slate-400">{item.label}</span>
                <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${item.on ? "bg-[#D7263D]" : "bg-gray-200 dark:bg-[#1C2A3E]"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-sm ${item.on ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Button className="w-full">Save Changes</Button>
      </div>
    </DashboardLayout>
  );
}

// ─── Map Page ─────────────────────────────────────────────────────────────────
export function DonorMapPage() {
  const { theme } = useTheme();
  const tileUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Map View</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Nearby requests and blood banks</p>
      </div>
      <div className="rounded-2xl border border-[#D1D9F0] dark:border-[#1E2D40] overflow-hidden relative" style={{ height: "60vh" }}>
        <MapContainer center={DONOR_CENTER} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl>
          <TileLayer
            url={tileUrl}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <Circle
            center={DONOR_CENTER}
            radius={5000}
            pathOptions={{ color: "#D7263D", fillColor: "#D7263D", fillOpacity: 0.04, weight: 1, dashArray: "8 5" }}
          />
          <Circle
            center={DONOR_CENTER}
            radius={2500}
            pathOptions={{ color: "#D7263D", fillColor: "#D7263D", fillOpacity: 0.03, weight: 0.5, dashArray: "4 4" }}
          />
          <Marker position={DONOR_CENTER} icon={DONOR_YOU_ICON} />
          {DONOR_REQUEST_MARKERS.map((r, i) => (
            <Marker key={i} position={r.pos} icon={r.icon} />
          ))}
        </MapContainer>

        <div
          className="absolute bottom-4 left-4 bg-white dark:bg-[#152030] rounded-xl border border-[#E5E7EB] dark:border-[#1E2D40] shadow p-3 text-xs space-y-1 text-gray-700 dark:text-slate-300"
          style={{ zIndex: 1100 }}
        >
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#D7263D] inline-block" />Critical request</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />Urgent request</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />Standard request</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
