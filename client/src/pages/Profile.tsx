import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { User, Phone, IdCard, Calendar, LogOut, Settings } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-600">משתמש לא מחבר</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            מאושר
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ממתין לאישור
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            נדחה
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            לא ידוע
          </span>
        );
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">פרופיל משתמש</h1>

      <Card className="shadow-card">
        <CardContent className="p-6">
          {/* User Avatar */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-police-blue-light rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="h-10 w-10 text-police-blue" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{user.fullName}</h2>
            <div className="mt-2">{getStatusBadge(user.status)}</div>
          </div>

          {/* User Details */}
          <div className="space-y-4">
            <div className="flex items-center">
              <IdCard className="h-5 w-5 text-gray-500 ml-3" />
              <div>
                <p className="text-sm text-gray-600">מספר אישי</p>
                <p className="font-medium text-gray-800">{user.personalId}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Phone className="h-5 w-5 text-gray-500 ml-3" />
              <div>
                <p className="text-sm text-gray-600">טלפון</p>
                <p className="font-medium text-gray-800">{user.phone}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-500 ml-3" />
              <div>
                <p className="text-sm text-gray-600">תאריך הצטרפות</p>
                <p className="font-medium text-gray-800">
                  {new Date(user.createdAt).toLocaleDateString('he-IL')}
                </p>
              </div>
            </div>

            {user.approvedAt && (
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 ml-3" />
                <div>
                  <p className="text-sm text-gray-600">תאריך אישור</p>
                  <p className="font-medium text-gray-800">
                    {new Date(user.approvedAt).toLocaleDateString('he-IL')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Management */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <h3 className="font-bold text-gray-800 mb-4">ניהול חשבון</h3>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-police-blue border-police-blue hover:bg-blue-50"
              onClick={() => setLocation("/admin")}
            >
              <Settings className="h-4 w-4 ml-2" />
              אזור ניהול
            </Button>
            <button
              onClick={logout}
              className="w-full bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white px-6 py-4 rounded-xl text-lg font-bold shadow-2xl hover:shadow-red-600/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border-2 border-red-400 hover:border-red-300"
              style={{
                background: 'linear-gradient(135deg, #dc2626, #b91c1c, #991b1b, #7f1d1d)',
                boxShadow: '0 12px 25px rgba(220, 38, 38, 0.4), 0 5px 10px rgba(220, 38, 38, 0.2)',
              }}
            >
              <span className="flex items-center justify-center gap-3">
                <LogOut className="h-5 w-5" />
                <span className="tracking-wide drop-shadow-lg">התנתק מהמערכת</span>
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <h3 className="font-bold text-gray-800 mb-4">מידע על האפליקציה</h3>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>גרסה:</strong> 1.0.0</p>
            <p><strong>פיתוח:</strong> רבנות המשטרה</p>
            <p><strong>תמיכה:</strong> support@police-rabbinate.gov.il</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
