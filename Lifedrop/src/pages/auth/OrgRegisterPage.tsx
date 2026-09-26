import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import { Button, Input, Select } from "../../components/ui";
import { LogoText } from "../../components/Logo";
import { useAuth } from "../../context/AuthContext";

type OrgRole = "blood-bank" | "healthcare";

const config: Record<OrgRole, { label: string; authRole: "bloodbank" | "healthcare"; dashPath: string; extraFields?: boolean }> = {
  "blood-bank": { label: "Blood Bank", authRole: "bloodbank", dashPath: "/blood-bank/dashboard" },
  healthcare: { label: "Healthcare Centre", authRole: "healthcare", dashPath: "/healthcare/dashboard", extraFields: true },
};

const orgTypes = [
  { value: "hospital", label: "Hospital" },
  { value: "clinic", label: "Clinic" },
  { value: "nursing", label: "Nursing Home" },
  { value: "emergency", label: "Emergency Medical Centre" },
  { value: "other", label: "Other Healthcare Facility" },
];

const bankTypes = [
  { value: "govt", label: "Government Blood Bank" },
  { value: "charitable", label: "Charitable / NGO Blood Bank" },
  { value: "hospital", label: "Hospital-based Blood Bank" },
  { value: "private", label: "Private Blood Bank" },
  { value: "voluntary", label: "Voluntary Blood Centre" },
];

export default function OrgRegisterPage() {
  const { pathname } = useLocation();
  const role = pathname.startsWith("/blood-bank") ? "blood-bank" : pathname.startsWith("/healthcare") ? "healthcare" : undefined;
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", regNumber: "", nbtcLicense: "", address: "", city: "", state: "", pincode: "",
    contactPerson: "", phone: "", email: "", password: "", orgType: "", bankType: "",
    openHours: "", collectionCapacity: "", services: [] as string[], docs: false,
  });

  const bbServices = ["Whole Blood", "Platelets", "Plasma", "Apheresis", "Component Separation"];
  const toggleService = (s: string) => {
    const updated = form.services.includes(s) ? form.services.filter(x => x !== s) : [...form.services, s];
    setForm(f => ({ ...f, services: updated }));
  };

  const cfg = role ? config[role as OrgRole] : null;

  const upd = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    login(cfg!.authRole, form.name || (role === "blood-bank" ? "CityCare Blood Centre" : "CityCare Medical Centre"));
    navigate(cfg!.dashPath);
  };

  if (!cfg) return <Navigate to="/register" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] dark:bg-[#0D1520]">
      <PublicNav />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <LogoText />
            <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100 mt-6 mb-1" style={{ fontFamily: "Manrope" }}>Register {cfg.label}</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Organization registration requires verification before full access.</p>
          </div>

          <div className="bg-white dark:bg-[#152030] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-2xl p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label={`${cfg.label} Name`} placeholder={cfg.label === "Blood Bank" ? "CityCare Blood Centre" : "CityCare Medical Centre"} value={form.name} onChange={e => upd("name", e.target.value)} />

              {cfg.extraFields && (
                <Select
                  label="Organization Type"
                  options={orgTypes}
                  placeholder="Select type"
                  value={form.orgType}
                  onChange={e => upd("orgType", e.target.value)}
                />
              )}

              {role === "blood-bank" && (
                <Select
                  label="Blood Bank Type"
                  options={bankTypes}
                  placeholder="Select blood bank type"
                  value={form.bankType}
                  onChange={e => upd("bankType", e.target.value)}
                />
              )}

              <Input label="Registration / Licence Number" placeholder={role === "blood-bank" ? "WB-BB-2024-0001" : "WB-HOS-2024-0001"} value={form.regNumber} onChange={e => upd("regNumber", e.target.value)} />

              {role === "blood-bank" && (
                <Input label="NBTC Licence Number" placeholder="NBTC/WB/2024/0001" value={form.nbtcLicense} onChange={e => upd("nbtcLicense", e.target.value)} />
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input label="City" placeholder="Kolkata" value={form.city} onChange={e => upd("city", e.target.value)} />
                <Input label="State" placeholder="West Bengal" value={form.state} onChange={e => upd("state", e.target.value)} />
              </div>

              <Input label="Address" placeholder="Street address" value={form.address} onChange={e => upd("address", e.target.value)} />
              <Input label="Pincode" placeholder="700001" value={form.pincode} onChange={e => upd("pincode", e.target.value)} />

              {role === "blood-bank" && (
                <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#1E2D40]">
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Operations</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Operating Hours" placeholder="e.g. 24/7 or 8 AM – 8 PM" value={form.openHours} onChange={e => upd("openHours", e.target.value)} />
                      <Input label="Daily Collection Capacity (units)" type="number" placeholder="50" value={form.collectionCapacity} onChange={e => upd("collectionCapacity", e.target.value)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#172033] dark:text-slate-300 mb-2">Services Offered</p>
                      <div className="flex flex-wrap gap-2">
                        {bbServices.map(s => (
                          <button
                            key={s} type="button"
                            onClick={() => toggleService(s)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${form.services.includes(s) ? "bg-[#D7263D] text-white border-[#D7263D]" : "bg-white dark:bg-[#152030] text-gray-600 dark:text-slate-400 border-[#E5E7EB] dark:border-[#1E2D40] hover:border-[#D7263D]/40"}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#1E2D40]">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">{cfg.label === "Blood Bank" ? "Contact Person" : "Emergency Contact"}</p>
                <div className="space-y-3">
                  <Input label="Contact Person Name" placeholder="Dr. Ananya Roy" value={form.contactPerson} onChange={e => upd("contactPerson", e.target.value)} />
                  <Input label="Phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => upd("phone", e.target.value)} />
                  <Input label="Email" type="email" placeholder="admin@yourorg.in" value={form.email} onChange={e => upd("email", e.target.value)} />
                  <Input label="Password" type="password" placeholder="Create a password" value={form.password} onChange={e => upd("password", e.target.value)} />
                </div>
              </div>

              <div className="bg-[#F6F7F9] dark:bg-[#1C2A3E] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.docs} onChange={e => upd("docs", e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#D7263D] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#172033] dark:text-slate-200">Verification Documents</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">I confirm that registration documents will be submitted via email to verify@lifedrop.in</p>
                  </div>
                </label>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>Submit Registration</Button>
            </form>
          </div>

          <p className="text-center mt-4 text-sm text-gray-500 dark:text-slate-400">
            Already registered?{" "}
            <button onClick={() => navigate(`/${role}/login`)} className="text-[#D7263D] font-semibold hover:underline">Sign in</button>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
