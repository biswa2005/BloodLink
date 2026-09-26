import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import { Button, Input } from "../../components/ui";
import { LogoText } from "../../components/Logo";
import { useAuth } from "../../context/AuthContext";

type RoleParam = "donor" | "blood-bank" | "healthcare" | "admin";

const roleConfig: Record<RoleParam, { label: string; desc: string; registerPath?: string; authRole: "donor" | "bloodbank" | "healthcare" | "admin"; dashPath: string }> = {
  donor: { label: "Donor", desc: "Sign in to your donor account", registerPath: "/donor/register", authRole: "donor", dashPath: "/donor/dashboard" },
  "blood-bank": { label: "Blood Bank", desc: "Sign in to manage your blood bank", registerPath: "/blood-bank/register", authRole: "bloodbank", dashPath: "/blood-bank/dashboard" },
  healthcare: { label: "Healthcare Centre", desc: "Sign in to your healthcare centre account", registerPath: "/healthcare/register", authRole: "healthcare", dashPath: "/healthcare/dashboard" },
  admin: { label: "Administrator", desc: "LifeDrop platform administration", authRole: "admin", dashPath: "/admin/dashboard" },
};

export default function RoleLoginPage() {
  const { pathname } = useLocation();
  const role = (
    pathname.startsWith("/blood-bank") ? "blood-bank" :
    pathname.startsWith("/healthcare") ? "healthcare" :
    pathname.startsWith("/donor") ? "donor" :
    pathname.startsWith("/admin") ? "admin" : undefined
  ) as RoleParam | undefined;
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const config = role ? roleConfig[role as RoleParam] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 800));
    login(config.authRole);
    navigate(config.dashPath);
  };

  if (!config) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] dark:bg-[#0D1520]">
      <PublicNav />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <LogoText size="md" />
            <h1 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100 mt-6 mb-1" style={{ fontFamily: "Manrope" }}>{config.label} Login</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">{config.desc}</p>
          </div>

          <div className="bg-white dark:bg-[#152030] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-2xl p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email or Phone"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#D7263D] focus:ring-[#D7263D]"
                  />
                  <span className="text-sm text-gray-600 dark:text-slate-400">Remember me</span>
                </label>
                <button type="button" className="text-sm text-[#D7263D] font-medium hover:underline">Forgot password?</button>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Sign In to {config.label}
              </Button>
            </form>

            <div className="mt-5 pt-5 border-t border-[#E5E7EB] dark:border-[#1E2D40] text-center">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {/* Demo shortcut */}
                <span className="text-xs text-gray-400 dark:text-slate-500 block mb-3">Demo: any email + any password will sign you in</span>
                {config.registerPath ? (
                  <>
                    Don't have an account?{" "}
                    <button onClick={() => navigate(config.registerPath!)} className="text-[#D7263D] font-semibold hover:underline">
                      Register as {config.label}
                    </button>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <p className="text-center mt-4 text-sm text-gray-500 dark:text-slate-400">
            <button onClick={() => navigate("/login")} className="text-gray-400 dark:text-slate-500 hover:text-[#172033] dark:hover:text-slate-100">← Back to portal selection</button>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
