import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoText } from "./Logo";
import { Button } from "./ui";
import { useTheme } from "../context/ThemeContext";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Find Blood", to: "/find-blood" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "Blood Banks", to: "/blood-banks" },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-[#F6F7F9] dark:hover:bg-white/10 transition-colors"
    >
      {theme === "dark" ? (
        <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-40 bg-white/95 dark:bg-[#0D1520]/95 backdrop-blur border-b border-[#E5E7EB] dark:border-[#1E2D40] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0">
            <LogoText />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-100 hover:bg-[#F6F7F9] dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Login</Button>
            <Button size="sm" onClick={() => navigate("/register")}>Register</Button>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-slate-400"
              aria-label="Toggle menu"
            >
              {open ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-[#E5E7EB] dark:border-[#1E2D40] bg-white dark:bg-[#0D1520] px-4 py-4 flex flex-col gap-2">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-[#D7263D] dark:hover:text-[#D7263D] rounded-lg"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-3 mt-2 pt-2 border-t border-gray-100 dark:border-[#1E2D40]">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => { navigate("/login"); setOpen(false); }}>Login</Button>
            <Button size="sm" className="flex-1" onClick={() => { navigate("/register"); setOpen(false); }}>Register</Button>
          </div>
        </div>
      )}
    </nav>
  );
}
