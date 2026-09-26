import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { Button, Card, StatCard, Badge, AlertBanner, Modal, useToast } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { emergencyRequests, donationHistory } from "../../data";

function EligibilityCard() {
  const navigate = useNavigate();
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <p className="font-bold text-green-700">You're eligible to donate</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Blood Group: O+</p>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Your last recorded donation was 4 months ago.</p>
      <Button size="sm" className="w-full" onClick={() => navigate("/donor/requests")}>View Nearby Requests</Button>
    </Card>
  );
}

function EmergencyAlertCard({ onAccept }: { onAccept: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed) return null;

  return (
    <div className="border-2 border-[#D7263D] rounded-xl p-5 bg-[#FFF0F2] dark:bg-[#D7263D]/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#D7263D] animate-pulse" />
          <span className="text-xs font-bold text-[#D7263D] uppercase tracking-wider">Urgent Blood Request Nearby</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-slate-500">8 min ago</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white dark:bg-[#152030] rounded-xl p-3 border border-red-100 dark:border-[#D7263D]/20">
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Blood Group</p>
          <p className="text-2xl font-extrabold text-[#D7263D]" style={{ fontFamily: "Manrope" }}>O−</p>
        </div>
        <div className="bg-white dark:bg-[#152030] rounded-xl p-3 border border-red-100 dark:border-[#D7263D]/20">
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Component</p>
          <p className="font-bold text-[#172033] dark:text-slate-100">Whole Blood</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#152030] rounded-xl p-3 border border-red-100 dark:border-[#D7263D]/20 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500">Healthcare Centre</p>
            <p className="font-semibold text-[#172033] dark:text-slate-100">CityCare Medical Centre</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-slate-500">Distance</p>
            <p className="font-semibold text-[#172033] dark:text-slate-100">3.4 km</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-[#1E2D40]">
          <div><p className="text-xs text-gray-400 dark:text-slate-500">Units needed</p><p className="font-bold text-[#172033] dark:text-slate-100">2</p></div>
          <div className="text-right"><p className="text-xs text-gray-400 dark:text-slate-500">Urgency</p><p className="font-bold text-red-600">Critical</p></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" className="col-span-1" onClick={onAccept}>I Can Donate</Button>
        <Button variant="secondary" size="sm" onClick={() => setDismissed(true)}>Not Available</Button>
        <Button variant="ghost" size="sm" onClick={() => navigate("/donor/requests")}>View Request</Button>
      </div>
    </div>
  );
}

function AcceptanceConfirmation() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <p className="font-bold text-green-800">Thank you, Aarav.</p>
          <p className="text-sm text-green-700">The healthcare centre has been notified.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#152030] rounded-xl p-4 border border-green-200 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Request</span>
          <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-100">Donor Matched</span>
        </div>
        <p className="font-bold text-[#172033] dark:text-slate-100">CityCare Medical Centre</p>
        <p className="text-sm text-gray-500 dark:text-slate-400">1 Hospital Road, Park Street, Kolkata</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Request ID: LR-2026-09421</p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1">Contact Healthcare Centre</Button>
        <Button variant="outline" size="sm" className="flex-1">Get Directions</Button>
      </div>
    </div>
  );
}

export default function DonorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { show, ToastEl } = useToast();
  const [accepted, setAccepted] = useState(false);

  const name = user?.name || "Aarav";
  const firstName = name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const handleAccept = () => {
    setAccepted(true);
    show("Request accepted! Healthcare centre has been notified.", "success");
  };

  return (
    <DashboardLayout>
      {ToastEl}

      <div className="mb-8">
        <p className="text-sm text-gray-400 dark:text-slate-500 mb-1">{greeting}</p>
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>{name}</h1>
        <div className="flex flex-wrap gap-3 mt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />Eligible to donate
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 dark:bg-[#1C2A3E] text-gray-700 dark:text-slate-300 px-2.5 py-1 rounded-full">
            O+ · Last donation 12 Jun 2026
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Blood Group" value="O+" sub="Your type" accent />
        <StatCard label="Total Donations" value={6} sub="Since 2024" />
        <StatCard label="Nearby Requests" value={3} sub="Within 10 km" accent />
        <StatCard label="Lives Impacted" value={18} sub="Estimated" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          <h2 className="font-bold text-[#172033] dark:text-slate-100 text-lg" style={{ fontFamily: "Manrope" }}>Active Emergency Alert</h2>
          {accepted ? <AcceptanceConfirmation /> : <EmergencyAlertCard onAccept={handleAccept} />}

          {/* Other nearby requests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#172033] dark:text-slate-100">Other nearby requests</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/donor/requests")}>View all</Button>
            </div>
            <div className="space-y-3">
              {emergencyRequests.filter(r => r.urgency !== "Critical" || r.id !== "LR-2026-09421").slice(0, 2).map(req => (
                <Card key={req.id} className="p-4" onClick={() => navigate("/donor/requests")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F6F7F9] dark:bg-[#1C2A3E] flex items-center justify-center">
                        <span className="text-sm font-extrabold text-[#D7263D]">{req.bloodGroup}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#172033] dark:text-slate-100 text-sm">{req.component}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{req.healthcareCentre} · {req.location.split(",")[1]?.trim() || req.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${req.urgency === "Critical" ? "bg-red-50 text-red-700" : req.urgency === "Urgent" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"}`}>{req.urgency}</span>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{req.requestedAgo}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <EligibilityCard />

          {/* Recent donations */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#172033] dark:text-slate-100">Recent Donations</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/donor/history")}>History</Button>
            </div>
            <div className="space-y-3">
              {donationHistory.slice(0, 3).map((d, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#F6F7F9] dark:border-[#1E2D40] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#172033] dark:text-slate-200">{d.component}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{d.date}</p>
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Completed</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick actions */}
          <Card className="p-5">
            <h3 className="font-semibold text-[#172033] dark:text-slate-100 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: "View donation certificate", path: "/donor/history" },
                { label: "Update notification radius", path: "/donor/profile" },
                { label: "View rewards & badges", path: "/donor/rewards" },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-slate-400 hover:bg-[#F6F7F9] dark:hover:bg-[#1C2A3E] hover:text-[#D7263D] transition-colors flex items-center justify-between">
                  {a.label}
                  <svg className="w-4 h-4 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
