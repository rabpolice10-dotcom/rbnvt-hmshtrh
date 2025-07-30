import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@shared/schema";
import { getDeviceId } from "@/lib/deviceId";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  register: (userData: { fullName: string; personalId: string; phone: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async () => {
    try {
      const deviceId = getDeviceId();
      const response = await apiRequest("POST", "/api/login", { deviceId });
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
    }
  };

  const register = async (userData: { fullName: string; personalId: string; phone: string }) => {
    try {
      const deviceId = getDeviceId();
      const response = await apiRequest("POST", "/api/register", {
        ...userData,
        deviceId
      });
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('deviceId');
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await login();
      } catch (error) {
        // User not registered or error occurred
        console.log("No existing user found");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const isAdmin = user?.isAdmin || false;

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
