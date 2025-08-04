import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircleQuestion, MapPin, Video, BookOpen, Clock, UserCheck } from "lucide-react";
// import rabbinateLogoUrl from "@assets/rabbinate-logo.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="max-w-4xl w-full text-center">
        {/* Logo and Title */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-police-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-police-blue mb-2">אפליקציית רבנות המשטרה</h1>
          <p className="text-xl text-gray-600">רבנות המשטרה מתחברת אליכם!</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <MessageCircleQuestion className="h-12 w-12 text-police-blue mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">שאל את הרב</h3>
              <p className="text-gray-600">שאל שאלות הלכתיות וקבל תשובות מרבנים מוסמכים</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <MapPin className="h-12 w-12 text-police-blue mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">בתי כנסת</h3>
              <p className="text-gray-600">מצאו בתי כנסת בתחנות משטרה ובבסיסי מג"ב עם זמני תפילה עדכניים</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Video className="h-12 w-12 text-police-blue mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">סרטונים</h3>
              <p className="text-gray-600">צפו בסרטונים רלוונטיים מרבנות המשטרה</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-12 w-12 text-police-blue mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">הלכה יומית</h3>
              <p className="text-gray-600">הלכות יומיות רלוונטיות לחיי השוטר</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 text-police-blue mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">זמנים יהודיים</h3>
              <p className="text-gray-600">זמני זריחה, שקיעה ושבת לפי מיקומך</p>
            </CardContent>
          </Card>

          
        </div>

        {/* Login/Register Buttons */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => window.location.href = '/login'} 
              size="lg"
              className="bg-police-blue hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              התחברות
            </Button>
            <Button 
              onClick={() => window.location.href = '/register'} 
              size="lg"
              variant="outline"
              className="border-police-blue text-police-blue hover:bg-police-blue hover:text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              הרשמה
            </Button>
          </div>
          <p className="text-sm text-gray-600">להרשמה או התחברות למערכת אפליקציית רבנות המשטרה</p>
        </div>

        {/* Info */}
        <div className="text-center">
          <p className="text-gray-600 max-w-2xl mx-auto">רבנות המשטרה מספקת שירותי דת מותאמים לצרכים הייחודיים של שוטרים ושוטרות. האפליקציה כוללת שאלות לרב, חדשות, מידע על בתי כנסת, תוכן דתי ועוד.</p>
        </div>
      </div>
    </div>
  );
}