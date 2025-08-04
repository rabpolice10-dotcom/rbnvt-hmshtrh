import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NotificationBadges {
  questions: number;
  contacts: number;
  news: number;
  users: number;
}

export function useNotificationBadges() {
  const queryClient = useQueryClient();

  const { data: badges, isLoading } = useQuery<NotificationBadges>({
    queryKey: ["/api/admin/notification-badges"],
    refetchInterval: 5000, // Update every 5 seconds for real-time experience
    staleTime: 1000, // Consider data stale after 1 second
  });

  const markSeenMutation = useMutation({
    mutationFn: async (type: string) => {
      return apiRequest(`/api/admin/mark-seen/${type}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      // Invalidate badges to update the UI immediately
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-badges"] });
    },
  });

  const markAsSeen = (type: 'questions' | 'contacts' | 'news') => {
    markSeenMutation.mutate(type);
  };

  return {
    badges: badges || { questions: 0, contacts: 0, news: 0, users: 0 },
    isLoading,
    markAsSeen,
    isMarkingAsSeen: markSeenMutation.isPending,
  };
}