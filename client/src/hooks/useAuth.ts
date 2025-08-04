import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

// Get device ID from localStorage
const getDeviceId = () => {
  const deviceId = localStorage.getItem("device-id");
  if (!deviceId) {
    const newDeviceId = crypto.randomUUID();
    localStorage.setItem("device-id", newDeviceId);
    return newDeviceId;
  }
  return deviceId;
};

export function useAuth() {
  const deviceId = getDeviceId();
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user", deviceId],
    queryFn: async () => {
      const response = await fetch(`/api/auth/user?deviceId=${deviceId}`);
      if (!response.ok) {
        throw new Error('Unauthorized');
      }
      return response.json();
    },
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && user.status === "approved",
    deviceId,
  };
}