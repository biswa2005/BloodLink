import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "donor" | "bloodbank" | "healthcare" | "admin" | null;

interface AuthUser {
  name: string;
  role: UserRole;
  bloodGroup?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (role: UserRole, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (role: UserRole, name?: string) => {
    const names: Record<NonNullable<UserRole>, string> = {
      donor: "Aarav Mehta",
      bloodbank: "CityCare Blood Centre",
      healthcare: "CityCare Medical Centre",
      admin: "Admin",
    };
    setUser({ name: name || (role ? names[role] : "User"), role, bloodGroup: role === "donor" ? "O+" : undefined });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
