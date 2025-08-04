import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function useAuth() {
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    // Generate or get existing device ID
    let storedDeviceId = localStorage.getItem("deviceId");
    if (!storedDeviceId) {
      storedDeviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("deviceId", storedDeviceId);
    }
    setDeviceId(storedDeviceId);
  }, []);

  // Check if admin is logged in via localStorage
  const isAdminLoggedIn = localStorage.getItem('isAdmin') === 'true';
  const adminEmail = localStorage.getItem('adminEmail');

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !!deviceId && !isAdminLoggedIn,
    retry: false,
  });

  // Return admin user if admin is logged in
  if (isAdminLoggedIn && adminEmail) {
    return {
      user: {
        id: 'admin-user',
        email: adminEmail,
        fullName: 'מנהל המערכת',
        deviceId: 'admin-device-simple',
        isAdmin: true,
        status: 'approved' as const,
        personalId: 'admin',
        phone: 'admin',
        password: 'admin123',
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: 'system'
      },
      deviceId: 'admin-device-simple',
      isLoading: false,
      isAuthenticated: true,
      error: null
    };
  }

  return {
    user: user ? { ...user, deviceId } : null,
    deviceId,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}