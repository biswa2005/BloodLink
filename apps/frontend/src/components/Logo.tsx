import logoImg from "../assets/logo.png";

export function Logo({ size = 32, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="LifeDrop">
      <path
        d="M16 4C16 4 7 13.5 7 19C7 23.418 11.134 27 16 27C20.866 27 25 23.418 25 19C25 13.5 16 4 16 4Z"
        fill={light ? "white" : "#D7263D"}
        opacity="0.95"
      />
      <circle cx="16" cy="19" r="3.5" fill={light ? "#D7263D" : "white"} />
      <path
        d="M9 19H12L13.5 15.5L15.5 22L17 17L18.5 20.5L20 19H23"
        stroke={light ? "#D7263D" : "white"}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

export function LogoText({ light = false, size = "md" }: { light?: boolean; size?: "sm" | "md" | "lg" }) {
  const heights = { sm: "h-8", md: "h-10", lg: "h-14" };

  if (light) {
    const sizes = { sm: "text-lg", md: "text-xl", lg: "text-3xl" };
    return (
      <div className="flex items-center gap-2">
        <Logo size={size === "lg" ? 40 : size === "sm" ? 24 : 32} light={true} />
        <span
          className={`font-extrabold tracking-tight ${sizes[size]} text-white`}
          style={{ fontFamily: "Manrope" }}
        >
          Life<span className="text-red-300">Drop</span>
        </span>
      </div>
    );
  }

  return (
    <img src={logoImg} alt="LifeDrop" className={`${heights[size]} w-auto`} />
  );
}

export { logoImg };
