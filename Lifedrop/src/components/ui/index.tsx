import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, forwardRef, useState } from "react";

// ─── Button ───────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#D7263D] text-white hover:bg-[#B01E30] active:bg-[#9A1A28] shadow-sm",
  secondary: "bg-[#F6F7F9] text-[#172033] hover:bg-[#E5E7EB] border border-[#E5E7EB] dark:bg-[#1C2A3E] dark:text-slate-200 dark:border-[#1E2D40] dark:hover:bg-[#243345]",
  outline: "border border-[#D7263D] text-[#D7263D] hover:bg-[#FFF0F2] bg-transparent dark:hover:bg-[#D7263D]/10",
  ghost: "text-[#172033] hover:bg-[#F6F7F9] bg-transparent dark:text-slate-300 dark:hover:bg-white/10",
  destructive: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
};

export function Button({ variant = "primary", size = "md", loading, disabled, children, className = "", ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all ${variantClasses[variant]} ${sizeClasses[size]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = "available" | "low" | "out" | "open" | "matched" | "fulfilled" | "critical" | "urgent" | "standard" | "verified" | "pending" | "rejected" | "suspended" | "flagged" | "cancelled" | "eligible" | "not-eligible" | "active" | "expired";

const badgeConfig: Record<BadgeVariant, { label: string; classes: string }> = {
  available: { label: "Available", classes: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
  low: { label: "Low Stock", classes: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" },
  out: { label: "Out of Stock", classes: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
  open: { label: "Open", classes: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" },
  matched: { label: "Donor Matched", classes: "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800" },
  fulfilled: { label: "Fulfilled", classes: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
  critical: { label: "Critical", classes: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
  urgent: { label: "Urgent", classes: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" },
  standard: { label: "Standard", classes: "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800" },
  verified: { label: "Verified", classes: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
  pending: { label: "Pending", classes: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" },
  rejected: { label: "Rejected", classes: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
  suspended: { label: "Suspended", classes: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600" },
  flagged: { label: "Flagged", classes: "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800" },
  cancelled: { label: "Cancelled", classes: "bg-gray-100 text-gray-500 border border-gray-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600" },
  eligible: { label: "Eligible", classes: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
  "not-eligible": { label: "Not Eligible", classes: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600" },
  active: { label: "Active", classes: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
  expired: { label: "Expired", classes: "bg-gray-100 text-gray-500 border border-gray-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600" },
};

export function Badge({ variant, label, className = "" }: { variant: BadgeVariant; label?: string; className?: string }) {
  const config = badgeConfig[variant];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${config.classes} ${className}`}>
      {label || config.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    "Available": "available",
    "Low Stock": "low",
    "Out of Stock": "out",
    "Open": "open",
    "Donor Matched": "matched",
    "Fulfilled": "fulfilled",
    "Critical": "critical",
    "Urgent": "urgent",
    "Standard": "standard",
    "Verified": "verified",
    "Pending": "pending",
    "Pending Verification": "pending",
    "Rejected": "rejected",
    "Suspended": "suspended",
    "Flagged": "flagged",
    "Cancelled": "cancelled",
    "Eligible": "eligible",
    "Not Eligible": "not-eligible",
    "Active": "active",
    "Expired": "expired",
  };
  const variant = map[status] || "pending";
  return <Badge variant={variant} label={status} />;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#152030] border border-[#E5E7EB] dark:border-[#1E2D40] rounded-xl shadow-sm ${onClick ? "cursor-pointer hover:shadow-md hover:border-[#D7263D]/30 dark:hover:border-[#D7263D]/30 transition-all" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon?: ReactNode; accent?: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${accent ? "text-[#D7263D]" : "text-[#172033] dark:text-slate-100"}`} style={{ fontFamily: "Manrope" }}>
            {value}
          </p>
          {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{sub}</p>}
        </div>
        {icon && <div className="p-2 bg-[#F6F7F9] dark:bg-[#1C2A3E] rounded-lg text-[#D7263D]">{icon}</div>}
      </div>
    </Card>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, className = "", id, ...props }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-[#172033] dark:text-slate-300">{label}</label>}
      <input
        ref={ref}
        id={inputId}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500
          border-[#E5E7EB] dark:border-[#1E2D40] hover:border-[#9CA3AF] dark:hover:border-slate-500 focus:border-[#D7263D] focus:outline-none focus:ring-2 focus:ring-[#D7263D]/20
          transition-colors ${error ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""} ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-400 dark:text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = "", id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={selectId} className="text-sm font-medium text-[#172033] dark:text-slate-300">{label}</label>}
      <select
        id={selectId}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white dark:bg-[#152030] text-[#172033] dark:text-slate-200
          border-[#E5E7EB] dark:border-[#1E2D40] hover:border-[#9CA3AF] dark:hover:border-slate-500 focus:border-[#D7263D] focus:outline-none focus:ring-2 focus:ring-[#D7263D]/20
          transition-colors cursor-pointer ${error ? "border-red-400" : ""} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-[#152030] rounded-2xl shadow-2xl border border-[#E5E7EB] dark:border-[#1E2D40] max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-[#1E2D40]">
            <h3 className="text-lg font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>{title}</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ message, type = "success", onClose }: { message: string; type?: "success" | "error" | "info" | "warning"; onClose: () => void }) {
  const configs = {
    success: { bg: "bg-green-50 border-green-200 dark:bg-green-900/50 dark:border-green-700", text: "text-green-800 dark:text-green-300", icon: "✓" },
    error: { bg: "bg-red-50 border-red-200 dark:bg-red-900/50 dark:border-red-700", text: "text-red-800 dark:text-red-300", icon: "✗" },
    info: { bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/50 dark:border-blue-700", text: "text-blue-800 dark:text-blue-300", icon: "ℹ" },
    warning: { bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/50 dark:border-amber-700", text: "text-amber-800 dark:text-amber-300", icon: "⚠" },
  };
  const c = configs[type];
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${c.bg}`}>
      <span className={`font-bold ${c.text}`}>{c.icon}</span>
      <span className={`text-sm font-medium ${c.text}`}>{message}</span>
      <button onClick={onClose} className={`ml-2 ${c.text} opacity-60 hover:opacity-100`}>×</button>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex gap-1 bg-[#F6F7F9] dark:bg-[#1C2A3E] p-1 rounded-lg border border-[#E5E7EB] dark:border-[#1E2D40]">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`flex-1 px-4 py-2 text-sm font-semibold rounded-md transition-all ${active === tab ? "bg-white dark:bg-[#152030] shadow-sm text-[#172033] dark:text-slate-100 border border-[#E5E7EB] dark:border-[#1E2D40]" : "text-gray-500 dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-200"}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="mb-4 text-gray-300 dark:text-slate-600">{icon}</div>}
      <h3 className="text-base font-semibold text-[#172033] dark:text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg ${className}`} />;
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100" style={{ fontFamily: "Manrope" }}>{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
export function AlertBanner({ title, message, type = "warning", action }: { title: string; message: string; type?: "warning" | "critical" | "info"; action?: ReactNode }) {
  const configs = {
    warning: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300",
    critical: "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300",
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300",
  };
  return (
    <div className={`border rounded-xl px-4 py-3 flex items-start justify-between gap-4 ${configs[type]}`}>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs opacity-80 mt-0.5">{message}</p>
      </div>
      {action}
    </div>
  );
}

// ─── Availability Indicator ───────────────────────────────────────────────────
export function AvailabilityDot({ units }: { units: number }) {
  if (units === 0) return <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Out of Stock</span>;
  if (units <= 2) return <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Low Stock</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Available</span>;
}

// ─── Step Progress ────────────────────────────────────────────────────────────
export function StepProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
              ${i < current ? "bg-[#D7263D] border-[#D7263D] text-white" : i === current ? "border-[#D7263D] text-[#D7263D] bg-white dark:bg-[#152030]" : "border-gray-200 dark:border-slate-600 text-gray-400 dark:text-slate-500 bg-white dark:bg-[#152030]"}`}>
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-xs mt-1 font-medium ${i === current ? "text-[#D7263D]" : i < current ? "text-[#172033] dark:text-slate-200" : "text-gray-400 dark:text-slate-500"}`}>{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-12 sm:w-20 mb-4 mx-1 ${i < current ? "bg-[#D7263D]" : "bg-gray-200 dark:bg-slate-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── useToast hook ────────────────────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const show = (message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const ToastEl = toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null;
  return { show, ToastEl };
}
