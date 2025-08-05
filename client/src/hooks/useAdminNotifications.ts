import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NotificationCounts {
  users: number;
  questions: number;
  contacts: number;
  news: number;
}

export function useAdminNotifications() {
  const queryClient = useQueryClient();

  const { data: counts, isLoading } = useQuery<NotificationCounts>({
    queryKey: ["/api/admin/notification-counts"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  const markUsersSeen = useMutation({
    mutationFn: () => apiRequest("/api/admin/mark-users-seen", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-counts"] });
    },
  });

  const markQuestionsSeen = useMutation({
    mutationFn: () => apiRequest("/api/admin/mark-questions-seen", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-counts"] });
    },
  });

  const markContactsSeen = useMutation({
    mutationFn: () => apiRequest("/api/admin/mark-contacts-seen", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-counts"] });
    },
  });

  const markNewsSeen = useMutation({
    mutationFn: () => apiRequest("/api/admin/mark-news-seen", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-counts"] });
    },
  });

  return {
    counts: counts || { users: 0, questions: 0, contacts: 0, news: 0 },
    isLoading,
    markUsersSeen,
    markQuestionsSeen,
    markContactsSeen,
    markNewsSeen,
  };
}