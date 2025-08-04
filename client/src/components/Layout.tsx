import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { RegistrationForm } from "@/components/RegistrationForm";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import logo from "@assets/bf4d69d1-82e0-4b41-bc8c-ecca5ca6a895_1753886576969.jpeg";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-police-blue mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  // Show pending screen for users waiting for approval
  if (user && user.status === "pending") {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <header className="gradient-header text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <button 
                onClick={() => setLocation("/")}
                className="text-xl font-bold hover:opacity-80 transition-opacity"
              >
                רבנות המשטרה
              </button>
              <button
                onClick={() => setLocation("/admin")}
                className="text-xs text-white/50 hover:text-white transition-colors mt-1"
                style={{ fontSize: '10px' }}
              >
                ניהול
              </button>
            </div>
            <button 
              onClick={() => setLocation("/")}
              className="hover:opacity-80 transition-opacity"
            >
              <img src={logo} alt="לוגו רבנות המשטרה" className="h-8 w-auto" />
            </button>
          </div>
        </header>
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-card p-6 mt-8 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">ממתין לאישור</h2>
            <p className="text-gray-600 mb-4">הבקשה שלך נשלחה בהצלחה ומחכה לאישור מנהל המערכת.</p>
            <p className="text-sm text-gray-500">תקבל הודעה כאשר החשבון יאושר.</p>
            
            {/* Hidden Admin Access */}
            <div className="mt-8">
              <button
                onClick={() => setLocation("/admin")}
                className="text-xs text-gray-300 hover:text-police-blue transition-colors"
                style={{ fontSize: '10px' }}
              >
                ניהול מערכת
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user && user.status === "rejected") {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <header className="gradient-header text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setLocation("/")}
              className="text-xl font-bold hover:opacity-80 transition-opacity"
            >
              רבנות המשטרה
            </button>
            <button 
              onClick={() => setLocation("/")}
              className="hover:opacity-80 transition-opacity"
            >
              <img src={logo} alt="לוגו רבנות המשטרה" className="h-8 w-auto" />
            </button>
          </div>
        </header>
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-card p-6 mt-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-red-600 mb-2">הבקשה נדחתה</h2>
            <p className="text-gray-600 mb-4">הבקשה שלך לחברות באפליקציה נדחתה על ידי מנהל המערכת.</p>
            <p className="text-sm text-gray-500">אם אתה חושב שמדובר בטעות, צור קשר עם מנהל המערכת.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <header className="gradient-header text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-3">
            <button 
              onClick={() => setLocation("/")}
              className="text-xl font-bold hover:opacity-80 transition-opacity"
            >
              רבנות המשטרה
            </button>
            <button 
              onClick={() => setLocation("/")}
              className="hover:opacity-80 transition-opacity"
            >
              <img src={logo} alt="לוגו רבנות המשטרה" className="h-8 w-auto" />
            </button>
          </div>
          
          {/* Clear device button */}
          <button
            onClick={() => {
              localStorage.removeItem("deviceId");
              window.location.reload();
            }}
            className="text-sm text-white/80 hover:text-white transition-colors px-2 py-1 rounded"
          >
            התנתק
          </button>
        </div>
      </header>
      
      <main className="flex-1 pb-16">
        {children}
      </main>
      
      <BottomNavigation />
    </div>
  );
}