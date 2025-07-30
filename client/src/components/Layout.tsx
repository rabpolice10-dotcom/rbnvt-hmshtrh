import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { RegistrationForm } from "@/components/RegistrationForm";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Bell, Shield } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, isLoading } = useAuth();

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

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <header className="gradient-header text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">רבנות המשטרה</h1>
            <Shield className="h-6 w-6" />
          </div>
        </header>
        <RegistrationForm />
      </div>
    );
  }

  if (user.status === "pending") {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <header className="gradient-header text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">רבנות המשטרה</h1>
            <Shield className="h-6 w-6" />
          </div>
        </header>
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-card p-6 mt-8 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">ממתין לאישור</h2>
            <p className="text-gray-600 mb-4">הבקשה שלך נשלחה בהצלחה ומחכה לאישור מנהל המערכת.</p>
            <p className="text-sm text-gray-500">תקבל הודעה כאשר החשבון יאושר.</p>
          </div>
        </div>
      </div>
    );
  }

  if (user.status === "rejected") {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <header className="gradient-header text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">רבנות המשטרה</h1>
            <Shield className="h-6 w-6" />
          </div>
        </header>
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-card p-6 mt-8 text-center">
            <div className="text-4xl mb-4 text-red-500">❌</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">בקשה נדחתה</h2>
            <p className="text-gray-600 mb-4">הבקשה שלך להצטרף למערכת נדחתה.</p>
            <p className="text-sm text-gray-500">אנא פנה למנהל המערכת לקבלת פרטים נוספים.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <header className="gradient-header text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">רבנות המשטרה</h1>
          <div className="flex items-center space-x-reverse space-x-2">
            <Shield className="h-5 w-5" />
            <button className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="pb-20">
        {children}
      </main>
      
      <BottomNavigation />
    </div>
  );
}
