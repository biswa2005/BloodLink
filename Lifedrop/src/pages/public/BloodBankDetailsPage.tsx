import { useParams, useNavigate } from "react-router-dom";
import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import { Button, Card } from "../../components/ui";
import { bloodBanks } from "../../data";

export default function BloodBankDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bank = bloodBanks.find(b => b.id === id) || bloodBanks[0];

  const getStatus = (units: number) => {
    if (units === 0) return { label: "Out of Stock", cls: "text-red-600 bg-red-50" };
    if (units <= 2) return { label: "Low Stock", cls: "text-amber-600 bg-amber-50" };
    return { label: "Available", cls: "text-green-600 bg-green-50" };
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] dark:bg-[#0D1520]">
      <PublicNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 hover:text-[#D7263D] mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to search
        </button>

        <Card className="p-6 mb-5">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>{bank.name}</h1>
                {bank.verified && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-gray-500 dark:text-slate-400 text-sm">{bank.address}, {bank.city}</p>
            </div>
            <span className="text-sm font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-[#1C2A3E] px-3 py-1 rounded-full">{bank.distance}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F6F7F9] dark:bg-[#1C2A3E] flex items-center justify-center text-[#D7263D]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500">Phone</p>
                <a href={`tel:${bank.phone}`} className="text-sm font-semibold text-[#172033] dark:text-slate-200 hover:text-[#D7263D]">{bank.phone}</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F6F7F9] dark:bg-[#1C2A3E] flex items-center justify-center text-[#D7263D]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500">Open Hours</p>
                <p className="text-sm font-semibold text-[#172033] dark:text-slate-200">{bank.openHours}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F6F7F9] dark:bg-[#1C2A3E] flex items-center justify-center text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500">Last Updated</p>
                <p className="text-sm font-semibold text-[#172033] dark:text-slate-200">{bank.lastUpdate}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <a href={`tel:${bank.phone}`} className="flex-1">
              <Button className="w-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                Call Blood Bank
              </Button>
            </a>
            <Button variant="outline" className="flex-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              Get Directions
            </Button>
          </div>
        </Card>

        {/* Inventory Table */}
        <Card className="overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-[#E5E7EB] dark:border-[#1E2D40] flex items-center justify-between">
            <h2 className="font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>Live Blood Inventory</h2>
            <span className="text-xs text-gray-400 dark:text-slate-500">Updated {bank.lastUpdate}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F6F7F9] dark:bg-[#1C2A3E] border-b border-[#E5E7EB] dark:border-[#1E2D40]">
                <tr>
                  {["Blood Group", "Whole Blood", "Platelets", "Plasma", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F6F7F9] dark:divide-[#1E2D40]">
                {bank.inventory.map(inv => {
                  const wb = getStatus(inv.wholeBlood);
                  return (
                    <tr key={inv.group} className="hover:bg-[#F9FAFB] dark:hover:bg-[#1C2A3E]">
                      <td className="px-4 py-3">
                        <span className="font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>{inv.group}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${wb.cls}`}>{inv.wholeBlood} u</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${getStatus(inv.platelets).cls}`}>{inv.platelets} u</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${getStatus(inv.plasma).cls}`}>{inv.plasma} u</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${wb.cls} px-2 py-0.5 rounded-full`}>{wb.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
          <p className="font-semibold mb-1">Important notice</p>
          <p>Blood availability changes frequently. Contact the blood bank directly to confirm availability before travelling. Data shown was last updated {bank.lastUpdate}.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
