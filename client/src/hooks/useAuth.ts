import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const [deviceId, setDeviceId] = useState<string>("");
  const queryClient = useQueryClient();

  useEffect(() => {
    // Generate or get existing device ID
    let storedDeviceId = localStorage.getItem("deviceId");
    
    // Clear admin device ID if user is not admin
    const isAdminStored = localStorage.getItem('isAdmin') === 'true';
    if (!isAdminStored && storedDeviceId === 'admin-device-simple') {
      localStorage.removeItem("deviceId");
      storedDeviceId = null;
    }
    
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
    queryKey: ["/api/auth/user", deviceId],
    queryFn: async () => {
      const response = await fetch(`/api/auth/user?deviceId=${deviceId}`);
      if (!response.ok) {
        throw new Error('Unauthorized');
      }
      return response.json();
    },
    enabled: !!deviceId && !isAdminLoggedIn,
    retry: false,
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: { fullName: string; personalId: string; phone: string }) => {
      const fullData = {
        ...userData,
        email: `${userData.personalId}@temp.com`, // Temporary email, can be updated later
        password: userData.personalId, // Use personal ID as temporary password
        deviceId
      };
      return apiRequest("POST", "/api/auth/register", fullData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  // Logout function
  const logout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('deviceId');
    queryClient.clear();
    window.location.reload();
  };

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
      error: null,
      register: (userData: { fullName: string; personalId: string; phone: string }) => registerMutation.mutateAsync(userData),
      logout
    };
  }

  return {
    user: user ? { ...user, deviceId } : null,
    deviceId,
    isLoading,
    isAuthenticated: !!user,
    error,
    register: (userData: { fullName: string; personalId: string; phone: string }) => registerMutation.mutateAsync(userData),
    logout
  };
}