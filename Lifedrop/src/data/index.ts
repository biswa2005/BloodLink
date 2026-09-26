export const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"] as const;
export type BloodGroup = typeof BLOOD_GROUPS[number];

export const COMPONENTS = ["Whole Blood", "Platelets", "Plasma"] as const;
export type BloodComponent = typeof COMPONENTS[number];

export type AvailabilityStatus = "Available" | "Low Stock" | "Out of Stock";

export interface BloodUnit {
  group: BloodGroup;
  wholeBlood: number;
  platelets: number;
  plasma: number;
  lastUpdated: string;
}

export interface BloodBank {
  id: string;
  name: string;
  verified: boolean;
  distance: string;
  distanceNum: number;
  address: string;
  city: string;
  phone: string;
  email: string;
  openHours: string;
  lastUpdate: string;
  inventory: BloodUnit[];
  status: "Verified" | "Pending" | "Rejected" | "Suspended";
  lat: number;
  lng: number;
}

export interface Donor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  city: string;
  lastDonation: string;
  totalDonations: number;
  eligibility: "Eligible" | "Not Eligible";
  nextEligible?: string;
  status: "Active" | "Suspended";
  phone: string;
  email: string;
  radius: number;
  joinedYear: number;
}

export interface HealthcareCentre {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  verified: boolean;
  status: "Verified" | "Pending" | "Rejected" | "Suspended";
  phone: string;
  email: string;
  registrationNumber: string;
  emergencyContact: string;
}

export interface EmergencyRequest {
  id: string;
  patientRef: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  units: number;
  urgency: "Critical" | "Urgent" | "Standard";
  status: "Open" | "Donor Matched" | "Fulfilled" | "Cancelled" | "Expired" | "Flagged";
  healthcareCentre: string;
  location: string;
  createdAt: string;
  requiredBy: string;
  donorsNotified: number;
  accepted: number;
  matched: number;
  radius: number;
  requestedAgo: string;
  contactPerson: string;
  contactPhone: string;
}

export const bloodBanks: BloodBank[] = [
  {
    id: "bb1",
    name: "CityCare Blood Centre",
    verified: true,
    distance: "2.1 km",
    distanceNum: 2.1,
    address: "14 Lansdowne Road, Park Street",
    city: "Kolkata",
    phone: "+91 33 2221 4400",
    email: "contact@citycareblood.in",
    openHours: "24/7",
    lastUpdate: "4 min ago",
    status: "Verified",
    lat: 22.545,
    lng: 88.342,
    inventory: [
      { group: "A+", wholeBlood: 8, platelets: 3, plasma: 5, lastUpdated: "4 min ago" },
      { group: "A−", wholeBlood: 2, platelets: 0, plasma: 1, lastUpdated: "4 min ago" },
      { group: "B+", wholeBlood: 6, platelets: 2, plasma: 4, lastUpdated: "4 min ago" },
      { group: "B−", wholeBlood: 3, platelets: 1, plasma: 2, lastUpdated: "4 min ago" },
      { group: "AB+", wholeBlood: 4, platelets: 2, plasma: 3, lastUpdated: "4 min ago" },
      { group: "AB−", wholeBlood: 1, platelets: 0, plasma: 1, lastUpdated: "4 min ago" },
      { group: "O+", wholeBlood: 10, platelets: 4, plasma: 6, lastUpdated: "4 min ago" },
      { group: "O−", wholeBlood: 1, platelets: 0, plasma: 2, lastUpdated: "4 min ago" },
    ]
  },
  {
    id: "bb2",
    name: "LifeLine Blood Bank",
    verified: true,
    distance: "3.8 km",
    distanceNum: 3.8,
    address: "22 Elgin Road, Alipore",
    city: "Kolkata",
    phone: "+91 33 2458 7900",
    email: "info@lifelineblood.in",
    openHours: "6:00 AM – 10:00 PM",
    lastUpdate: "12 min ago",
    status: "Verified",
    lat: 22.531,
    lng: 88.348,
    inventory: [
      { group: "A+", wholeBlood: 12, platelets: 5, plasma: 8, lastUpdated: "12 min ago" },
      { group: "A−", wholeBlood: 4, platelets: 2, plasma: 3, lastUpdated: "12 min ago" },
      { group: "B+", wholeBlood: 9, platelets: 3, plasma: 5, lastUpdated: "12 min ago" },
      { group: "B−", wholeBlood: 2, platelets: 0, plasma: 1, lastUpdated: "12 min ago" },
      { group: "AB+", wholeBlood: 6, platelets: 3, plasma: 4, lastUpdated: "12 min ago" },
      { group: "AB−", wholeBlood: 2, platelets: 1, plasma: 2, lastUpdated: "12 min ago" },
      { group: "O+", wholeBlood: 14, platelets: 6, plasma: 9, lastUpdated: "12 min ago" },
      { group: "O−", wholeBlood: 3, platelets: 1, plasma: 2, lastUpdated: "12 min ago" },
    ]
  },
  {
    id: "bb3",
    name: "Metro Blood Centre",
    verified: true,
    distance: "5.2 km",
    distanceNum: 5.2,
    address: "7 AJC Bose Road, Bhowanipore",
    city: "Kolkata",
    phone: "+91 33 2280 3311",
    email: "metro@metroblood.in",
    openHours: "8:00 AM – 8:00 PM",
    lastUpdate: "38 min ago",
    status: "Verified",
    lat: 22.521,
    lng: 88.335,
    inventory: [
      { group: "A+", wholeBlood: 5, platelets: 2, plasma: 3, lastUpdated: "38 min ago" },
      { group: "A−", wholeBlood: 1, platelets: 0, plasma: 0, lastUpdated: "38 min ago" },
      { group: "B+", wholeBlood: 4, platelets: 1, plasma: 3, lastUpdated: "38 min ago" },
      { group: "B−", wholeBlood: 1, platelets: 0, plasma: 1, lastUpdated: "38 min ago" },
      { group: "AB+", wholeBlood: 2, platelets: 1, plasma: 2, lastUpdated: "38 min ago" },
      { group: "AB−", wholeBlood: 0, platelets: 0, plasma: 0, lastUpdated: "38 min ago" },
      { group: "O+", wholeBlood: 7, platelets: 2, plasma: 4, lastUpdated: "38 min ago" },
      { group: "O−", wholeBlood: 0, platelets: 0, plasma: 1, lastUpdated: "38 min ago" },
    ]
  },
  {
    id: "bb4",
    name: "RedCare Blood Bank",
    verified: false,
    distance: "7.1 km",
    distanceNum: 7.1,
    address: "45 Gariahat Road, Ballygunge",
    city: "Kolkata",
    phone: "+91 33 2461 9900",
    email: "redcare@redcare.in",
    openHours: "9:00 AM – 6:00 PM",
    lastUpdate: "2 hr ago",
    status: "Pending",
    lat: 22.511,
    lng: 88.363,
    inventory: [
      { group: "A+", wholeBlood: 3, platelets: 1, plasma: 2, lastUpdated: "2 hr ago" },
      { group: "A−", wholeBlood: 0, platelets: 0, plasma: 0, lastUpdated: "2 hr ago" },
      { group: "B+", wholeBlood: 2, platelets: 0, plasma: 1, lastUpdated: "2 hr ago" },
      { group: "B−", wholeBlood: 0, platelets: 0, plasma: 0, lastUpdated: "2 hr ago" },
      { group: "AB+", wholeBlood: 1, platelets: 0, plasma: 1, lastUpdated: "2 hr ago" },
      { group: "AB−", wholeBlood: 0, platelets: 0, plasma: 0, lastUpdated: "2 hr ago" },
      { group: "O+", wholeBlood: 4, platelets: 1, plasma: 2, lastUpdated: "2 hr ago" },
      { group: "O−", wholeBlood: 0, platelets: 0, plasma: 0, lastUpdated: "2 hr ago" },
    ]
  }
];

export const donors: Donor[] = [
  { id: "d1", name: "Aarav Mehta", bloodGroup: "O+", city: "Kolkata", lastDonation: "12 Jun 2026", totalDonations: 6, eligibility: "Eligible", status: "Active", phone: "+91 98765 43210", email: "aarav.mehta@email.com", radius: 10, joinedYear: 2024 },
  { id: "d2", name: "Priya Sharma", bloodGroup: "A+", city: "Kolkata", lastDonation: "15 Jul 2026", totalDonations: 4, eligibility: "Eligible", status: "Active", phone: "+91 98765 43211", email: "priya.sharma@email.com", radius: 10, joinedYear: 2023 },
  { id: "d3", name: "Rohan Gupta", bloodGroup: "O−", city: "Bengaluru", lastDonation: "20 Aug 2026", totalDonations: 2, eligibility: "Not Eligible", nextEligible: "20 Nov 2026", status: "Active", phone: "+91 98765 43212", email: "rohan.gupta@email.com", radius: 25, joinedYear: 2025 },
  { id: "d4", name: "Sneha Iyer", bloodGroup: "B+", city: "Mumbai", lastDonation: "3 Apr 2026", totalDonations: 8, eligibility: "Eligible", status: "Active", phone: "+91 98765 43213", email: "sneha.iyer@email.com", radius: 5, joinedYear: 2022 },
  { id: "d5", name: "Karthik Rajan", bloodGroup: "AB+", city: "Chennai", lastDonation: "11 May 2026", totalDonations: 3, eligibility: "Eligible", status: "Active", phone: "+91 98765 43214", email: "karthik.rajan@email.com", radius: 15, joinedYear: 2024 },
  { id: "d6", name: "Divya Nair", bloodGroup: "A−", city: "Hyderabad", lastDonation: "28 Feb 2026", totalDonations: 5, eligibility: "Eligible", status: "Suspended", phone: "+91 98765 43215", email: "divya.nair@email.com", radius: 10, joinedYear: 2023 },
  { id: "d7", name: "Arjun Singh", bloodGroup: "O+", city: "Delhi", lastDonation: "9 Sep 2026", totalDonations: 1, eligibility: "Not Eligible", nextEligible: "9 Dec 2026", status: "Active", phone: "+91 98765 43216", email: "arjun.singh@email.com", radius: 5, joinedYear: 2026 },
  { id: "d8", name: "Meera Pillai", bloodGroup: "B−", city: "Pune", lastDonation: "18 Jan 2026", totalDonations: 7, eligibility: "Eligible", status: "Active", phone: "+91 98765 43217", email: "meera.pillai@email.com", radius: 25, joinedYear: 2022 },
];

export const healthcareCentres: HealthcareCentre[] = [
  { id: "hc1", name: "CityCare Medical Centre", type: "Hospital", address: "1 Hospital Road, Park Street", city: "Kolkata", verified: true, status: "Verified", phone: "+91 33 2227 5500", email: "emergency@citycaremc.in", registrationNumber: "WB-HOS-2018-1124", emergencyContact: "Dr. Ananya Roy" },
  { id: "hc2", name: "Metro Health Centre", type: "Clinic", address: "8 Rashbehari Avenue", city: "Kolkata", verified: true, status: "Verified", phone: "+91 33 2285 8811", email: "info@metrohc.in", registrationNumber: "WB-CLN-2019-2201", emergencyContact: "Dr. Saurabh Bose" },
  { id: "hc3", name: "Apollo City Hospital", type: "Hospital", address: "58 Canal Circular Road", city: "Kolkata", verified: true, status: "Verified", phone: "+91 33 2320 6600", email: "admin@apollocity.in", registrationNumber: "WB-HOS-2015-0341", emergencyContact: "Dr. Pradeep Kumar" },
  { id: "hc4", name: "LifeLine Hospital", type: "Hospital", address: "12 Anwar Shah Road", city: "Kolkata", verified: false, status: "Pending", phone: "+91 33 2470 1122", email: "info@lifelinehospital.in", registrationNumber: "WB-HOS-2023-5512", emergencyContact: "Dr. Fatima Sheikh" },
];

export const emergencyRequests: EmergencyRequest[] = [
  { id: "LR-2026-09421", patientRef: "P-2026-0091", bloodGroup: "O−", component: "Whole Blood", units: 2, urgency: "Critical", status: "Donor Matched", healthcareCentre: "CityCare Medical Centre", location: "Park Street, Kolkata", createdAt: "10:32 AM", requiredBy: "12:00 PM", donorsNotified: 24, accepted: 2, matched: 1, radius: 10, requestedAgo: "8 min ago", contactPerson: "Dr. Ananya Roy", contactPhone: "+91 98765 00001" },
  { id: "LR-2026-09418", patientRef: "P-2026-0088", bloodGroup: "A+", component: "Platelets", units: 4, urgency: "Urgent", status: "Open", healthcareCentre: "Metro Health Centre", location: "Rashbehari, Kolkata", createdAt: "09:45 AM", requiredBy: "2:00 PM", donorsNotified: 18, accepted: 0, matched: 0, radius: 10, requestedAgo: "55 min ago", contactPerson: "Dr. Saurabh Bose", contactPhone: "+91 98765 00002" },
  { id: "LR-2026-09415", patientRef: "P-2026-0085", bloodGroup: "B+", component: "Whole Blood", units: 6, urgency: "Standard", status: "Fulfilled", healthcareCentre: "Apollo City Hospital", location: "Canal Road, Kolkata", createdAt: "08:00 AM", requiredBy: "6:00 PM", donorsNotified: 31, accepted: 5, matched: 3, radius: 25, requestedAgo: "2 hr ago", contactPerson: "Dr. Pradeep Kumar", contactPhone: "+91 98765 00003" },
  { id: "LR-2026-09412", patientRef: "P-2026-0081", bloodGroup: "AB−", component: "Plasma", units: 2, urgency: "Critical", status: "Flagged", healthcareCentre: "LifeLine Hospital", location: "Anwar Shah Road, Kolkata", createdAt: "Yesterday", requiredBy: "Yesterday", donorsNotified: 8, accepted: 0, matched: 0, radius: 5, requestedAgo: "1 day ago", contactPerson: "Dr. Fatima Sheikh", contactPhone: "+91 98765 00004" },
  { id: "LR-2026-09409", patientRef: "P-2026-0078", bloodGroup: "O+", component: "Whole Blood", units: 3, urgency: "Urgent", status: "Cancelled", healthcareCentre: "CityCare Medical Centre", location: "Park Street, Kolkata", createdAt: "Yesterday", requiredBy: "Yesterday", donorsNotified: 20, accepted: 1, matched: 0, radius: 10, requestedAgo: "1 day ago", contactPerson: "Dr. Ananya Roy", contactPhone: "+91 98765 00001" },
];

export const donationHistory = [
  { date: "12 Jun 2026", component: "Whole Blood", centre: "CityCare Blood Centre", status: "Completed", certificate: true },
  { date: "20 Feb 2026", component: "Whole Blood", centre: "LifeLine Blood Bank", status: "Completed", certificate: true },
  { date: "10 Oct 2025", component: "Platelets", centre: "CityCare Blood Centre", status: "Completed", certificate: true },
  { date: "5 Jun 2025", component: "Whole Blood", centre: "Metro Blood Centre", status: "Completed", certificate: true },
  { date: "18 Jan 2025", component: "Whole Blood", centre: "LifeLine Blood Bank", status: "Completed", certificate: true },
  { date: "3 Sep 2024", component: "Whole Blood", centre: "CityCare Blood Centre", status: "Completed", certificate: true },
];

export const expiryItems = [
  { group: "B+", component: "Whole Blood", units: 4, expiresIn: "2 days", severity: "Critical" },
  { group: "AB+", component: "Plasma", units: 6, expiresIn: "4 days", severity: "Warning" },
  { group: "A+", component: "Platelets", units: 2, expiresIn: "1 day", severity: "Critical" },
  { group: "O+", component: "Whole Blood", units: 3, expiresIn: "6 days", severity: "Normal" },
  { group: "B−", component: "Plasma", units: 1, expiresIn: "3 days", severity: "Warning" },
];

export const platformStats = {
  registeredDonors: 4820,
  connectedBloodBanks: 128,
  healthcareCentres: 86,
  requestsThisMonth: 312,
  avgMatchTimeMin: 8,
  fulfillmentRate: 94,
};

export const adminStats = {
  pendingVerifications: 9,
  activeEmergencyRequests: 14,
  fulfilledToday: 42,
  flaggedRequests: 2,
};

export const analyticsData = [
  { day: "Mon", requests: 24, fulfilled: 22, donors: 18 },
  { day: "Tue", requests: 31, fulfilled: 28, donors: 24 },
  { day: "Wed", requests: 18, fulfilled: 16, donors: 14 },
  { day: "Thu", requests: 42, fulfilled: 38, donors: 33 },
  { day: "Fri", requests: 35, fulfilled: 31, donors: 27 },
  { day: "Sat", requests: 28, fulfilled: 26, donors: 21 },
  { day: "Sun", requests: 20, fulfilled: 18, donors: 15 },
];

export const bloodGroupDemand = [
  { group: "O+", demand: 38 },
  { group: "A+", demand: 27 },
  { group: "B+", demand: 18 },
  { group: "O−", demand: 8 },
  { group: "AB+", demand: 5 },
  { group: "A−", demand: 2 },
  { group: "B−", demand: 1 },
  { group: "AB−", demand: 1 },
];
