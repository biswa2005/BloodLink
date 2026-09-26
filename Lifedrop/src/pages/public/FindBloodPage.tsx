import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import { Button, Card, Badge, EmptyState } from "../../components/ui";
import { BLOOD_GROUPS, COMPONENTS, bloodBanks, BloodBank } from "../../data";
import { useTheme } from "../../context/ThemeContext";

function makeBankIcon(verified: boolean) {
  const color = verified ? "#D7263D" : "#6B7280";
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="background:${color};color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:5px;box-shadow:0 2px 6px rgba(0,0,0,0.2);white-space:nowrap;display:flex;align-items:center;gap:4px">
        <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>
        Blood Bank
      </div>
      <div style="width:2px;height:8px;background:${color};opacity:0.6"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.15)"></div>
    </div>`,
    className: "",
    iconSize: [90, 34],
    iconAnchor: [45, 34],
  });
}

const VERIFIED_BANK_ICON = makeBankIcon(true);
const PENDING_BANK_ICON = makeBankIcon(false);

function AvailabilityStatus({ units }: { units: number }) {
  if (units === 0) return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Out of Stock</span>;
  if (units <= 2) return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Low Stock</span>;
  return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Available</span>;
}

function BloodBankCard({ bank, selectedGroup, selectedComponent }: { bank: BloodBank; selectedGroup: string; selectedComponent: string }) {
  const navigate = useNavigate();

  const relevantInv = bank.inventory.find(i => i.group === selectedGroup) || bank.inventory[0];
  const units = selectedComponent === "Platelets" ? relevantInv.platelets : selectedComponent === "Plasma" ? relevantInv.plasma : relevantInv.wholeBlood;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>{bank.name}</h3>
            {bank.verified && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">{bank.address}, {bank.city}</p>
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-[#1C2A3E] px-2.5 py-1 rounded-full flex-shrink-0 ml-2">{bank.distance}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {(selectedGroup ? [selectedGroup] : ["O+", "A+", "B+"]).slice(0, 3).map(grp => {
          const inv = bank.inventory.find(i => i.group === grp);
          if (!inv) return null;
          return (
            <div key={grp} className="bg-[#F6F7F9] dark:bg-[#1C2A3E] rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-[#172033] dark:text-slate-100 mb-1">{grp}</p>
              <p className="text-lg font-extrabold text-[#172033] dark:text-slate-100">{inv.wholeBlood}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">Whole Blood</p>
              <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 dark:text-slate-500">
                <span>PLT {inv.platelets}</span>
                <span>PLS {inv.plasma}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 mb-4">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Updated {bank.lastUpdate}
        </span>
        <span>{bank.openHours}</span>
      </div>

      {selectedGroup && <div className="mb-4"><AvailabilityStatus units={units} /></div>}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/blood-bank/${bank.id}`)}>View Details</Button>
        <a href={`tel:${bank.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-[#1C2A3E] transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          Call
        </a>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-[#1C2A3E] transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
          Directions
        </button>
      </div>
    </Card>
  );
}

function MapView({ banks }: { banks: BloodBank[] }) {
  const { theme } = useTheme();
  const tileUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const center: [number, number] = banks.length > 0
    ? [banks.reduce((s, b) => s + b.lat, 0) / banks.length, banks.reduce((s, b) => s + b.lng, 0) / banks.length]
    : [22.530, 88.348];

  return (
    <div className="rounded-2xl border border-[#D1D9F0] dark:border-[#1E2D40] overflow-hidden relative" style={{ height: "500px" }}>
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl>
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {banks.map(bank => (
          <Marker
            key={bank.id}
            position={[bank.lat, bank.lng]}
            icon={bank.verified ? VERIFIED_BANK_ICON : PENDING_BANK_ICON}
          >
            <Popup>
              <div style={{ padding: "12px 14px", minWidth: 170 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: "#172033", marginBottom: 4 }}>{bank.name}</p>
                <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>{bank.address}</p>
                <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>{bank.city} · {bank.distance}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: bank.verified ? "#D7263D" : "#6B7280" }}>
                  {bank.verified ? "✓ Verified" : "Pending verification"}
                </p>
                <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Updated {bank.lastUpdate}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div
        className="absolute bottom-3 left-3 bg-white dark:bg-[#152030] rounded-xl border border-[#E5E7EB] dark:border-[#1E2D40] shadow px-3 py-2 flex items-center gap-4 text-xs text-gray-700 dark:text-slate-300"
        style={{ zIndex: 1100 }}
      >
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#D7263D] inline-block" />Blood Bank</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-500 inline-block" />Pending</span>
      </div>
    </div>
  );
}

export default function FindBloodPage() {
  const [searchParams] = useSearchParams();
  const [group, setGroup] = useState(searchParams.get("group") || "");
  const [component, setComponent] = useState(searchParams.get("component") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [radius, setRadius] = useState("10");
  const [sort, setSort] = useState("nearest");
  const [view, setView] = useState<"list" | "map">("list");
  const [searched, setSearched] = useState(false);

  const handleSearch = () => setSearched(true);

  const filtered = bloodBanks
    .filter(b => {
      if (!searched && !group && !location) return true;
      return true;
    })
    .sort((a, b) => {
      if (sort === "nearest") return a.distanceNum - b.distanceNum;
      if (sort === "highest") {
        const aUnits = a.inventory.reduce((s, i) => s + i.wholeBlood, 0);
        const bUnits = b.inventory.reduce((s, i) => s + i.wholeBlood, 0);
        return bUnits - aUnits;
      }
      return 0;
    });

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] dark:bg-[#0D1520]">
      <PublicNav />

      <main className="flex-1">
        <div className="bg-white dark:bg-[#0D1520] border-b border-[#E5E7EB] dark:border-[#1E2D40] py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold text-[#172033] dark:text-slate-100 mb-2" style={{ fontFamily: "Manrope" }}>Find Blood Near You</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Search live inventory from nearby blood banks. No login required.</p>

            <div className="bg-[#F6F7F9] dark:bg-[#1C2A3E] rounded-xl border border-[#E5E7EB] dark:border-[#1E2D40] p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-slate-400 block mb-1">Blood Group</label>
                  <select value={group} onChange={e => setGroup(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none">
                    <option value="">Any group</option>
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-slate-400 block mb-1">Component</label>
                  <select value={component} onChange={e => setComponent(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none">
                    <option value="">Any component</option>
                    {COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-slate-400 block mb-1">Location</label>
                  <input type="text" placeholder="City or pincode" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-[#D7263D] focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-slate-400 block mb-1">Radius</label>
                  <select value={radius} onChange={e => setRadius(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 focus:border-[#D7263D] focus:outline-none">
                    {["5", "10", "25", "50"].map(r => <option key={r} value={r}>{r} km</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full" onClick={handleSearch}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Sort + View toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-slate-400">{filtered.length} blood banks found</span>
              {group && <span className="text-xs font-semibold text-[#D7263D] bg-[#FFF0F2] dark:bg-[#D7263D]/10 border border-red-100 dark:border-[#D7263D]/20 px-2 py-0.5 rounded-full">{group}</span>}
              {component && <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{component}</span>}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500 dark:text-slate-400">Sort by</label>
                <select value={sort} onChange={e => setSort(e.target.value)} className="text-xs border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg px-2 py-1.5 bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200">
                  <option value="nearest">Nearest</option>
                  <option value="highest">Highest Availability</option>
                  <option value="recent">Recently Updated</option>
                </select>
              </div>
              <div className="flex items-center border border-[#E5E7EB] dark:border-[#1E2D40] rounded-lg overflow-hidden">
                <button onClick={() => setView("list")} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${view === "list" ? "bg-[#172033] text-white" : "bg-white dark:bg-[#152030] text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-[#1C2A3E]"}`}>List</button>
                <button onClick={() => setView("map")} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${view === "map" ? "bg-[#172033] text-white" : "bg-white dark:bg-[#152030] text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-[#1C2A3E]"}`}>Map</button>
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-5 text-xs text-amber-800">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Availability changes frequently. Contact the blood bank to confirm before travelling.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Results list */}
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <EmptyState
                  title={`No ${group || "blood"} stock found within ${radius} km`}
                  description="Try expanding your search radius or check a different blood group."
                  action={<Button variant="outline" onClick={() => setRadius("25")}>Expand to 25 km</Button>}
                />
              ) : (
                filtered.map(bank => (
                  <BloodBankCard key={bank.id} bank={bank} selectedGroup={group} selectedComponent={component} />
                ))
              )}
            </div>

            {/* Map */}
            <div className={`${view === "list" ? "hidden lg:block" : "block"}`}>
              <div className="sticky top-20">
                <MapView banks={filtered} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
