import { Badge } from "@/components/ui/badge";

interface NotificationBadgeProps {
  count: number;
  isVisible?: boolean;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function NotificationBadge({ 
  count, 
  isVisible = true, 
  variant = "destructive", 
  className = "" 
}: NotificationBadgeProps) {
  if (!isVisible || count <= 0) {
    return null;
  }

  return (
    <Badge 
      variant={variant} 
      className={`absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center animate-pulse ${className}`}
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}