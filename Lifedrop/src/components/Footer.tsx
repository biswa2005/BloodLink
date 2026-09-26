import { Link } from "react-router-dom";
import { LogoText } from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-[#172033] text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <LogoText light />
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs">
              Real-time blood availability and emergency donor network connecting healthcare providers with willing donors.
            </p>
            <p className="mt-4 text-xs text-gray-500">Blood, when and where it's needed.</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              {[["Find Blood", "/find-blood"], ["How It Works", "/how-it-works"], ["Blood Banks", "/blood-banks"], ["Emergency Network", "/how-it-works"]].map(([l, h]) => (
                <li key={l}><Link to={h} className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">For Users</h4>
            <ul className="space-y-2.5 text-sm">
              {[["Become a Donor", "/register"], ["Register Blood Bank", "/register"], ["Register Healthcare Centre", "/register"], ["Login", "/login"]].map(([l, h]) => (
                <li key={l}><Link to={h} className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Trust & Safety</h4>
            <ul className="space-y-2.5 text-sm">
              {["Privacy Policy", "Terms of Use", "Data Protection", "Accessibility"].map(l => (
                <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Verified Healthcare Network</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 LifeDrop. All rights reserved.</p>
          <p>Availability data may change. Confirm before travelling. Donors subject to medical screening.</p>
        </div>
      </div>
    </footer>
  );
}
