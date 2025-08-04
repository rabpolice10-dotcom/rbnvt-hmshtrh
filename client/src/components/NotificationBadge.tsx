
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className = "" }: NotificationBadgeProps) {
  if (count === 0) return null;

  return (
    <Badge 
      variant="destructive" 
      className={`absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center ${className}`}
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}

export function NotificationIcon({ hasNotifications = false }: { hasNotifications?: boolean }) {
  return (
    <div className="relative">
      <Bell className={`h-5 w-5 ${hasNotifications ? 'text-blue-600' : 'text-gray-500'}`} />
      {hasNotifications && (
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}
