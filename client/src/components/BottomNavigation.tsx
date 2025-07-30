import { Home, MessageCircleQuestion, MapPin, Play, User } from "lucide-react";
import { useLocation } from "wouter";

export function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "בית" },
    { path: "/questions", icon: MessageCircleQuestion, label: "שאלות" },
    { path: "/synagogues", icon: MapPin, label: "בתי כנסת" },
    { path: "/videos", icon: Play, label: "סרטונים" },
    { path: "/profile", icon: User, label: "פרופיל" },
  ];

  return (
    <nav className="fixed bottom-0 right-0 left-0 max-w-md mx-auto bg-white border-t border-gray-200">
      <div className="grid grid-cols-5 py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          return (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className={`flex flex-col items-center py-2 transition-colors ${
                isActive ? "text-police-blue" : "text-gray-500"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
