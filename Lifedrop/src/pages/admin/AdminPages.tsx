import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Button, Card, StatCard, StatusBadge, Tabs, useToast, AlertBanner } from "../../components/ui";
import { donors, bloodBanks, healthcareCentres, emergencyRequests, analyticsData, bloodGroupDemand, platformStats, adminStats } from "../../data";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033]" style={{ fontFamily: "Manrope" }}>Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-1">LifeDrop administration console</p>
      </div>

      <AlertBanner type="info" title="9 pending verifications require review" message="Blood banks and healthcare centres awaiting approval" action={<Button size="sm" variant="outline" className="border-blue-400 text-blue-700 hover:bg-blue-50" onClick={() => {}}>Review Queue</Button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 mb-8">
        <StatCard label="Registered Donors" value="4,820" sub="Active network" />
        <StatCard label="Blood Banks" value={128} sub="Verified facilities" />
        <StatCard label="Healthcare Centres" value={86} sub="Connected" />
        <StatCard label="Active Emergencies" value={14} sub="Right now" accent />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Fulfilled Today" value={42} sub="Completed requests" />
        <StatCard label="Pending Verifications" value={9} sub="Awaiting review" />
        <StatCard label="Fulfillment Rate" value="94%" sub="This month" />
        <StatCard label="Avg Match Time" value="8 min" sub="Platform average" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-bold text-[#172033] mb-4">Request Volume (7 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analyticsData} barSize={24}>
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
          <h3 className="font-bold text-[#172033] mb-4">Blood Group Demand</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bloodGroupDemand} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="group" type="category" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8 }} />
              <Bar dataKey="demand" radius={[0, 4, 4, 0]}>
                {bloodGroupDemand.map((_, i) => <Cell key={i} fill={i < 2 ? "#D7263D" : i < 4 ? "#E0536A" : "#F0A3B0"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// ─── Donor Management ─────────────────────────────────────────────────────────
export function AdminDonorsPage() {
  const [search, setSearch] = useState("");
  const filtered = donors.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.bloodGroup.includes(search) || d.city.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold text-[#172033]" style={{ fontFamily: "Manrope" }}>Donor Management</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search donors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:border-[#D7263D] focus:outline-none w-56"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Donors" value="4,820" sub="Registered" />
        <StatCard label="Eligible Now" value="3,241" sub="Can donate" />
        <StatCard label="Active" value="4,790" sub="Good standing" />
        <StatCard label="Suspended" value={30} sub="Under review" accent />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F6F7F9] border-b border-[#E5E7EB]">
              <tr>
                {["Name", "Blood Group", "City", "Eligibility", "Donations", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6F7F9]">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3 font-semibold text-[#172033]">{d.name}</td>
                  <td className="px-4 py-3 font-bold text-[#D7263D]">{d.bloodGroup}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.city}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.eligibility} /></td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#172033]">{d.totalDonations}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">View</Button>
                      <Button variant="ghost" size="sm" className="text-gray-400">{d.status === "Active" ? "Suspend" : "Reinstate"}</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}

// ─── Blood Bank Management ────────────────────────────────────────────────────
export function AdminBloodBanksPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033]" style={{ fontFamily: "Manrope" }}>Blood Bank Management</h1>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F6F7F9] border-b border-[#E5E7EB]">
              <tr>
                {["Blood Bank", "Location", "Verification", "Last Updated", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6F7F9]">
              {bloodBanks.map(bank => (
                <tr key={bank.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3 font-semibold text-[#172033]">{bank.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{bank.city}</td>
                  <td className="px-4 py-3">
                    {bank.verified ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Verified</span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{bank.lastUpdate}</td>
                  <td className="px-4 py-3"><StatusBadge status={bank.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">View</Button>
                      {!bank.verified && <Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>}
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600">Suspend</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}

// ─── Healthcare Management ────────────────────────────────────────────────────
export function AdminHealthcarePage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-extrabold text-[#172033] mb-6" style={{ fontFamily: "Manrope" }}>Healthcare Centre Management</h1>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F6F7F9] border-b border-[#E5E7EB]">
              <tr>
                {["Centre", "Type", "Location", "Requests", "Verification", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6F7F9]">
              {healthcareCentres.map(hc => (
                <tr key={hc.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3 font-semibold text-[#172033]">{hc.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{hc.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{hc.city}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#172033]">{[24, 8, 31, 16][healthcareCentres.indexOf(hc) % 4]}</td>
                  <td className="px-4 py-3">
                    {hc.verified ? <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Verified</span> : <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Pending</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={hc.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">View</Button>
                      {!hc.verified && <Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}

// ─── Verification Queue ───────────────────────────────────────────────────────
export function AdminVerificationPage() {
  const [tab, setTab] = useState("Blood Banks");
  const { show, ToastEl } = useToast();

  const pending = [
    { name: "RedCare Blood Bank", reg: "WB-BB-2024-0012", city: "Kolkata", contact: "Mr. Rajiv Gupta", submitted: "22 Sep 2026", type: "Blood Bank" },
    { name: "LifeLine Hospital", reg: "WB-HOS-2023-5512", city: "Kolkata", contact: "Dr. Fatima Sheikh", submitted: "21 Sep 2026", type: "Healthcare Centre" },
    { name: "Sunrise Blood Centre", reg: "WB-BB-2024-0018", city: "Bengaluru", contact: "Ms. Priti Nair", submitted: "20 Sep 2026", type: "Blood Bank" },
  ];

  const filtered = pending.filter(p => tab === "Blood Banks" ? p.type === "Blood Bank" : p.type === "Healthcare Centre");

  return (
    <DashboardLayout>
      {ToastEl}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033]" style={{ fontFamily: "Manrope" }}>Verification Queue</h1>
        <p className="text-sm text-gray-500 mt-1">9 pending organizations awaiting review</p>
      </div>

      <div className="flex gap-2 mb-5">
        {["Blood Banks", "Healthcare Centres"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === t ? "bg-[#172033] text-white" : "bg-white text-gray-500 border border-[#E5E7EB] hover:bg-gray-50"}`}>{t}</button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((item, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-[#172033]">{item.name}</h3>
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">Pending</span>
                </div>
                <p className="text-sm text-gray-500">Reg: {item.reg} · {item.city}</p>
                <p className="text-sm text-gray-500">Contact: {item.contact} · Submitted: {item.submitted}</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <span className="text-blue-500">📄</span>
                  Documents submitted via email — awaiting admin review
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">View Application</Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => show(`${item.name} approved`, "success")}>Approve</Button>
                <Button variant="destructive" size="sm" onClick={() => show(`${item.name} rejected`, "error")}>Reject</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

// ─── Emergency Monitoring ─────────────────────────────────────────────────────
export function AdminEmergencyPage() {
  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#172033]" style={{ fontFamily: "Manrope" }}>Emergency Request Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time view of all emergency requests</p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />14 Active
          </span>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F6F7F9] border-b border-[#E5E7EB]">
              <tr>
                {["Request ID", "Healthcare Centre", "Blood Group", "Component", "Units", "Location", "Created", "Notified", "Matched", "Status"].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6F7F9]">
              {emergencyRequests.map(req => (
                <tr key={req.id} className={`hover:bg-[#F9FAFB] ${req.status === "Flagged" ? "bg-orange-50" : ""}`}>
                  <td className="px-3 py-3 text-xs font-mono font-bold text-[#172033]">{req.id}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">{req.healthcareCentre}</td>
                  <td className="px-3 py-3 font-bold text-[#D7263D]">{req.bloodGroup}</td>
                  <td className="px-3 py-3 text-sm text-gray-600">{req.component}</td>
                  <td className="px-3 py-3 text-sm font-semibold">{req.units}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">{req.location.split(",")[1]?.trim() || req.location}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">{req.createdAt}</td>
                  <td className="px-3 py-3 text-sm font-semibold">{req.donorsNotified}</td>
                  <td className="px-3 py-3 text-sm font-semibold">{req.matched}</td>
                  <td className="px-3 py-3"><StatusBadge status={req.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}

// ─── Admin Analytics ──────────────────────────────────────────────────────────
export function AdminAnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033]" style={{ fontFamily: "Manrope" }}>Platform Analytics</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Monthly Requests" value={312} sub="This month" />
        <StatCard label="Fulfillment Rate" value="94%" sub="+2% vs last month" />
        <StatCard label="Avg Match Time" value="8 min" sub="-1 min vs last month" />
        <StatCard label="Donor Participation" value="67%" sub="Of eligible donors" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card className="p-5">
          <h3 className="font-bold text-[#172033] mb-4">Requests vs Fulfilled (7 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8 }} />
              <Line type="monotone" dataKey="requests" stroke="#D7263D" strokeWidth={2} dot={{ fill: "#D7263D", strokeWidth: 0 }} name="Requests" />
              <Line type="monotone" dataKey="fulfilled" stroke="#16A34A" strokeWidth={2} dot={{ fill: "#16A34A", strokeWidth: 0 }} name="Fulfilled" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-[#172033] mb-4">Donor Participation</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analyticsData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8 }} />
              <Bar dataKey="donors" fill="#172033" radius={[4, 4, 0, 0]} name="Active Donors" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-[#172033] mb-4">Blood Group Demand Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {bloodGroupDemand.map(g => (
            <div key={g.group} className="bg-[#F6F7F9] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#172033]">{g.group}</span>
                <span className="text-sm font-bold text-[#D7263D]">{g.demand}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#D7263D] rounded-full" style={{ width: `${g.demand}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
}

// ─── Platform Management ──────────────────────────────────────────────────────
export function AdminPlatformPage() {
  const { show, ToastEl } = useToast();

  return (
    <DashboardLayout>
      {ToastEl}
      <h1 className="text-2xl font-extrabold text-[#172033] mb-6" style={{ fontFamily: "Manrope" }}>Platform Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-bold text-[#172033] mb-4">Active Announcements</h3>
          <div className="space-y-3">
            {[
              { text: "O− inventory is critically low in selected locations.", type: "critical", active: true },
              { text: "LifeDrop is now available in Hyderabad and Pune.", type: "info", active: true },
            ].map((a, i) => (
              <div key={i} className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${a.type === "critical" ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"}`}>
                <p className={`text-sm flex-1 ${a.type === "critical" ? "text-red-800" : "text-blue-800"}`}>{a.text}</p>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm" className="text-red-400">Remove</Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full mt-2">+ Add Announcement</Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-[#172033] mb-4">Support Requests</h3>
          <div className="space-y-2">
            {[
              { subject: "Cannot update inventory", from: "CityCare Blood Centre", time: "2 hr ago", open: true },
              { subject: "Verification status unclear", from: "Sunrise Blood Centre", time: "1 day ago", open: true },
              { subject: "Donor unsubscribed from alerts", from: "Priya Sharma", time: "3 days ago", open: false },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#F6F7F9] last:border-0">
                <div>
                  <p className="text-sm font-semibold text-[#172033]">{r.subject}</p>
                  <p className="text-xs text-gray-400">{r.from} · {r.time}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.open ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-gray-100 text-gray-500"}`}>
                  {r.open ? "Open" : "Resolved"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-[#172033] mb-4">Notification Templates</h3>
          <div className="space-y-3 text-sm text-gray-600">
            {[
              "Emergency request alert to donors",
              "Donor acceptance notification to HC",
              "Request fulfilled confirmation",
              "Low stock alert to blood banks",
              "Verification approved email",
            ].map(t => (
              <div key={t} className="flex items-center justify-between py-1.5 border-b border-[#F6F7F9] last:border-0">
                <span>{t}</span>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-[#172033] mb-4">Platform Settings</h3>
          <div className="space-y-3">
            {[
              { label: "Donor eligibility interval (days)", value: "90" },
              { label: "Low stock threshold (units)", value: "3" },
              { label: "Expiry warning window (days)", value: "7" },
              { label: "Default search radius (km)", value: "10" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{s.label}</span>
                <input type="text" defaultValue={s.value} className="w-16 px-2 py-1 text-sm border border-[#E5E7EB] rounded-lg text-center focus:border-[#D7263D] focus:outline-none" />
              </div>
            ))}
            <Button className="w-full mt-2" onClick={() => show("Settings saved", "success")}>Save Settings</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// ─── Admin Notifications ──────────────────────────────────────────────────────
export function AdminNotificationsPage() {
  const notifications = [
    { msg: "New blood bank verification request — RedCare Blood Bank", time: "1 hr ago", type: "info" },
    { msg: "Emergency request LR-2026-09412 flagged for review", time: "2 hr ago", type: "warning" },
    { msg: "Healthcare Centre LifeLine Hospital submitted verification documents", time: "1 day ago", type: "info" },
    { msg: "Platform reached 4,820 registered donors", time: "2 days ago", type: "success" },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-extrabold text-[#172033] mb-6" style={{ fontFamily: "Manrope" }}>Notifications</h1>
      <div className="space-y-3">
        {notifications.map((n, i) => (
          <Card key={i} className={`p-4 ${i < 2 ? "border-l-4 border-l-[#D7263D]" : ""}`}>
            <p className={`text-sm ${i < 2 ? "font-semibold text-[#172033]" : "text-gray-600"}`}>{n.msg}</p>
            <p className="text-xs text-gray-400 mt-1">{n.time}</p>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

// ─── Admin Settings ───────────────────────────────────────────────────────────
export function AdminSettingsPage() {
  const { show, ToastEl } = useToast();

  return (
    <DashboardLayout>
      {ToastEl}
      <h1 className="text-2xl font-extrabold text-[#172033] mb-6" style={{ fontFamily: "Manrope" }}>Settings</h1>
      <div className="max-w-xl space-y-5">
        <Card className="p-6">
          <h3 className="font-bold text-[#172033] mb-4">Admin Profile</h3>
          <div className="space-y-3">
            <div><label className="text-sm text-gray-500 block mb-1">Display Name</label><input type="text" defaultValue="Platform Admin" className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg focus:border-[#D7263D] focus:outline-none" /></div>
            <div><label className="text-sm text-gray-500 block mb-1">Email</label><input type="email" defaultValue="admin@lifedrop.in" className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg focus:border-[#D7263D] focus:outline-none" /></div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold text-[#172033] mb-4">Security</h3>
          <div className="space-y-3">
            <div><label className="text-sm text-gray-500 block mb-1">Current Password</label><input type="password" className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg focus:border-[#D7263D] focus:outline-none" /></div>
            <div><label className="text-sm text-gray-500 block mb-1">New Password</label><input type="password" className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg focus:border-[#D7263D] focus:outline-none" /></div>
          </div>
        </Card>
        <Button className="w-full" onClick={() => show("Settings saved", "success")}>Save Changes</Button>
      </div>
    </DashboardLayout>
  );
}
