import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { User, Phone, IdCard, Calendar, LogOut, Settings, Bell, Clock, MessageCircle, Video, Mail } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  // Notification settings state
  const [myQuestionsNotifications, setMyQuestionsNotifications] = useState(true);
  const [allQuestionsNotifications, setAllQuestionsNotifications] = useState(false);
  const [videosNotifications, setVideosNotifications] = useState(true);
  const [newsNotifications, setNewsNotifications] = useState(true);
  
  // Timezone setting
  const [selectedTimezone, setSelectedTimezone] = useState("Jerusalem");

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
      {/* Header */}
      <div className="flex items-center mb-6">
        <User className="h-6 w-6 text-police-blue ml-2" />
        <h1 className="text-2xl font-bold text-gray-800">האזור האישי שלי</h1>
      </div>

      {/* Welcome Card */}
      <Card className="shadow-card bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                שלום, {user.fullName || user.email}
              </h2>
              <p className="text-gray-600">ברוך הבא לאזור האישי שלך</p>
            </div>
            <Badge variant="outline" className="text-police-blue border-police-blue">
              משתמש רשום
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 text-purple-600 ml-2" />
            הגדרות התראות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4 text-gray-500 ml-2" />
              <span className="text-gray-700">התראות על השאלות שלי</span>
            </div>
            <Switch
              checked={myQuestionsNotifications}
              onCheckedChange={setMyQuestionsNotifications}
              data-testid="switch-my-questions"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4 text-gray-500 ml-2" />
              <span className="text-gray-700">התראות על כל השאלות</span>
            </div>
            <Switch
              checked={allQuestionsNotifications}
              onCheckedChange={setAllQuestionsNotifications}
              data-testid="switch-all-questions"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Video className="h-4 w-4 text-gray-500 ml-2" />
              <span className="text-gray-700">התראות על סרטונים חדשים</span>
            </div>
            <Switch
              checked={videosNotifications}
              onCheckedChange={setVideosNotifications}
              data-testid="switch-videos"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-gray-500 ml-2" />
              <span className="text-gray-700">התראות על חדשות</span>
            </div>
            <Switch
              checked={newsNotifications}
              onCheckedChange={setNewsNotifications}
              data-testid="switch-news"
            />
          </div>

          <Button 
            className="w-full bg-police-blue hover:bg-police-blue/90"
            data-testid="button-save-notifications"
          >
            שמור הגדרות התראות
          </Button>
        </CardContent>
      </Card>

      {/* Timezone Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 text-purple-600 ml-2" />
            הגדרות אזור זמן
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              אזור זמן מועדף לזמני יום
            </label>
            <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
              <SelectTrigger className="text-right" data-testid="select-timezone">
                <SelectValue placeholder="בחר אזור זמן" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Jerusalem">ירושלים</SelectItem>
                <SelectItem value="TelAviv">תל אביב</SelectItem>
                <SelectItem value="Haifa">חיפה</SelectItem>
                <SelectItem value="Beersheva">באר שבע</SelectItem>
                <SelectItem value="Eilat">אילת</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="w-full bg-police-blue hover:bg-police-blue/90"
            data-testid="button-save-timezone"
          >
            שמור הגדרות אזור זמן
          </Button>
        </CardContent>
      </Card>

      {/* Personal Details Update Notice */}
      <Card className="shadow-card border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-700">
            <Settings className="h-5 w-5 ml-2" />
            עדכון פרטים אישיים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            לעדכון פרטים אישיים (שם, טלפון, אימייל וכדומה) יש לפנות ישירות למנהל האתר דרך עמוד 'צור קשר'.
          </p>
          <Button 
            variant="outline" 
            className="w-full border-orange-500 text-orange-700 hover:bg-orange-100"
            onClick={() => setLocation("/contact")}
            data-testid="button-contact-admin"
          >
            צור קשר עם המנהל
          </Button>
        </CardContent>
      </Card>

      {/* User Info Display */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 text-purple-600 ml-2" />
            פרטים אישיים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">שם מלא:</span>
              <p className="text-gray-800">{user.fullName || "לא הוגדר"}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">אימייל:</span>
              <p className="text-gray-800">{user.email}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">טלפון:</span>
              <p className="text-gray-800">{user.phone || "לא הוגדר"}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">סטטוס:</span>
              {getStatusBadge(user.status)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Original User Details Card - keep for backward compatibility */}
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
