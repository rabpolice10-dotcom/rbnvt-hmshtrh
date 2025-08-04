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
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">ממתין לאישור</h2>
            <p className="text-gray-600 mb-4">הבקשה שלך נשלחה בהצלחה ומחכה לאישור מנהל המערכת.</p>
            <p className="text-sm text-gray-500">תקבל הודעה כאשר החשבון יאושר.</p>
            
            <div className="mt-6">
              <button
                onClick={() => {
                  // Clear all authentication data
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.replace('/login');
                }}
                className="w-full bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-2xl hover:shadow-red-600/40 transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 border-2 border-red-400 hover:border-red-300"
                style={{
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c, #991b1b, #7f1d1d)',
                  boxShadow: '0 15px 35px rgba(220, 38, 38, 0.5), 0 5px 15px rgba(220, 38, 38, 0.3)',
                }}
              >
                <span className="flex items-center justify-center gap-3">
                  <span className="text-2xl animate-bounce">🚪</span>
                  <span className="tracking-wide drop-shadow-lg">התנתק מהמערכת</span>
                </span>
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
            <p className="text-sm text-gray-500 mb-6">אם אתה חושב שמדובר בטעות, צור קשר עם מנהל המערכת.</p>
            
            <button
              onClick={() => {
                // Clear all authentication data
                localStorage.clear();
                sessionStorage.clear();
                window.location.replace('/login');
              }}
              className="w-full bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-2xl hover:shadow-red-600/40 transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 border-2 border-red-400 hover:border-red-300"
              style={{
                background: 'linear-gradient(135deg, #dc2626, #b91c1c, #991b1b, #7f1d1d)',
                boxShadow: '0 15px 35px rgba(220, 38, 38, 0.5), 0 5px 15px rgba(220, 38, 38, 0.3)',
              }}
            >
              <span className="flex items-center justify-center gap-3">
                <span className="text-2xl animate-bounce">🚪</span>
                <span className="tracking-wide drop-shadow-lg">התנתק מהמערכת</span>
              </span>
            </button>
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
          
          {/* Logout button */}
          <button
            onClick={() => {
              localStorage.removeItem("device-id");
              window.location.href = '/login';
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