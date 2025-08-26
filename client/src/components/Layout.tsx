import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { RegistrationForm } from "@/components/RegistrationForm";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import logo from "@assets/לוגו ללא רקע_1756201743807.png";

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
        <header className="premium-header text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/20 via-transparent to-white/10"></div>
          
          <div className="relative z-10 px-6 py-4">
            <div className="flex items-center justify-center">
              <button 
                onClick={() => setLocation("/")}
                className="flex items-center space-x-reverse space-x-3 hover:opacity-90 transition-all duration-300 group"
              >
                <div className="relative">
                  <img 
                    src={logo} 
                    alt="לוגו רבנות המשטרה" 
                    className="h-12 w-12 drop-shadow-xl group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-300"></div>
                </div>
                <div className="text-right">
                  <h1 className="text-xl font-bold tracking-wide drop-shadow-lg group-hover:text-blue-100 transition-colors duration-300">
                    רבנות המשטרה
                  </h1>
                  <p className="text-xs text-blue-100/80 font-medium tracking-wider">
                    משטרת ישראל
                  </p>
                </div>
              </button>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
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
        <header className="premium-header text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-800 to-red-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-red-600/20 via-transparent to-white/10"></div>
          
          <div className="relative z-10 px-6 py-4">
            <div className="flex items-center justify-center">
              <button 
                onClick={() => setLocation("/")}
                className="flex items-center space-x-reverse space-x-3 hover:opacity-90 transition-all duration-300 group"
              >
                <div className="relative">
                  <img 
                    src={logo} 
                    alt="לוגו רבנות המשטרה" 
                    className="h-12 w-12 drop-shadow-xl group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-300"></div>
                </div>
                <div className="text-right">
                  <h1 className="text-xl font-bold tracking-wide drop-shadow-lg group-hover:text-red-100 transition-colors duration-300">
                    רבנות המשטרה
                  </h1>
                  <p className="text-xs text-red-100/80 font-medium tracking-wider">
                    משטרת ישראל
                  </p>
                </div>
              </button>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </header>
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-card p-6 mt-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">הבקשה נדחתה</h2>
            <p className="text-gray-600 mb-4">הבקשה שלך להצטרפות למערכת נדחתה על ידי מנהל המערכת.</p>
            <p className="text-sm text-gray-500">לפרטים נוספים, פנה למנהל המערכת.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show registration form for new users
  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <header className="premium-header text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/20 via-transparent to-white/10"></div>
          
          <div className="relative z-10 px-6 py-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="relative">
                  <img 
                    src={logo} 
                    alt="לוגו רבנות המשטרה" 
                    className="h-12 w-12 drop-shadow-xl" 
                  />
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-xl"></div>
                </div>
                <div className="text-right">
                  <h1 className="text-xl font-bold tracking-wide drop-shadow-lg">
                    רבנות המשטרה
                  </h1>
                  <p className="text-xs text-blue-100/80 font-medium tracking-wider">
                    משטרת ישראל
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </header>
        <RegistrationForm />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <header className="premium-header text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/20 via-transparent to-white/10"></div>
        
        <div className="relative z-10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-4">
              <button 
                onClick={() => setLocation("/")}
                className="flex items-center space-x-reverse space-x-3 hover:opacity-90 transition-all duration-300 group"
              >
                <div className="relative">
                  <img 
                    src={logo} 
                    alt="לוגו רבנות המשטרה" 
                    className="h-12 w-12 drop-shadow-xl group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-300"></div>
                </div>
                <div className="text-right">
                  <h1 className="text-xl font-bold tracking-wide drop-shadow-lg group-hover:text-blue-100 transition-colors duration-300">
                    רבנות המשטרה
                  </h1>
                  <p className="text-xs text-blue-100/80 font-medium tracking-wider">
                    משטרת ישראל
                  </p>
                </div>
              </button>
            </div>
            
            {/* Enhanced logout button */}
            <button
              onClick={() => {
                localStorage.removeItem("device-id");
                window.location.href = '/login';
              }}
              className="group relative overflow-hidden bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/10"
            >
              <span className="relative z-10 flex items-center space-x-reverse space-x-2">
                <span>התנתק</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700 -skew-x-12"></div>
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </header>
      
      <main className="flex-1 pb-16">
        {children}
      </main>
      
      <BottomNavigation />
    </div>
  );
}