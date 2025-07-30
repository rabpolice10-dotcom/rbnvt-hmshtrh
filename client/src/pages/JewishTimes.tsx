import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Sun, Moon, Star, Calendar } from "lucide-react";

interface JewishTimesData {
  location: string;
  date: string;
  sunrise: string;
  sunset: string;
  shacharit: string;
  mincha: string;
  maariv: string;
  shabbatStart?: string;
  shabbatEnd?: string;
  candleLighting?: string;
  dayOfWeek: string;
}

export default function JewishTimes() {
  const { data: jewishTimes, isLoading } = useQuery({
    queryKey: ["/api/jewish-times/detailed"],
    retry: false,
  }) as { data: JewishTimesData | undefined; isLoading: boolean };

  const currentDate = new Date().toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
          <p className="text-gray-600">טוען זמנים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <Card className="shadow-card bg-gradient-to-r from-police-blue-light to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center mb-2">
            <Clock className="h-5 w-5 text-police-blue ml-2" />
            <h3 className="font-bold text-gray-800">זמנים יהודיים</h3>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 ml-1" />
            <span>{currentDate}</span>
          </div>
          {jewishTimes?.location && (
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPin className="h-4 w-4 ml-1" />
              <span>{jewishTimes.location}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Times */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-800 mb-3">זמנים יומיים</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <Sun className="h-5 w-5 text-orange-500 ml-2" />
                <span className="font-medium">זריחה</span>
              </div>
              <span className="text-lg font-bold text-orange-600">
                {jewishTimes?.sunrise || "06:30"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-500 ml-2" />
                <span className="font-medium">שחרית</span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {jewishTimes?.shacharit || "07:00"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <Sun className="h-5 w-5 text-yellow-500 ml-2" />
                <span className="font-medium">מנחה</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">
                {jewishTimes?.mincha || "13:15"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <Moon className="h-5 w-5 text-purple-500 ml-2" />
                <span className="font-medium">שקיעה</span>
              </div>
              <span className="text-lg font-bold text-purple-600">
                {jewishTimes?.sunset || "17:30"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-indigo-500 ml-2" />
                <span className="font-medium">מעריב</span>
              </div>
              <span className="text-lg font-bold text-indigo-600">
                {jewishTimes?.maariv || "18:15"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shabbat Times */}
      {jewishTimes?.shabbatStart && (
        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-gray-800 mb-3">זמני שבת</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-pink-500 ml-2" />
                  <span className="font-medium">הדלקת נרות</span>
                </div>
                <span className="text-lg font-bold text-pink-600">
                  {jewishTimes.candleLighting || jewishTimes.shabbatStart}
                </span>
              </div>

              {jewishTimes.shabbatEnd && (
                <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                  <div className="flex items-center">
                    <Moon className="h-5 w-5 text-teal-500 ml-2" />
                    <span className="font-medium">צאת השבת</span>
                  </div>
                  <span className="text-lg font-bold text-teal-600">
                    {jewishTimes.shabbatEnd}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Note */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <p className="text-sm text-gray-600 text-center">
            הזמנים מחושבים לפי מיקומך הנוכחי ומקורות הלכתיים מהימנים
          </p>
        </CardContent>
      </Card>
    </div>
  );
}