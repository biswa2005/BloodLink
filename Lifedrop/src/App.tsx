import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import PublicNav from "./components/PublicNav";
import Footer from "./components/Footer";

// Public pages
import HomePage from "./pages/public/HomePage";
import FindBloodPage from "./pages/public/FindBloodPage";
import BloodBankDetailsPage from "./pages/public/BloodBankDetailsPage";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RoleLoginPage from "./pages/auth/RoleLoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DonorRegisterPage from "./pages/auth/DonorRegisterPage";
import OrgRegisterPage from "./pages/auth/OrgRegisterPage";

// Donor pages
import DonorDashboard from "./pages/donor/DonorDashboard";
import {
  EmergencyRequestsPage,
  DonationHistoryPage,
  RewardsPage,
  DonorNotificationsPage,
  DonorProfilePage,
  DonorMapPage,
} from "./pages/donor/DonorPages";

// Blood Bank pages
import {
  BBDashboard,
  BBInventory,
  BBStockActivityPage,
  BBHospitalsPage,
  ExpiryTrackingPage,
  BBAnalyticsPage,
  BBRequestsPage,
  BBNotificationsPage,
  BBProfilePage,
} from "./pages/bloodbank/BloodBankPages";

// Healthcare pages
import {
  HCDashboard,
  CreateRequestPage,
  RequestSuccessPage,
  RequestDetailPage,
  HCRequestsPage,
  HCFindBloodPage,
  HCMapPage,
  HCNotificationsPage,
  HCProfilePage,
} from "./pages/healthcare/HealthcarePages";

// Admin pages
import {
  AdminDashboard,
  AdminDonorsPage,
  AdminBloodBanksPage,
  AdminHealthcarePage,
  AdminVerificationPage,
  AdminEmergencyPage,
  AdminAnalyticsPage,
  AdminPlatformPage,
  AdminNotificationsPage,
  AdminSettingsPage,
} from "./pages/admin/AdminPages";

// ─── Simple public pages ──────────────────────────────────────────────────────
function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9]">
      <PublicNav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16">
        <h1 className="text-4xl font-extrabold text-[#172033] mb-4" style={{ fontFamily: "Manrope" }}>How LifeDrop Works</h1>
        <p className="text-gray-500 mb-12 text-lg">From emergency to match in minutes — the LifeDrop process explained.</p>
        <div className="space-y-8">
          {[
            { n: "01", t: "Search", d: "Anyone can search live blood availability near them — no login required. Search by blood group, component, and location." },
            { n: "02", t: "Request", d: "Verified healthcare centres log in and create emergency requests. They specify blood group, component, units, urgency, and search radius." },
            { n: "03", t: "Match", d: "LifeDrop instantly alerts all eligible donors within the selected radius. Donors can accept or decline in seconds." },
            { n: "04", t: "Fulfill", d: "The matched donor and healthcare centre coordinate directly through the platform until the request is fulfilled." },
          ].map(s => (
            <div key={s.n} className="flex gap-6">
              <div className="w-12 h-12 rounded-xl bg-[#D7263D] text-white flex items-center justify-center font-black text-sm flex-shrink-0" style={{ fontFamily: "Manrope" }}>{s.n}</div>
              <div>
                <h3 className="text-xl font-bold text-[#172033] mb-2" style={{ fontFamily: "Manrope" }}>{s.t}</h3>
                <p className="text-gray-500 leading-relaxed">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ForDonorsPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 bg-[#F6F7F9] py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold text-[#172033] mb-4" style={{ fontFamily: "Manrope" }}>For Donors</h1>
          <p className="text-gray-500 mb-8 text-lg">Join 4,820 donors helping save lives across India.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
            {[["Receive verified emergency alerts near you", "🔔"], ["Track donation history and eligibility", "📋"], ["Earn recognition for your contributions", "🏅"]].map(([t, i]) => (
              <div key={t} className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-start gap-3">
                <span className="text-xl">{i}</span>
                <p className="text-sm text-gray-700">{t}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/donor/register")} className="bg-[#D7263D] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#B01E30] transition-colors text-base">Become a Donor</button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ForHealthcarePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 bg-[#F6F7F9] py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold text-[#172033] mb-4" style={{ fontFamily: "Manrope" }}>For Healthcare Centres</h1>
          <p className="text-gray-500 mb-8 text-lg">Create emergency requests and connect with donors instantly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
            {[["Raise emergency blood requests", "🚨"], ["Alert nearby eligible donors instantly", "📡"], ["Track request status in real time", "📊"]].map(([t, i]) => (
              <div key={t} className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-start gap-3">
                <span className="text-xl">{i}</span>
                <p className="text-sm text-gray-700">{t}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/healthcare/register")} className="bg-[#D7263D] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#B01E30] transition-colors text-base">Register Your Centre</button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/find-blood" element={<FindBloodPage />} />
      <Route path="/blood-bank/:id" element={<BloodBankDetailsPage />} />
      <Route path="/blood-banks" element={<FindBloodPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/for-donors" element={<ForDonorsPage />} />
      <Route path="/for-healthcare" element={<ForHealthcarePage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/donor/login" element={<RoleLoginPage />} />
      <Route path="/blood-bank/login" element={<RoleLoginPage />} />
      <Route path="/healthcare/login" element={<RoleLoginPage />} />
      <Route path="/admin/login" element={<RoleLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/donor/register" element={<DonorRegisterPage />} />
      <Route path="/blood-bank/register" element={<OrgRegisterPage />} />
      <Route path="/healthcare/register" element={<OrgRegisterPage />} />

      {/* Donor */}
      <Route path="/donor/dashboard" element={<DonorDashboard />} />
      <Route path="/donor/requests" element={<EmergencyRequestsPage />} />
      <Route path="/donor/map" element={<DonorMapPage />} />
      <Route path="/donor/history" element={<DonationHistoryPage />} />
      <Route path="/donor/rewards" element={<RewardsPage />} />
      <Route path="/donor/notifications" element={<DonorNotificationsPage />} />
      <Route path="/donor/profile" element={<DonorProfilePage />} />

      {/* Blood Bank */}
      <Route path="/blood-bank/dashboard" element={<BBDashboard />} />
      <Route path="/blood-bank/inventory" element={<BBInventory />} />
      <Route path="/blood-bank/expiry" element={<ExpiryTrackingPage />} />
      <Route path="/blood-bank/requests" element={<BBRequestsPage />} />
      <Route path="/blood-bank/analytics" element={<BBAnalyticsPage />} />
      <Route path="/blood-bank/notifications" element={<BBNotificationsPage />} />
      <Route path="/blood-bank/activity" element={<BBStockActivityPage />} />
      <Route path="/blood-bank/hospitals" element={<BBHospitalsPage />} />
      <Route path="/blood-bank/profile" element={<BBProfilePage />} />

      {/* Healthcare */}
      <Route path="/healthcare/dashboard" element={<HCDashboard />} />
      <Route path="/healthcare/create-request" element={<CreateRequestPage />} />
      <Route path="/healthcare/request-success" element={<RequestSuccessPage />} />
      <Route path="/healthcare/requests" element={<HCRequestsPage />} />
      <Route path="/healthcare/requests/:id" element={<RequestDetailPage />} />
      <Route path="/healthcare/find-blood" element={<HCFindBloodPage />} />
      <Route path="/healthcare/map" element={<HCMapPage />} />
      <Route path="/healthcare/notifications" element={<HCNotificationsPage />} />
      <Route path="/healthcare/profile" element={<HCProfilePage />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/donors" element={<AdminDonorsPage />} />
      <Route path="/admin/blood-banks" element={<AdminBloodBanksPage />} />
      <Route path="/admin/healthcare" element={<AdminHealthcarePage />} />
      <Route path="/admin/verification" element={<AdminVerificationPage />} />
      <Route path="/admin/emergency" element={<AdminEmergencyPage />} />
      <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
      <Route path="/admin/platform" element={<AdminPlatformPage />} />
      <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
      <Route path="/admin/settings" element={<AdminSettingsPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
