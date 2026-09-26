import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";
import DashboardLayout from "../../components/DashboardLayout";
import { Button, Card, Modal, useToast, EmptyState } from "../../components/ui";
import { BLOOD_GROUPS, COMPONENTS, bloodBanks } from "../../data";
import { useTheme } from "../../context/ThemeContext";

const HC_CENTER: [number, number] = [22.548, 88.3421];

const HC_HOSPITAL_ICON = L.divIcon({
  html: `<div style="display:flex;flex-direction:column;align-items:center">
    <div style="background:#2563EB;color:#fff;font-size:10px;font-weight:700;padding:4px 10px;border-radius:6px;box-shadow:0 2px 8px rgba(37,99,235,0.4);white-space:nowrap">CityCare Medical Centre</div>
    <div style="width:2px;height:8px;background:#2563EB;opacity:0.6"></div>
    <div style="width:14px;height:14px;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.4)"></div>
  </div>`,
  className: "",
  iconSize: [160, 40],
  iconAnchor: [80, 40],
});

function makeDonorIcon(color: string, group: string) {
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="background:${color};color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;box-shadow:0 2px 6px rgba(0,0,0,0.2);white-space:nowrap">${group}</div>
      <div style="width:2px;height:8px;background:${color};opacity:0.6"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.15)"></div>
    </div>`,
    className: "",
    iconSize: [44, 34],
    iconAnchor: [22, 34],
  });
}

const HC_DONORS = [
  { id: 1, pos: [22.573, 88.362] as [number, number], name: "Aarav Mehta", group: "O−", distance: "3.4 km", status: "Accepted", color: "#D7263D" },
  { id: 2, pos: [22.513, 88.312] as [number, number], name: "Anonymous", group: "A+", distance: "≈5 km zone", status: "Awaiting", color: "#F59E0B" },
  { id: 3, pos: [22.553, 88.407] as [number, number], name: "Anonymous", group: "B+", distance: "≈7 km zone", status: "Awaiting", color: "#F59E0B" },
  { id: 4, pos: [22.523, 88.312] as [number, number], name: "Priya Sharma", group: "A+", distance: "4.2 km", status: "Accepted", color: "#2563EB" },
  { id: 5, pos: [22.583, 88.390] as [number, number], name: "Rohan Gupta", group: "B+", distance: "6.1 km", status: "Completed", color: "#16A34A" },
].map(d => ({ ...d, icon: makeDonorIcon(d.color, d.group) }));

// ─── Config ───────────────────────────────────────────────────────────────────
// Swap HC_STATUS to "PENDING" or "REJECTED" to test banners
type VerificationStatus = "VERIFIED" | "PENDING" | "REJECTED";
const HC_STATUS: VerificationStatus = "VERIFIED";
const HC_NAME = "CityCare Medical Centre";
const HC_TYPE = "Multi-Specialty Hospital";
const HC_REG = "WB-HOS-2018-1124";
const HC_ADDR = "1 Hospital Road, Park Street, Kolkata — 700 016";
const HC_LAT = "22.5480° N";
const HC_LNG = "88.3421° E";
const HC_PHONE = "+91 33 2227 5500";
const HC_EMAIL = "emergency@citycaremc.in";
const HC_CONTACT = "Dr. Ananya Roy";
const HC_VERIFIED_ON = "12 Aug 2026, 3:45 PM";

// ─── Types ────────────────────────────────────────────────────────────────────
type RequestUrgency = "Low" | "Medium" | "High" | "Critical";
type RequestStatus = "Pending" | "Active" | "Partially Fulfilled" | "Fulfilled" | "Closed";
type DonorResponseStatus = "Awaiting" | "Accepted" | "Declined" | "Completed";

interface RequestLineItem {
  bloodGroup: string;
  component: string;
  unitsRequired: number;
  unitsReceived: number;
  donorResponses: number;
}

interface HCRequest {
  id: string;
  patientRef: string;
  dateRaised: string;
  urgency: RequestUrgency;
  status: RequestStatus;
  items: RequestLineItem[];
  radius: number;
  totalDonorResponses: number;
  contactPerson: string;
  contactPhone: string;
  notes?: string;
}

interface DonorResponse {
  id: string;
  donorName: string;
  bloodGroup: string;
  distance: string;
  reliability: number;
  responseStatus: DonorResponseStatus;
  respondedAt: string;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────
const HC_REQUESTS: HCRequest[] = [
  {
    id: "LR-2026-09421",
    patientRef: "P-2026-0091",
    dateRaised: "26 Sep 2026, 10:32 AM",
    urgency: "Critical",
    status: "Active",
    items: [
      { bloodGroup: "O−", component: "Whole Blood", unitsRequired: 2, unitsReceived: 1, donorResponses: 2 },
    ],
    radius: 10,
    totalDonorResponses: 2,
    contactPerson: "Dr. Ananya Roy",
    contactPhone: "+91 98765 00001",
  },
  {
    id: "LR-2026-09418",
    patientRef: "P-2026-0088",
    dateRaised: "26 Sep 2026, 09:45 AM",
    urgency: "High",
    status: "Active",
    items: [
      { bloodGroup: "A+", component: "Platelets", unitsRequired: 4, unitsReceived: 0, donorResponses: 0 },
      { bloodGroup: "A+", component: "Plasma", unitsRequired: 2, unitsReceived: 0, donorResponses: 0 },
    ],
    radius: 10,
    totalDonorResponses: 0,
    contactPerson: "Dr. Saurabh Bose",
    contactPhone: "+91 98765 00002",
  },
  {
    id: "LR-2026-09415",
    patientRef: "P-2026-0085",
    dateRaised: "26 Sep 2026, 08:00 AM",
    urgency: "Medium",
    status: "Partially Fulfilled",
    items: [
      { bloodGroup: "B+", component: "Whole Blood", unitsRequired: 6, unitsReceived: 3, donorResponses: 5 },
    ],
    radius: 25,
    totalDonorResponses: 5,
    contactPerson: "Dr. Pradeep Kumar",
    contactPhone: "+91 98765 00003",
  },
  {
    id: "LR-2026-09410",
    patientRef: "P-2026-0079",
    dateRaised: "25 Sep 2026, 03:15 PM",
    urgency: "Critical",
    status: "Fulfilled",
    items: [
      { bloodGroup: "AB−", component: "Plasma", unitsRequired: 3, unitsReceived: 3, donorResponses: 4 },
      { bloodGroup: "AB−", component: "Platelets", unitsRequired: 2, unitsReceived: 2, donorResponses: 2 },
    ],
    radius: 15,
    totalDonorResponses: 4,
    contactPerson: "Dr. Ananya Roy",
    contactPhone: "+91 98765 00001",
  },
  {
    id: "LR-2026-09405",
    patientRef: "P-2026-0072",
    dateRaised: "25 Sep 2026, 11:00 AM",
    urgency: "Low",
    status: "Closed",
    items: [
      { bloodGroup: "O+", component: "Whole Blood", unitsRequired: 3, unitsReceived: 3, donorResponses: 6 },
    ],
    radius: 10,
    totalDonorResponses: 6,
    contactPerson: "Dr. Ananya Roy",
    contactPhone: "+91 98765 00001",
    notes: "Closed after successful completion.",
  },
  {
    id: "LR-2026-09398",
    patientRef: "P-2026-0065",
    dateRaised: "24 Sep 2026, 09:00 AM",
    urgency: "High",
    status: "Fulfilled",
    items: [
      { bloodGroup: "A−", component: "Whole Blood", unitsRequired: 4, unitsReceived: 4, donorResponses: 7 },
    ],
    radius: 20,
    totalDonorResponses: 7,
    contactPerson: "Dr. Ananya Roy",
    contactPhone: "+91 98765 00001",
  },
];

const DONOR_RESPONSES: Record<string, DonorResponse[]> = {
  "LR-2026-09421": [
    { id: "dr1", donorName: "Aarav Mehta", bloodGroup: "O−", distance: "3.4 km", reliability: 96, responseStatus: "Accepted", respondedAt: "5 min ago" },
    { id: "dr2", donorName: "Anonymous", bloodGroup: "O−", distance: "≈6 km zone", reliability: 81, responseStatus: "Awaiting", respondedAt: "2 min ago" },
  ],
  "LR-2026-09415": [
    { id: "dr3", donorName: "Rohan Gupta", bloodGroup: "B+", distance: "4.8 km", reliability: 72, responseStatus: "Completed", respondedAt: "1 hr ago" },
    { id: "dr4", donorName: "Karthik Rajan", bloodGroup: "B+", distance: "7.1 km", reliability: 85, responseStatus: "Accepted", respondedAt: "45 min ago" },
    { id: "dr5", donorName: "Priya Sharma", bloodGroup: "B+", distance: "2.3 km", reliability: 91, responseStatus: "Completed", respondedAt: "30 min ago" },
    { id: "dr6", donorName: "Anonymous", bloodGroup: "B+", distance: "≈9 km zone", reliability: 67, responseStatus: "Declined", respondedAt: "20 min ago" },
    { id: "dr7", donorName: "Anonymous", bloodGroup: "B+", distance: "≈5 km zone", reliability: 80, responseStatus: "Awaiting", respondedAt: "10 min ago" },
  ],
  "LR-2026-09410": [
    { id: "dr8", donorName: "Divya Nair", bloodGroup: "AB−", distance: "2.1 km", reliability: 93, responseStatus: "Completed", respondedAt: "8 hr ago" },
    { id: "dr9", donorName: "Arjun Singh", bloodGroup: "AB−", distance: "5.6 km", reliability: 78, responseStatus: "Completed", respondedAt: "7 hr ago" },
    { id: "dr10", donorName: "Meera Pillai", bloodGroup: "AB−", distance: "3.9 km", reliability: 89, responseStatus: "Completed", respondedAt: "6 hr ago" },
    { id: "dr11", donorName: "Anonymous", bloodGroup: "AB−", distance: "≈11 km zone", reliability: 74, responseStatus: "Declined", respondedAt: "5 hr ago" },
  ],
  "LR-2026-09405": [
    { id: "dr12", donorName: "Sneha Iyer", bloodGroup: "O+", distance: "1.8 km", reliability: 94, responseStatus: "Completed", respondedAt: "1 day ago" },
    { id: "dr13", donorName: "Ravi Krishnan", bloodGroup: "O+", distance: "3.2 km", reliability: 88, responseStatus: "Completed", respondedAt: "1 day ago" },
    { id: "dr14", donorName: "Nisha Kapoor", bloodGroup: "O+", distance: "4.4 km", reliability: 76, responseStatus: "Completed", respondedAt: "1 day ago" },
    { id: "dr15", donorName: "Anonymous", bloodGroup: "O+", distance: "≈6 km zone", reliability: 70, responseStatus: "Declined", respondedAt: "1 day ago" },
    { id: "dr16", donorName: "Anonymous", bloodGroup: "O+", distance: "≈7 km zone", reliability: 65, responseStatus: "Declined", respondedAt: "1 day ago" },
    { id: "dr17", donorName: "Anonymous", bloodGroup: "O+", distance: "≈8 km zone", reliability: 82, responseStatus: "Awaiting", respondedAt: "1 day ago" },
  ],
  "LR-2026-09398": [
    { id: "dr18", donorName: "Vikram Sood", bloodGroup: "A−", distance: "2.9 km", reliability: 91, responseStatus: "Completed", respondedAt: "2 days ago" },
    { id: "dr19", donorName: "Pooja Mishra", bloodGroup: "A−", distance: "4.7 km", reliability: 83, responseStatus: "Completed", respondedAt: "2 days ago" },
    { id: "dr20", donorName: "Suresh Nair", bloodGroup: "A−", distance: "6.3 km", reliability: 77, responseStatus: "Completed", respondedAt: "2 days ago" },
    { id: "dr21", donorName: "Anika Joshi", bloodGroup: "A−", distance: "8.1 km", reliability: 86, responseStatus: "Completed", respondedAt: "2 days ago" },
    { id: "dr22", donorName: "Anonymous", bloodGroup: "A−", distance: "≈12 km zone", reliability: 69, responseStatus: "Declined", respondedAt: "2 days ago" },
    { id: "dr23", donorName: "Anonymous", bloodGroup: "A−", distance: "≈15 km zone", reliability: 74, responseStatus: "Declined", respondedAt: "2 days ago" },
    { id: "dr24", donorName: "Anonymous", bloodGroup: "A−", distance: "≈18 km zone", reliability: 71, responseStatus: "Awaiting", respondedAt: "2 days ago" },
  ],
};

// ─── Helper Components ────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }: { urgency: RequestUrgency }) {
  const configs: Record<RequestUrgency, string> = {
    Low: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/50",
    Medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50",
    High: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50",
    Critical: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${configs[urgency]}`}>
      {urgency === "Critical" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 animate-pulse" />}
      {urgency}
    </span>
  );
}

function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const configs: Record<RequestStatus, string> = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50",
    Active: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50",
    "Partially Fulfilled": "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50",
    Fulfilled: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50",
    Closed: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${configs[status]}`}>
      {status}
    </span>
  );
}

function DonorStatusBadge({ status }: { status: DonorResponseStatus }) {
  const configs: Record<DonorResponseStatus, string> = {
    Awaiting: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50",
    Accepted: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50",
    Declined: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600",
    Completed: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${configs[status]}`}>
      {status}
    </span>
  );
}

function ProgressBar({ value, max, colorClass = "bg-[#D7263D]" }: { value: number; max: number; colorClass?: string }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 dark:text-slate-400">{value} / {max} units</span>
        <span className="text-xs font-bold text-[#172033] dark:text-slate-200">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-[#1C2A3E] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ReliabilityDot({ score }: { score: number }) {
  const color = score >= 90 ? "bg-green-500" : score >= 75 ? "bg-amber-400" : "bg-orange-400";
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
      <span className="text-xs text-gray-600 dark:text-slate-300">{score}%</span>
    </span>
  );
}

// ─── Verification Banner ──────────────────────────────────────────────────────
function VerificationBanner() {
  if (HC_STATUS === "VERIFIED") return null;

  if (HC_STATUS === "PENDING") {
    return (
      <div className="mb-5 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3.5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Verification pending — documents under review</p>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5 leading-relaxed">
            Your registration documents are being reviewed by the LifeDrop team. You can prepare draft requests, but submission is disabled until verification is complete. This typically takes 1–2 business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3.5">
      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-red-700 dark:text-red-400">Verification rejected — action required</p>
        <p className="text-xs text-red-600 dark:text-red-500 mt-0.5 leading-relaxed">
          Your application was not approved. Please review the rejection reason in your Profile and resubmit updated documents. Contact <span className="font-semibold">support@lifedrop.in</span> if you need assistance.
        </p>
      </div>
    </div>
  );
}

// ─── Healthcare Dashboard ─────────────────────────────────────────────────────
export function HCDashboard() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("All");

  const totalRequests = HC_REQUESTS.length;
  const activeRequests = HC_REQUESTS.filter(r => r.status === "Active" || r.status === "Pending" || r.status === "Partially Fulfilled").length;
  const totalResponses = HC_REQUESTS.reduce((sum, r) => sum + r.totalDonorResponses, 0);
  const fulfilledRequests = HC_REQUESTS.filter(r => r.status === "Fulfilled").length;

  const recentRequests = HC_REQUESTS.slice(0, 5);
  const filteredRecent = recentRequests.filter(r => {
    const statusOk = statusFilter === "All" || r.status === statusFilter;
    const urgencyOk = urgencyFilter === "All" || r.urgency === urgencyFilter;
    return statusOk && urgencyOk;
  });

  const activeProgressRequests = HC_REQUESTS.filter(r => r.status === "Active" || r.status === "Partially Fulfilled");

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider font-medium">Healthcare Centre Dashboard</p>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
            Welcome back, {HC_NAME}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <p className="text-sm text-gray-500 dark:text-slate-400">Manage your blood requests and track donor responses in real time.</p>
            {HC_STATUS === "VERIFIED" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified Centre
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={() => navigate("/healthcare/create-request")}
          disabled={HC_STATUS !== "VERIFIED"}
          size="lg"
          className="flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Raise Blood Request
        </Button>
      </div>

      <VerificationBanner />

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Blood Requests",
            value: totalRequests,
            sub: "Since registration",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ),
            accent: false,
          },
          {
            label: "Active Requests",
            value: activeRequests,
            sub: "Pending + Active + Partial",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
            accent: true,
          },
          {
            label: "Total Donor Responses",
            value: totalResponses,
            sub: "Across all requests",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
            accent: false,
          },
          {
            label: "Fulfilled Requests",
            value: fulfilledRequests,
            sub: "Completed successfully",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            accent: false,
          },
        ].map((card) => (
          <Card key={card.label} className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 leading-tight">{card.label}</p>
                <p
                  className={`text-2xl font-extrabold mt-1.5 ${card.accent ? "text-[#D7263D]" : "text-[#172033] dark:text-slate-100"}`}
                  style={{ fontFamily: "Manrope" }}
                >
                  {card.value}
                </p>
                {card.sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{card.sub}</p>}
              </div>
              <div className={`p-2 rounded-lg flex-shrink-0 ${card.accent ? "bg-[#FFF0F2] dark:bg-[#D7263D]/10 text-[#D7263D]" : "bg-[#F6F7F9] dark:bg-[#1C2A3E] text-gray-400 dark:text-slate-500"}`}>
                {card.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Blood Requests */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
            Recent Blood Requests
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {/* Status filter */}
            <div className="flex gap-1 flex-wrap">
              {["All", "Active", "Partially Fulfilled", "Fulfilled", "Closed"].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    statusFilter === s
                      ? "bg-[#172033] dark:bg-[#D7263D] text-white border-[#172033] dark:border-[#D7263D]"
                      : "bg-white dark:bg-[#152030] text-gray-500 dark:text-slate-400 border-[#E5E7EB] dark:border-[#1E2D40] hover:border-gray-300 dark:hover:border-slate-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <select
              value={urgencyFilter}
              onChange={e => setUrgencyFilter(e.target.value)}
              className="px-2.5 py-1 text-xs font-medium border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-gray-600 dark:text-slate-300 focus:border-[#D7263D] focus:outline-none"
            >
              {["All", "Low", "Medium", "High", "Critical"].map(u => (
                <option key={u} value={u}>{u === "All" ? "All Urgency" : u}</option>
              ))}
            </select>
            <Button variant="ghost" size="sm" onClick={() => navigate("/healthcare/requests")}>
              View All
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F6F7F9] dark:bg-[#1C2A3E] border-b border-[#E5E7EB] dark:border-[#1E2D40]">
                  {["Request ID", "Date Raised", "Blood Group / Component", "Units Req.", "Urgency", "Responses", "Status", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F6F7F9] dark:divide-[#1E2D40]">
                {filteredRecent.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-slate-500">
                      No requests match the selected filters.
                    </td>
                  </tr>
                ) : filteredRecent.map(req => {
                  const primaryItem = req.items[0];
                  const totalUnits = req.items.reduce((s, i) => s + i.unitsRequired, 0);
                  return (
                    <tr key={req.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1C2A3E]/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-bold text-[#172033] dark:text-slate-200">{req.id}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{req.dateRaised}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-[#FFF0F2] dark:bg-[#D7263D]/10 flex items-center justify-center text-xs font-extrabold text-[#D7263D] flex-shrink-0">
                            {primaryItem.bloodGroup}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-[#172033] dark:text-slate-200">{primaryItem.component}</p>
                            {req.items.length > 1 && (
                              <p className="text-xs text-gray-400 dark:text-slate-500">+{req.items.length - 1} more item{req.items.length > 2 ? "s" : ""}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#172033] dark:text-slate-200">{totalUnits}u</td>
                      <td className="px-4 py-3"><UrgencyBadge urgency={req.urgency} /></td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-[#172033] dark:text-slate-200">{req.totalDonorResponses}</span>
                      </td>
                      <td className="px-4 py-3"><RequestStatusBadge status={req.status} /></td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/healthcare/requests/${req.id}`)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Active Request Progress */}
      {activeProgressRequests.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
              Track Active Requests
            </h2>
            <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-[#1C2A3E] px-2.5 py-1 rounded-full">
              {activeProgressRequests.length} active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeProgressRequests.map(req => {
              const totalRequired = req.items.reduce((s, i) => s + i.unitsRequired, 0);
              const totalReceived = req.items.reduce((s, i) => s + i.unitsReceived, 0);
              const pct = totalRequired === 0 ? 0 : Math.round((totalReceived / totalRequired) * 100);
              return (
                <Card key={req.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-mono font-bold text-gray-400 dark:text-slate-500">{req.id}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <UrgencyBadge urgency={req.urgency} />
                        <RequestStatusBadge status={req.status} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>{pct}%</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">fulfilled</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    {req.items.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-6 h-6 rounded bg-[#FFF0F2] dark:bg-[#D7263D]/10 flex items-center justify-center text-xs font-bold text-[#D7263D]">
                            {item.bloodGroup}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-slate-400">{item.component}</span>
                          <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">{item.donorResponses} response{item.donorResponses !== 1 ? "s" : ""}</span>
                        </div>
                        <ProgressBar
                          value={item.unitsReceived}
                          max={item.unitsRequired}
                          colorClass={pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-[#D7263D]" : "bg-amber-500"}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#F6F7F9] dark:border-[#1E2D40]">
                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">
                      {req.totalDonorResponses} donor response{req.totalDonorResponses !== 1 ? "s" : ""} · {req.radius} km radius
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/healthcare/requests/${req.id}`)}
                    >
                      Track Request
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for no requests */}
      {HC_REQUESTS.length === 0 && (
        <Card className="mb-8">
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="No blood requests yet"
            description="When you raise your first emergency blood request, it will appear here along with donor responses and fulfilment progress."
            action={
              <Button onClick={() => navigate("/healthcare/create-request")} disabled={HC_STATUS !== "VERIFIED"}>
                Raise Your First Request
              </Button>
            }
          />
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-[#172033] dark:text-slate-100 mb-4" style={{ fontFamily: "Manrope" }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Raise New Request",
              desc: "Create an emergency request",
              to: "/healthcare/create-request",
              primary: true,
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
                </svg>
              ),
              disabled: HC_STATUS !== "VERIFIED",
            },
            {
              label: "Request History",
              desc: "View all past requests",
              to: "/healthcare/requests",
              primary: false,
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              disabled: false,
            },
            {
              label: "Track Active Requests",
              desc: "Monitor fulfilment progress",
              to: "/healthcare/requests?filter=active",
              primary: false,
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              disabled: false,
            },
            {
              label: "Centre Profile",
              desc: "View and edit centre info",
              to: "/healthcare/profile",
              primary: false,
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ),
              disabled: false,
            },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => !action.disabled && navigate(action.to)}
              disabled={action.disabled}
              className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all group ${
                action.primary
                  ? "bg-[#D7263D] border-[#D7263D] text-white hover:bg-[#B01E30] hover:border-[#B01E30] shadow-sm"
                  : "bg-white dark:bg-[#152030] border-[#E5E7EB] dark:border-[#1E2D40] hover:border-[#D7263D]/30 dark:hover:border-[#D7263D]/30 hover:shadow-sm"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <div className={`mb-2.5 ${action.primary ? "text-white/90" : "text-[#D7263D]"}`}>
                {action.icon}
              </div>
              <p className={`text-sm font-bold leading-tight ${action.primary ? "text-white" : "text-[#172033] dark:text-slate-100"}`}>
                {action.label}
              </p>
              <p className={`text-xs mt-0.5 ${action.primary ? "text-white/70" : "text-gray-400 dark:text-slate-500"}`}>
                {action.disabled ? "Verification required" : action.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Request Detail Page ──────────────────────────────────────────────────────
export function RequestDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { show, ToastEl } = useToast();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closed, setClosed] = useState(false);

  const req = HC_REQUESTS.find(r => r.id === id);
  const donorResponses = DONOR_RESPONSES[id || ""] || [];

  if (!req) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">Request not found.</p>
          <Button variant="outline" onClick={() => navigate("/healthcare/requests")}>Back to Requests</Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalRequired = req.items.reduce((s, i) => s + i.unitsRequired, 0);
  const totalReceived = req.items.reduce((s, i) => s + i.unitsReceived, 0);
  const totalPct = totalRequired === 0 ? 0 : Math.round((totalReceived / totalRequired) * 100);

  const responseCount = {
    Accepted: donorResponses.filter(d => d.responseStatus === "Accepted").length,
    Awaiting: donorResponses.filter(d => d.responseStatus === "Awaiting").length,
    Completed: donorResponses.filter(d => d.responseStatus === "Completed").length,
    Declined: donorResponses.filter(d => d.responseStatus === "Declined").length,
  };

  const handleClose = () => {
    setClosed(true);
    setShowCloseConfirm(false);
    show("Request closed successfully", "success");
  };

  return (
    <DashboardLayout>
      {ToastEl}
      <Modal open={showCloseConfirm} onClose={() => setShowCloseConfirm(false)} title="Close Request">
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
          Are you sure you want to close request <span className="font-mono font-bold text-[#172033] dark:text-slate-200">{req.id}</span>? This will stop further donor notifications. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="destructive" className="flex-1" onClick={handleClose}>Close Request</Button>
          <Button variant="secondary" className="flex-1" onClick={() => setShowCloseConfirm(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Back */}
      <button
        onClick={() => navigate("/healthcare/requests")}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-[#D7263D] transition-colors mb-5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Request History
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
              {req.id}
            </h1>
            <UrgencyBadge urgency={req.urgency} />
            <RequestStatusBadge status={closed ? "Closed" : req.status} />
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Raised {req.dateRaised} · Patient ref: <span className="font-mono font-semibold">{req.patientRef}</span> · {req.radius} km radius
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate("/healthcare/map")}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            View Live Map
          </Button>
          {!closed && (req.status === "Active" || req.status === "Pending" || req.status === "Partially Fulfilled") && (
            <Button variant="secondary" onClick={() => setShowCloseConfirm(true)}>
              Close Request
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Fulfilment Progress */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
                Fulfilment Progress
              </h2>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
                  {totalPct}%
                </span>
                <p className="text-xs text-gray-400 dark:text-slate-500">overall</p>
              </div>
            </div>

            {/* Overall bar */}
            <div className="mb-4">
              <div className="h-3 bg-gray-100 dark:bg-[#1C2A3E] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${totalPct === 100 ? "bg-green-500" : totalPct >= 50 ? "bg-[#D7263D]" : "bg-amber-500"}`}
                  style={{ width: `${totalPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                {totalReceived} of {totalRequired} total units confirmed. Donor responses do not guarantee fulfilment — confirmation happens at point of donation.
              </p>
            </div>

            {/* Per-item breakdown */}
            <div className="space-y-4">
              {req.items.map((item, idx) => {
                const itemPct = item.unitsRequired === 0 ? 0 : Math.round((item.unitsReceived / item.unitsRequired) * 100);
                return (
                  <div key={idx} className="bg-[#F9FAFB] dark:bg-[#1C2A3E] rounded-xl p-4 border border-[#F0F0F0] dark:border-[#1E2D40]">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-9 h-9 rounded-lg bg-[#FFF0F2] dark:bg-[#D7263D]/10 flex items-center justify-center text-sm font-extrabold text-[#D7263D]">
                        {item.bloodGroup}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#172033] dark:text-slate-200">{item.component}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{item.donorResponses} donor response{item.donorResponses !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="text-sm font-bold text-[#172033] dark:text-slate-200">{itemPct}%</span>
                    </div>
                    <ProgressBar
                      value={item.unitsReceived}
                      max={item.unitsRequired}
                      colorClass={itemPct === 100 ? "bg-green-500" : itemPct >= 50 ? "bg-[#D7263D]" : "bg-amber-500"}
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Donor Responses */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
                Donor Responses
              </h2>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(responseCount).filter(([, v]) => v > 0).map(([k, v]) => (
                  <span key={k} className="text-xs font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-[#1C2A3E] px-2 py-0.5 rounded-full">
                    {k}: {v}
                  </span>
                ))}
              </div>
            </div>

            {donorResponses.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">
                No donor responses yet. Donors within {req.radius} km are being notified.
              </div>
            ) : (
              <div className="space-y-2">
                {donorResponses.map(donor => (
                  <div
                    key={donor.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#F9FAFB] dark:bg-[#1C2A3E] border border-[#F0F0F0] dark:border-[#1E2D40]"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#E5E7EB] dark:bg-[#243345] flex items-center justify-center text-sm font-bold text-[#172033] dark:text-slate-200 flex-shrink-0">
                      {donor.responseStatus === "Awaiting" ? "?" : donor.donorName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#172033] dark:text-slate-200 truncate">{donor.donorName}</p>
                        <span className="text-xs font-bold text-[#D7263D] bg-[#FFF0F2] dark:bg-[#D7263D]/10 px-1.5 py-0.5 rounded">
                          {donor.bloodGroup}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500 dark:text-slate-400">{donor.distance}</span>
                        <ReliabilityDot score={donor.reliability} />
                        <span className="text-xs text-gray-400 dark:text-slate-500">{donor.respondedAt}</span>
                      </div>
                    </div>
                    <DonorStatusBadge status={donor.responseStatus} />
                  </div>
                ))}
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 px-1">
                  Donors who have not yet accepted show approximate zone distances only. Precise location is shared only after acceptance.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right column — Request Info */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-bold text-[#172033] dark:text-slate-100 mb-3" style={{ fontFamily: "Manrope" }}>
              Request Information
            </h3>
            <div className="space-y-3">
              {[
                { label: "Request ID", value: req.id, mono: true },
                { label: "Patient Ref.", value: req.patientRef, mono: true },
                { label: "Date Raised", value: req.dateRaised },
                { label: "Contact", value: req.contactPerson },
                { label: "Phone", value: req.contactPhone },
                { label: "Search Radius", value: `${req.radius} km` },
              ].map(f => (
                <div key={f.label} className="flex flex-col gap-0.5">
                  <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">{f.label}</p>
                  <p className={`text-sm text-[#172033] dark:text-slate-200 ${f.mono ? "font-mono font-bold" : "font-medium"}`}>
                    {f.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-[#172033] dark:text-slate-100 mb-3" style={{ fontFamily: "Manrope" }}>
              Response Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Accepted", value: responseCount.Accepted, color: "text-blue-600 dark:text-blue-400" },
                { label: "Completed", value: responseCount.Completed, color: "text-green-600 dark:text-green-400" },
                { label: "Awaiting", value: responseCount.Awaiting, color: "text-amber-600 dark:text-amber-400" },
                { label: "Declined", value: responseCount.Declined, color: "text-gray-400 dark:text-slate-500" },
              ].map(s => (
                <div key={s.label} className="bg-[#F9FAFB] dark:bg-[#1C2A3E] rounded-lg p-3 text-center">
                  <p className={`text-xl font-extrabold ${s.color}`} style={{ fontFamily: "Manrope" }}>{s.value}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {req.notes && (
            <Card className="p-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-gray-600 dark:text-slate-400">{req.notes}</p>
            </Card>
          )}

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
            Donor response counts indicate intent, not confirmed donation. All donors undergo medical screening at the point of donation.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Raise Blood Request ──────────────────────────────────────────────────────
interface NewRequestItem { id: number; bloodGroup: string; component: string; units: number }
let itemSeq = 1;

export function CreateRequestPage() {
  const navigate = useNavigate();
  const { show, ToastEl } = useToast();
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [urgency, setUrgency] = useState<"Low" | "Medium" | "High" | "Critical">("High");
  const [radius, setRadius] = useState(10);
  const [requiredBy, setRequiredBy] = useState("");
  const [contactPerson, setContactPerson] = useState("Dr. Ananya Roy");
  const [contactPhone, setContactPhone] = useState("+91 98765 00001");
  const [patientRef, setPatientRef] = useState("P-2026-0092");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<NewRequestItem[]>([
    { id: itemSeq++, bloodGroup: "O−", component: "Whole Blood", units: 2 },
  ]);

  const addItem = () => setItems(prev => [...prev, { id: itemSeq++, bloodGroup: "O+", component: "Whole Blood", units: 1 }]);
  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: number, field: keyof NewRequestItem, value: string | number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const donorCount = radius <= 5 ? 11 : radius <= 10 ? 24 : radius <= 15 ? 31 : radius <= 20 ? 38 : 52;
  const totalUnits = items.reduce((s, i) => s + i.units, 0);

  const urgencyConfigs: Record<string, { active: string; desc: string }> = {
    Low: { active: "bg-sky-500 text-white border-sky-500", desc: "Non-urgent — standard matching process." },
    Medium: { active: "bg-amber-500 text-white border-amber-500", desc: "Required within 24–48 hours." },
    High: { active: "bg-orange-500 text-white border-orange-500", desc: "Urgent — same-day requirement." },
    Critical: { active: "bg-red-600 text-white border-red-600", desc: "Life-threatening — donors notified immediately with push alerts." },
  };

  const handleDraft = async () => {
    setSavingDraft(true);
    await new Promise(r => setTimeout(r, 800));
    setSavingDraft(false);
    show("Draft saved successfully", "success");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { show("Add at least one blood group item", "error"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    navigate("/healthcare/request-success", { state: { items, urgency, radius } });
  };

  return (
    <DashboardLayout>
      {ToastEl}
      <div className="max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-[#D7263D] transition-colors mb-5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
            Raise Blood Request
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Eligible donors within the selected radius will be notified immediately upon submission.
          </p>
        </div>

        {HC_STATUS !== "VERIFIED" && (
          <div className="mb-5 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3.5">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Submission disabled</p>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                Your centre is not yet verified. You can prepare a draft and save it. Submission will be available once verification is complete.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Reference */}
          <Card className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Patient Reference ID</label>
                <input
                  type="text"
                  value={patientRef}
                  onChange={e => setPatientRef(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none focus:ring-2 focus:ring-[#D7263D]/20"
                  placeholder="P-2026-0001"
                />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Internal only — no sensitive patient data collected.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Required By</label>
                <input
                  type="datetime-local"
                  value={requiredBy}
                  onChange={e => setRequiredBy(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Blood Requirements */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[#172033] dark:text-slate-100">Blood Requirements</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Add one row per blood group and component needed.</p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#D7263D] hover:text-[#B01E30] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.id} className="bg-[#F9FAFB] dark:bg-[#1C2A3E] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Item {idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Blood Group */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-slate-400 block mb-2">Blood Group</label>
                      <div className="grid grid-cols-4 gap-1">
                        {BLOOD_GROUPS.map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => updateItem(item.id, "bloodGroup", g)}
                            className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                              item.bloodGroup === g
                                ? "bg-[#D7263D] text-white border-[#D7263D]"
                                : "bg-white dark:bg-[#152030] text-gray-600 dark:text-slate-400 border-[#E5E7EB] dark:border-[#1E2D40] hover:border-[#D7263D]/50"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Component */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-slate-400 block mb-2">Component</label>
                      <div className="space-y-1.5">
                        {COMPONENTS.map(c => (
                          <label
                            key={c}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs font-medium transition-all ${
                              item.component === c
                                ? "border-[#D7263D] bg-[#FFF0F2] dark:bg-[#D7263D]/10 text-[#D7263D]"
                                : "border-[#E5E7EB] dark:border-[#1E2D40] text-gray-600 dark:text-slate-400 bg-white dark:bg-[#152030]"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`comp-${item.id}`}
                              checked={item.component === c}
                              onChange={() => updateItem(item.id, "component", c)}
                              className="text-[#D7263D] accent-[#D7263D]"
                            />
                            {c}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Units */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-slate-400 block mb-2">Units Required</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, "units", Math.max(1, item.units - 1))}
                          className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#1E2D40] bg-white dark:bg-[#152030] font-bold text-gray-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
                          {item.units}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, "units", Math.min(20, item.units + 1))}
                          className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#1E2D40] bg-white dark:bg-[#152030] font-bold text-gray-600 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Max 20 per item</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Urgency */}
          <Card className="p-5">
            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-3">Urgency Level</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {(["Low", "Medium", "High", "Critical"] as const).map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgency(u)}
                  className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                    urgency === u
                      ? urgencyConfigs[u].active
                      : "bg-white dark:bg-[#152030] text-gray-500 dark:text-slate-400 border-[#E5E7EB] dark:border-[#1E2D40] hover:border-gray-300 dark:hover:border-slate-500"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">{urgencyConfigs[urgency].desc}</p>
          </Card>

          {/* Search Radius */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Donor Search Radius</label>
              <span className="text-sm font-bold text-[#D7263D]">{radius} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="w-full accent-[#D7263D] mb-2"
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mb-3">
              <span>1 km</span>
              <span>25 km</span>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                <span className="font-bold">{donorCount} eligible donors</span> within {radius} km right now
              </p>
            </div>
          </Card>

          {/* Contact */}
          <Card className="p-5">
            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-3">Contact Details</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-slate-400 block mb-1">Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-slate-400 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium text-gray-500 dark:text-slate-400 block mb-1">Additional Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none resize-none"
                placeholder="Any special instructions for donors..."
              />
            </div>
          </Card>

          {/* Summary */}
          <div className="bg-[#F6F7F9] dark:bg-[#1C2A3E] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Request Summary</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
              {[
                { l: "Items", v: items.length },
                { l: "Total Units", v: totalUnits },
                { l: "Urgency", v: urgency },
                { l: "Radius", v: `${radius} km` },
                { l: "Donors available", v: donorCount },
              ].map(({ l, v }) => (
                <div key={l}>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{l}</p>
                  <p className="font-bold text-[#172033] dark:text-slate-100">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {items.map(item => (
                <span
                  key={item.id}
                  className="text-xs font-bold bg-[#FFF0F2] dark:bg-[#D7263D]/10 text-[#D7263D] px-2.5 py-1 rounded-full border border-[#D7263D]/20"
                >
                  {item.bloodGroup} · {item.component} · {item.units}u
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="flex-1"
              loading={savingDraft}
              onClick={handleDraft}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              loading={loading}
              disabled={HC_STATUS !== "VERIFIED"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {HC_STATUS !== "VERIFIED" ? "Verification Required" : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

// ─── Request Success ──────────────────────────────────────────────────────────
export function RequestSuccessPage() {
  const navigate = useNavigate();
  const [donorsAccepted, setDonorsAccepted] = useState(0);
  const [matched, setMatched] = useState(0);
  const [status, setStatus] = useState<"Active" | "Partially Fulfilled" | "Fulfilled">("Active");

  const simulateResponse = () => {
    setTimeout(() => setDonorsAccepted(2), 1500);
    setTimeout(() => { setMatched(1); setStatus("Partially Fulfilled"); }, 3000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        {/* Success banner */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-5 flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 border-2 border-green-200 dark:border-green-700 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-green-800 dark:text-green-400" style={{ fontFamily: "Manrope" }}>
              Blood request is live
            </h1>
            <p className="text-sm text-green-600 dark:text-green-500">
              Donors within the selected radius are being notified now.
            </p>
          </div>
        </div>

        <Card className="p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>LR-2026-09422</h2>
            <RequestStatusBadge status={status} />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Donors notified", value: 24, color: "text-[#172033] dark:text-slate-100" },
              { label: "Responded", value: donorsAccepted, color: "text-[#D7263D]" },
              { label: "Matched", value: matched, color: "text-indigo-600 dark:text-indigo-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#F6F7F9] dark:bg-[#1C2A3E] rounded-xl p-3 text-center">
                <p className={`text-2xl font-extrabold ${s.color}`} style={{ fontFamily: "Manrope" }}>{s.value}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="border-t border-[#F6F7F9] dark:border-[#1E2D40] pt-4 mb-4">
            <div className="flex items-center gap-2">
              {(["Active", "Partially Fulfilled", "Fulfilled"] as const).map((s, i) => {
                const idx = status === "Active" ? 0 : status === "Partially Fulfilled" ? 1 : 2;
                const done = i <= idx;
                return (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? "bg-[#D7263D] text-white" : "bg-gray-100 dark:bg-[#1C2A3E] text-gray-400 dark:text-slate-500"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs font-semibold hidden sm:block ${done ? "text-[#172033] dark:text-slate-200" : "text-gray-400 dark:text-slate-500"}`}>{s}</span>
                    {i < 2 && <div className={`h-0.5 flex-1 ${i < idx ? "bg-[#D7263D]" : "bg-gray-200 dark:bg-[#1E2D40]"}`} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {status === "Active" && (
              <Button variant="outline" className="flex-1" onClick={simulateResponse}>
                Simulate Donor Response
              </Button>
            )}
            {status === "Partially Fulfilled" && (
              <Button className="flex-1" onClick={() => setStatus("Fulfilled")}>
                Mark as Fulfilled
              </Button>
            )}
            {status === "Fulfilled" && (
              <div className="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-3 text-center">
                <p className="text-green-700 dark:text-green-400 font-bold">Request fulfilled ✓</p>
              </div>
            )}
            <Button variant="secondary" onClick={() => navigate("/healthcare/requests")}>
              View All Requests
            </Button>
          </div>
        </Card>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-500">
          Donors remain subject to medical screening at the point of donation. Response counts indicate intent, not guaranteed fulfilment.
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Request History ──────────────────────────────────────────────────────────
export function HCRequestsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const filtered = HC_REQUESTS.filter(r => {
    const statusOk = statusFilter === "All" || r.status === statusFilter;
    const urgencyOk = urgencyFilter === "All" || r.urgency === urgencyFilter;
    const searchOk = search === "" ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.patientRef.toLowerCase().includes(search.toLowerCase()) ||
      r.items.some(i => i.bloodGroup.toLowerCase().includes(search.toLowerCase()) || i.component.toLowerCase().includes(search.toLowerCase()));
    return statusOk && urgencyOk && searchOk;
  });

  return (
    <DashboardLayout>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
            Request History
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {HC_REQUESTS.length} total requests
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/healthcare/create-request")} disabled={HC_STATUS !== "VERIFIED"}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Raise Request
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by ID, patient ref, blood group..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none focus:ring-2 focus:ring-[#D7263D]/20"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-gray-600 dark:text-slate-300 focus:border-[#D7263D] focus:outline-none"
          >
            {["All", "Pending", "Active", "Partially Fulfilled", "Fulfilled", "Closed"].map(s => (
              <option key={s} value={s}>{s === "All" ? "All Status" : s}</option>
            ))}
          </select>
          <select
            value={urgencyFilter}
            onChange={e => setUrgencyFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-gray-600 dark:text-slate-300 focus:border-[#D7263D] focus:outline-none"
          >
            {["All", "Low", "Medium", "High", "Critical"].map(u => (
              <option key={u} value={u}>{u === "All" ? "All Urgency" : u}</option>
            ))}
          </select>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F6F7F9] dark:bg-[#1C2A3E] border-b border-[#E5E7EB] dark:border-[#1E2D40]">
                {["Request ID", "Date Raised", "Blood Group / Component", "Units", "Urgency", "Responses", "Status", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6F7F9] dark:divide-[#1E2D40]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      }
                      title="No requests found"
                      description={search ? "No requests match your search query." : "No requests match the selected filters."}
                      action={
                        search
                          ? <Button variant="ghost" size="sm" onClick={() => setSearch("")}>Clear search</Button>
                          : <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("All"); setUrgencyFilter("All"); }}>Clear filters</Button>
                      }
                    />
                  </td>
                </tr>
              ) : filtered.map(req => {
                const primaryItem = req.items[0];
                const totalUnits = req.items.reduce((s, i) => s + i.unitsRequired, 0);
                return (
                  <tr key={req.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1C2A3E]/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono font-bold text-[#172033] dark:text-slate-200">{req.id}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{req.dateRaised}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-[#FFF0F2] dark:bg-[#D7263D]/10 flex items-center justify-center text-xs font-extrabold text-[#D7263D] flex-shrink-0">
                          {primaryItem.bloodGroup}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-[#172033] dark:text-slate-200">{primaryItem.component}</p>
                          {req.items.length > 1 && (
                            <p className="text-xs text-gray-400 dark:text-slate-500">+{req.items.length - 1} more</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-[#172033] dark:text-slate-200">{totalUnits}u</td>
                    <td className="px-4 py-3.5"><UrgencyBadge urgency={req.urgency} /></td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-[#172033] dark:text-slate-200">{req.totalDonorResponses}</span>
                    </td>
                    <td className="px-4 py-3.5"><RequestStatusBadge status={req.status} /></td>
                    <td className="px-4 py-3.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/healthcare/requests/${req.id}`)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-[#F6F7F9] dark:border-[#1E2D40] text-xs text-gray-400 dark:text-slate-500">
            Showing {filtered.length} of {HC_REQUESTS.length} requests
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}

// ─── Find Blood ───────────────────────────────────────────────────────────────
export function HCFindBloodPage() {
  const navigate = useNavigate();
  const [groupFilter, setGroupFilter] = useState("Any");
  const [componentFilter, setComponentFilter] = useState("Any");
  const [radiusFilter, setRadiusFilter] = useState("25 km");

  const filtered = bloodBanks.filter(bank => {
    const radiusNum = parseInt(radiusFilter);
    const withinRadius = bank.distanceNum <= radiusNum;
    if (!withinRadius) return false;
    if (groupFilter !== "Any") {
      const inv = bank.inventory.find(i => i.group === groupFilter);
      if (!inv) return false;
      if (componentFilter === "Whole Blood" && inv.wholeBlood === 0) return false;
      if (componentFilter === "Platelets" && inv.platelets === 0) return false;
      if (componentFilter === "Plasma" && inv.plasma === 0) return false;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Find Blood</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Search live inventory from nearby verified blood banks</p>
      </div>

      <div className="bg-[#F6F7F9] dark:bg-[#1C2A3E] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-xl p-4 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none"
          >
            <option value="Any">Any blood group</option>
            {["A+","A−","B+","B−","AB+","AB−","O+","O−"].map(g => <option key={g}>{g}</option>)}
          </select>
          <select
            value={componentFilter}
            onChange={e => setComponentFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none"
          >
            <option value="Any">Any component</option>
            {["Whole Blood","Platelets","Plasma"].map(c => <option key={c}>{c}</option>)}
          </select>
          <select
            value={radiusFilter}
            onChange={e => setRadiusFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none"
          >
            {["5 km","10 km","25 km","50 km"].map(r => <option key={r}>{r}</option>)}
          </select>
          <p className="text-xs text-gray-500 dark:text-slate-400 self-center">
            {filtered.length} blood bank{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(bank => (
          <Card key={bank.id} className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#172033] dark:text-slate-100">{bank.name}</h3>
                  {bank.verified && (
                    <span className="text-xs font-semibold text-green-700 dark:text-green-400">✓ Verified</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400">{bank.address} · {bank.distance}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Updated {bank.lastUpdate} · {bank.openHours}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 flex-wrap">
                  {bank.inventory.filter(i => ["O−","O+","A+","B+"].includes(i.group)).map(inv => (
                    <div key={inv.group} className="text-center bg-[#F6F7F9] dark:bg-[#1C2A3E] rounded-lg px-2.5 py-1.5">
                      <p className="text-xs font-bold text-[#172033] dark:text-slate-200">{inv.group}</p>
                      <p className={`text-xs font-semibold ${inv.wholeBlood === 0 ? "text-red-600 dark:text-red-400" : inv.wholeBlood <= 2 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}>
                        {inv.wholeBlood}u
                      </p>
                    </div>
                  ))}
                </div>
                <a href={`tel:${bank.phone}`}>
                  <Button variant="outline" size="sm">Call</Button>
                </a>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <EmptyState
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            title="No blood banks found"
            description="No verified blood banks match your search criteria. Try expanding the search radius or changing filters."
            action={<Button variant="ghost" size="sm" onClick={() => { setGroupFilter("Any"); setComponentFilter("Any"); setRadiusFilter("25 km"); }}>Reset filters</Button>}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Live Donor Map ───────────────────────────────────────────────────────────
export function HCMapPage() {
  const [selectedDonor, setSelectedDonor] = useState<{ name: string; group: string; distance: string; status: string } | null>(null);
  const [isLive, setIsLive] = useState(true);
  const { theme } = useTheme();
  const tileUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <DashboardLayout>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
            Live Donor Map
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            CityCare Medical Centre · Active request: LR-2026-09421
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            <span className="text-xs font-semibold text-gray-600 dark:text-slate-400">
              {isLive ? "Live" : "Paused"}
            </span>
          </div>
          <button
            onClick={() => setIsLive(l => !l)}
            className="text-xs font-semibold text-[#D7263D] hover:text-[#B01E30] border border-[#D7263D]/30 hover:border-[#D7263D] px-2.5 py-1 rounded-lg transition-colors"
          >
            {isLive ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      {/* Fulfilment summary strip */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
        {[
          { label: "Donors Notified", value: "24", color: "text-[#172033] dark:text-slate-100" },
          { label: "Responded", value: "2", color: "text-amber-600 dark:text-amber-400" },
          { label: "Accepted", value: "1", color: "text-blue-600 dark:text-blue-400" },
          { label: "Completed", value: "1", color: "text-green-600 dark:text-green-400" },
          { label: "Units Confirmed", value: "1 / 2", color: "text-[#D7263D]" },
        ].map(s => (
          <Card key={s.label} className="p-3 text-center">
            <p className={`text-xl font-extrabold ${s.color}`} style={{ fontFamily: "Manrope" }}>{s.value}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Map */}
        <div className="flex-1 relative rounded-2xl border border-[#D1D9F0] dark:border-[#1E2D40] overflow-hidden" style={{ height: "480px" }}>
          <MapContainer center={HC_CENTER} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl>
            <TileLayer
              url={tileUrl}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <Circle
              center={HC_CENTER}
              radius={5000}
              pathOptions={{ color: "#2563EB", fillColor: "#2563EB", fillOpacity: 0.04, weight: 1.5, dashArray: "8 5" }}
            />
            <Circle
              center={HC_CENTER}
              radius={10000}
              pathOptions={{ color: "#2563EB", fillColor: "#2563EB", fillOpacity: 0.02, weight: 1, dashArray: "5 8" }}
            />
            <Marker position={HC_CENTER} icon={HC_HOSPITAL_ICON} />
            {HC_DONORS.map(d => (
              <Marker
                key={d.id}
                position={d.pos}
                icon={d.icon}
                eventHandlers={{ click: () => setSelectedDonor({ name: d.name, group: d.group, distance: d.distance, status: d.status }) }}
              />
            ))}
          </MapContainer>

          {/* Legend */}
          <div
            className="absolute bottom-4 left-4 bg-white dark:bg-[#152030] rounded-xl border border-[#E5E7EB] dark:border-[#1E2D40] shadow-sm p-3 space-y-1.5 text-xs"
            style={{ zIndex: 1100 }}
          >
            <div className="font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1" style={{ fontSize: "10px" }}>Legend</div>
            {[
              { dot: "#2563EB", label: "Your Centre" },
              { dot: "#D7263D", label: "Accepted (exact)" },
              { dot: "#F59E0B", label: "Awaiting (zone only)" },
              { dot: "#16A34A", label: "Completed" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2 text-[#172033] dark:text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.dot }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Live indicator */}
          <div
            className="absolute top-4 right-4 flex items-center gap-1.5 bg-white dark:bg-[#152030] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg px-2.5 py-1.5 shadow-sm"
            style={{ zIndex: 1100 }}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            <span className="text-xs font-semibold text-gray-600 dark:text-slate-400">{isLive ? "Live updates" : "Paused"}</span>
          </div>

          {/* Donor info popup */}
          {selectedDonor && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-[#152030] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-xl shadow-xl p-3 min-w-48" style={{ zIndex: 1100 }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#172033] dark:text-slate-100">{selectedDonor.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-[#D7263D] bg-[#FFF0F2] dark:bg-[#D7263D]/10 px-1.5 py-0.5 rounded">
                      {selectedDonor.group}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">{selectedDonor.distance}</span>
                  </div>
                  <DonorStatusBadge status={selectedDonor.status as DonorResponseStatus} />
                </div>
                <button
                  onClick={() => setSelectedDonor(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {selectedDonor.status === "Awaiting" && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Precise location hidden until donor accepts.</p>
              )}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="lg:w-64 space-y-3">
          <Card className="p-4">
            <h3 className="font-bold text-[#172033] dark:text-slate-100 text-sm mb-3">Active Request</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500">Request ID</p>
                <p className="text-xs font-mono font-bold text-[#172033] dark:text-slate-200">LR-2026-09421</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500">Blood Needed</p>
                <p className="text-sm font-bold text-[#D7263D]">O− · Whole Blood · 2u</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500">Urgency</p>
                <UrgencyBadge urgency="Critical" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500">Radius</p>
                <p className="text-sm font-semibold text-[#172033] dark:text-slate-200">10 km</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-bold text-[#172033] dark:text-slate-100 text-sm mb-3">Nearby Donors</h3>
            <div className="space-y-2">
              {HC_DONORS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDonor({ name: d.name, group: d.group, distance: d.distance, status: d.status })}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-[#1C2A3E] transition-colors text-left"
                >
                  <span className="w-6 h-6 rounded text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: d.color }}>
                    {d.group.replace("−", "-")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#172033] dark:text-slate-200 truncate">{d.name}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{d.distance}</p>
                  </div>
                  <DonorStatusBadge status={d.status as DonorResponseStatus} />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function HCNotificationsPage() {
  const [read, setRead] = useState<Set<number>>(new Set());

  const notifications = [
    { id: 0, title: "Donor accepted LR-2026-09421", body: "Aarav Mehta (O−, 3.4 km) has accepted your request. Contact the donor to confirm arrival.", time: "5 min ago", dot: "bg-[#D7263D]", type: "match" },
    { id: 1, title: "No donors matched yet — LR-2026-09418", body: "Request for A+ Platelets has been active for 55 minutes. Consider expanding the search radius.", time: "55 min ago", dot: "bg-amber-500", type: "alert" },
    { id: 2, title: "Request LR-2026-09415 — Partially Fulfilled", body: "3 of 6 B+ Whole Blood units confirmed. 2 donors have accepted.", time: "1 hr ago", dot: "bg-indigo-500", type: "progress" },
    { id: 3, title: "Request LR-2026-09410 fulfilled", body: "All AB− Plasma and Platelets units for request LR-2026-09410 have been fulfilled.", time: "8 hr ago", dot: "bg-green-500", type: "success" },
    { id: 4, title: "Account verification complete", body: "CityCare Medical Centre has been verified. You can now submit blood requests.", time: "12 Aug 2026", dot: "bg-green-600", type: "success" },
  ];

  const markAllRead = () => setRead(new Set(notifications.map(n => n.id)));

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
          Notifications
        </h1>
        {read.size < notifications.length && (
          <button
            onClick={markAllRead}
            className="text-sm font-semibold text-[#D7263D] hover:text-[#B01E30] transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map(n => (
          <Card
            key={n.id}
            onClick={() => setRead(prev => new Set([...prev, n.id]))}
            className={`p-4 cursor-pointer ${!read.has(n.id) ? "border-l-4 border-l-[#D7263D]" : ""}`}
          >
            <div className="flex items-start gap-3">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${n.dot}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!read.has(n.id) ? "font-bold text-[#172033] dark:text-slate-100" : "font-medium text-gray-600 dark:text-slate-300"}`}>
                  {n.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.body}</p>
                <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">{n.time}</p>
              </div>
              {!read.has(n.id) && (
                <span className="w-2 h-2 rounded-full bg-[#D7263D] flex-shrink-0 mt-1.5" />
              )}
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

// ─── Profile & Verification ───────────────────────────────────────────────────
export function HCProfilePage() {
  const { show, ToastEl } = useToast();
  const [editing, setEditing] = useState(false);
  const [contactPerson, setContactPerson] = useState(HC_CONTACT);
  const [phone, setPhone] = useState(HC_PHONE);
  const [email, setEmail] = useState(HC_EMAIL);

  const handleSave = () => {
    setEditing(false);
    show("Centre profile updated", "success");
  };

  const verificationConfig = {
    VERIFIED: {
      bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50",
      icon: (
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      title: "Verified Centre",
      desc: `Your centre has been verified by the LifeDrop admin team. Reviewed on ${HC_VERIFIED_ON}.`,
      textColor: "text-green-800 dark:text-green-400",
      subColor: "text-green-600 dark:text-green-500",
    },
    PENDING: {
      bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50",
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      title: "Verification Pending",
      desc: "Your registration documents are under review. This typically takes 1–2 business days.",
      textColor: "text-amber-800 dark:text-amber-400",
      subColor: "text-amber-600 dark:text-amber-500",
    },
    REJECTED: {
      bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50",
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
      title: "Verification Rejected",
      desc: "Your application was not approved. Please resubmit with updated documents or contact support@lifedrop.in.",
      textColor: "text-red-700 dark:text-red-400",
      subColor: "text-red-500 dark:text-red-500",
    },
  }[HC_STATUS];

  return (
    <DashboardLayout>
      {ToastEl}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
            Profile & Verification
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">View and manage your healthcare centre information.</p>
        </div>
        {!editing ? (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save Changes</Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        )}
      </div>

      <div className="max-w-2xl space-y-5">
        {/* Verification Status */}
        <div className={`flex items-start gap-3 border rounded-xl px-4 py-4 ${verificationConfig.bg}`}>
          <div className="mt-0.5 flex-shrink-0">{verificationConfig.icon}</div>
          <div>
            <p className={`text-sm font-bold ${verificationConfig.textColor}`}>{verificationConfig.title}</p>
            <p className={`text-xs mt-0.5 ${verificationConfig.subColor}`}>{verificationConfig.desc}</p>
          </div>
        </div>

        {/* Centre Identity */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-[#D7263D] flex items-center justify-center text-white text-xl font-extrabold flex-shrink-0">
              CC
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>
                {HC_NAME}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">{HC_TYPE}</p>
            </div>
          </div>

          <div className="space-y-0">
            {[
              { label: "Registration Number", value: HC_REG, editable: false, icon: "📋" },
              { label: "Type", value: HC_TYPE, editable: false, icon: "🏥" },
              { label: "Address", value: HC_ADDR, editable: false, icon: "📍" },
              { label: "Coordinates", value: `${HC_LAT}, ${HC_LNG}`, editable: false, icon: "🗺️" },
            ].map(f => (
              <div key={f.label} className="flex items-start gap-3 py-3 border-b border-[#F6F7F9] dark:border-[#1E2D40] last:border-0">
                <span className="text-base flex-shrink-0 mt-0.5">{f.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">{f.label}</p>
                  <p className="text-sm font-semibold text-[#172033] dark:text-slate-200 mt-0.5">{f.value}</p>
                </div>
                <span className="text-xs text-gray-300 dark:text-slate-600 bg-gray-100 dark:bg-[#1C2A3E] px-2 py-0.5 rounded">Read-only</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Editable Contact */}
        <Card className="p-6">
          <h3 className="font-bold text-[#172033] dark:text-slate-100 mb-4" style={{ fontFamily: "Manrope" }}>
            Contact Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                Emergency Contact Person
              </label>
              {editing ? (
                <input
                  type="text"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none focus:ring-2 focus:ring-[#D7263D]/20"
                />
              ) : (
                <p className="text-sm font-semibold text-[#172033] dark:text-slate-200">{contactPerson}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                Phone
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none focus:ring-2 focus:ring-[#D7263D]/20"
                />
              ) : (
                <p className="text-sm font-semibold text-[#172033] dark:text-slate-200">{phone}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                Email
              </label>
              {editing ? (
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none focus:ring-2 focus:ring-[#D7263D]/20"
                />
              ) : (
                <p className="text-sm font-semibold text-[#172033] dark:text-slate-200">{email}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Registration Document */}
        <Card className="p-6">
          <h3 className="font-bold text-[#172033] dark:text-slate-100 mb-4" style={{ fontFamily: "Manrope" }}>
            Registration Document
          </h3>
          <div className="flex items-center gap-3 p-3 bg-[#F6F7F9] dark:bg-[#1C2A3E] rounded-xl border border-[#E5E7EB] dark:border-[#1E2D40]">
            <div className="w-10 h-10 rounded-lg bg-[#D7263D]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#D7263D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#172033] dark:text-slate-200">CityCare_HC_Registration.pdf</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">Uploaded 11 Aug 2026 · 340 KB</p>
            </div>
            <button className="text-xs font-semibold text-[#D7263D] hover:text-[#B01E30] transition-colors">
              View
            </button>
          </div>
          {HC_STATUS === "REJECTED" && (
            <div className="mt-3">
              <Button variant="outline" size="sm" className="w-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Resubmit Document
              </Button>
            </div>
          )}
        </Card>

        {/* Verification history */}
        {HC_STATUS === "VERIFIED" && (
          <Card className="p-5">
            <h3 className="font-bold text-[#172033] dark:text-slate-100 mb-3" style={{ fontFamily: "Manrope" }}>
              Verification History
            </h3>
            <div className="space-y-3">
              {[
                { event: "Centre verified", date: HC_VERIFIED_ON, dot: "bg-green-500" },
                { event: "Documents reviewed", date: "12 Aug 2026, 2:30 PM", dot: "bg-blue-500" },
                { event: "Documents submitted", date: "11 Aug 2026, 9:15 AM", dot: "bg-gray-400" },
                { event: "Account created", date: "11 Aug 2026, 9:00 AM", dot: "bg-gray-400" },
              ].map(ev => (
                <div key={ev.event} className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ev.dot}`} />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-sm text-[#172033] dark:text-slate-200">{ev.event}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{ev.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
