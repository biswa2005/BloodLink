import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import { Button, Input, Select, StepProgress } from "../../components/ui";
import { LogoText } from "../../components/Logo";
import { useAuth } from "../../context/AuthContext";
import { BLOOD_GROUPS } from "../../data";

const steps = ["Personal Details", "Blood Details", "Location", "Preferences"];

export default function DonorRegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", dob: "", phone: "", email: "", password: "",
    bloodGroup: "", lastDonation: "",
    city: "", state: "", pincode: "",
    radius: "10", consent: false,
  });

  const upd = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    login("donor", form.name || "Aarav Mehta");
    navigate("/donor/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] dark:bg-[#0D1520]">
      <PublicNav />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <LogoText />
            <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100 mt-6 mb-1" style={{ fontFamily: "Manrope" }}>Become a Donor</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Join the LifeDrop donor network</p>
          </div>

          <div className="flex justify-center mb-8 overflow-x-auto pb-2">
            <StepProgress steps={steps} current={step} />
          </div>

          <div className="bg-white dark:bg-[#152030] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-2xl p-6 sm:p-8 shadow-sm">
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-bold text-[#172033] dark:text-slate-100 mb-4" style={{ fontFamily: "Manrope" }}>Personal Details</h2>
                <Input label="Full Name" placeholder="Aarav Mehta" value={form.name} onChange={e => upd("name", e.target.value)} />
                <Input label="Date of Birth" type="date" value={form.dob} onChange={e => upd("dob", e.target.value)} />
                <Input label="Phone Number" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => upd("phone", e.target.value)} />
                <Input label="Email Address" type="email" placeholder="your@email.com" value={form.email} onChange={e => upd("email", e.target.value)} />
                <Input label="Password" type="password" placeholder="Create a strong password" value={form.password} onChange={e => upd("password", e.target.value)} />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-bold text-[#172033] dark:text-slate-100 mb-4" style={{ fontFamily: "Manrope" }}>Blood Details</h2>
                <Select
                  label="Blood Group"
                  options={BLOOD_GROUPS.map(g => ({ value: g, label: g }))}
                  placeholder="Select blood group"
                  value={form.bloodGroup}
                  onChange={e => upd("bloodGroup", e.target.value)}
                />
                <Input label="Last Donation Date (if any)" type="date" value={form.lastDonation} onChange={e => upd("lastDonation", e.target.value)} hint="Leave blank if you've never donated" />
                <div className="bg-[#F6F7F9] dark:bg-[#1C2A3E] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-xl p-4">
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Your blood group information helps us match you with emergency requests. You remain subject to standard medical screening at the point of donation.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-bold text-[#172033] dark:text-slate-100 mb-4" style={{ fontFamily: "Manrope" }}>Your Location</h2>
                <Input label="City" placeholder="Kolkata" value={form.city} onChange={e => upd("city", e.target.value)} />
                <Input label="State" placeholder="West Bengal" value={form.state} onChange={e => upd("state", e.target.value)} />
                <Input label="Pincode" placeholder="700001" value={form.pincode} onChange={e => upd("pincode", e.target.value)} />
                <button className="flex items-center gap-2 text-sm text-[#D7263D] font-medium hover:underline" onClick={() => { upd("city", "Kolkata"); upd("state", "West Bengal"); upd("pincode", "700013"); }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Use current location
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="font-bold text-[#172033] dark:text-slate-100 mb-4" style={{ fontFamily: "Manrope" }}>Emergency Preferences</h2>
                <div>
                  <label className="text-sm font-medium text-[#172033] dark:text-slate-200 block mb-3">Notification radius</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["5", "10", "25", "50"].map(r => (
                      <button
                        key={r}
                        onClick={() => upd("radius", r)}
                        className={`py-2.5 text-sm font-semibold rounded-lg border transition-all ${form.radius === r ? "bg-[#D7263D] text-white border-[#D7263D]" : "bg-white dark:bg-[#1C2A3E] text-gray-600 dark:text-slate-300 border-[#E5E7EB] dark:border-[#1E2D40] hover:border-[#D7263D]/40"}`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#FFF0F2] dark:bg-[#D7263D]/10 border border-red-100 dark:border-[#D7263D]/20 rounded-xl p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={e => upd("consent", e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#D7263D] focus:ring-[#D7263D] flex-shrink-0"
                    />
                    <span className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                      I agree to receive verified emergency blood-request alerts near my location. I understand I can change this at any time.
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <Button variant="secondary" className="flex-1" onClick={() => setStep(s => s - 1)}>Back</Button>
              )}
              <Button className="flex-1" loading={loading && step === steps.length - 1} onClick={handleNext} disabled={step === 3 && !form.consent}>
                {step === steps.length - 1 ? "Create Donor Account" : "Continue"}
              </Button>
            </div>
          </div>

          <p className="text-center mt-4 text-sm text-gray-500 dark:text-slate-400">
            Already have an account?{" "}
            <button onClick={() => navigate("/donor/login")} className="text-[#D7263D] font-semibold hover:underline">Sign in</button>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
