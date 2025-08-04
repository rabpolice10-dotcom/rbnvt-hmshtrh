import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Star, Clock, MapPin, Calendar } from "lucide-react";

export default function JewishTimes() {
  const [location, setLocation] = useState("ירושלים");
  const [customLocation, setCustomLocation] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  const { data: jewishTimes, isLoading } = useQuery({
    queryKey: ["/api/jewish-times", location],
    retry: false,
  });

  const handleLocationChange = () => {
    if (customLocation.trim()) {
      setLocation(customLocation.trim());
      setIsCustomMode(false);
      setCustomLocation("");
    }
  };

  const commonLocations = [
    "ירושלים",
    "תל אביב",
    "חיפה",
    "באר שבע",
    "אילת",
    "צפת",
    "טבריה",
    "נתניה"
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center mb-6">
        <Sun className="h-6 w-6 text-yellow-600 ml-2" />
        <h1 className="text-xl font-bold text-gray-800">זמני הלכה</h1>
      </div>

      {/* Location Selection */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center mb-3">
            <MapPin className="h-5 w-5 text-police-blue ml-2" />
            <h3 className="font-bold text-gray-800">בחירת מיקום</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">מיקום נוכחי: {location}</Label>
            </div>
            
            {!isCustomMode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {commonLocations.map((loc) => (
                    <Button
                      key={loc}
                      variant={location === loc ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLocation(loc)}
                      className={`text-sm ${location === loc ? "bg-police-blue text-white" : ""}`}
                    >
                      {loc}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCustomMode(true)}
                  className="w-full text-police-blue"
                >
                  הכנס מיקום אחר
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex space-x-reverse space-x-2">
                  <Input
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="הכנס שם עיר..."
                    className="text-right flex-1"
                  />
                  <Button
                    onClick={handleLocationChange}
                    disabled={!customLocation.trim()}
                    size="sm"
                    className="bg-police-blue hover:bg-police-blue-dark text-white"
                  >
                    עדכן
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCustomMode(false);
                    setCustomLocation("");
                  }}
                  className="w-full text-gray-600"
                >
                  חזור לרשימה
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Times Display */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-police-blue ml-2" />
              <h3 className="font-bold text-gray-800">זמנים להיום</h3>
            </div>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString('he-IL')}
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
              <p className="text-gray-600">טוען זמנים...</p>
            </div>
          ) : jewishTimes ? (
            <div className="space-y-4">
              {/* Basic Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <Sun className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">זריחה</p>
                  <p className="font-bold text-lg text-gray-800">{(jewishTimes as any).sunrise}</p>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                  <Sun className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">שקיעה</p>
                  <p className="font-bold text-lg text-gray-800">{(jewishTimes as any).sunset}</p>
                </div>
              </div>

              {/* Shabbat Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <Star className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">כניסת שבת</p>
                  <p className="font-bold text-lg text-gray-800">{(jewishTimes as any).shabbatIn}</p>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <Moon className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">צאת שבת</p>
                  <p className="font-bold text-lg text-gray-800">{(jewishTimes as any).shabbatOut}</p>
                </div>
              </div>

              {/* Additional Times */}
              {(jewishTimes as any).additionalTimes && (
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 text-sm">זמנים נוספים</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {(jewishTimes as any).dawn && (
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">עלות השחר</span>
                        <span className="font-medium">{(jewishTimes as any).dawn}</span>
                      </div>
                    )}
                    {(jewishTimes as any).dusk && (
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">צאת הכוכבים</span>
                        <span className="font-medium">{(jewishTimes as any).dusk}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">לא ניתן לטעון זמנים</h3>
              <p className="text-gray-500">אנא בדוק את החיבור לאינטרנט ונסה שוב</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <h3 className="font-bold text-gray-800 mb-2">מידע חשוב</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• הזמנים מחושבים לפי מיקום הגיאוגרפי של העיר שנבחרה</p>
            <p>• זמני השבת מחושבים עם הוספת 18 דקות לכניסה ו-42 דקות ליציאה</p>
            <p>• במקרה של ספק, יש להתייעץ עם רב מוסמך</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}