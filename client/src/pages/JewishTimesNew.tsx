import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Sun, Moon, Calendar, MapPin, RefreshCw, Settings, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JewishTimes {
  location: string;
  englishLocation?: string;
  coordinates?: { latitude: number; longitude: number };
  
  // Basic times
  sunrise: string;
  sunset: string;
  
  // Prayer times
  shacharit?: string;
  mincha?: string;
  maariv?: string;
  
  // Shema and Tefilla times
  shemaLatest: string;
  tefillaLatest: string;
  
  // Shabbat times
  shabbatStart: string;
  shabbatEnd: string;
  
  // Extended times for comprehensive view
  mincha?: string;
  minchaKetana?: string;
  plagHamincha?: string;
  beinHashmashot?: string;
  fastEnds?: string;
  kiddushLevana?: string;
  chatzot?: string;
  chatzotNight?: string;
  alotHashachar?: string;
  misheyakir?: string;
  misheyakirMachmir?: string;
  sofZmanShema?: string;
  sofZmanTefilla?: string;
  
  // Additional times
  dawn?: string;
  dusk?: string;
  midday?: string;
  
  // Date information
  date: string;
  gregorianDate?: {
    day: number;
    month: number;
    year: number;
    dayOfWeek: string;
  };
  hebrewDate?: {
    day: string;
    month: string;
    year: string;
    formatted: string;
  };
  
  // Shabbat information
  parsha?: string;
  
  lastUpdated?: string;
  timezone?: string;
  fallback?: boolean;
}

interface City {
  id: string;
  name: string;
  english: string;
}

export default function JewishTimesNew() {
  const [selectedCity, setSelectedCity] = useState("ירושלים");
  const { toast } = useToast();

  // Fetch available cities
  const { data: cities } = useQuery<City[]>({
    queryKey: ["/api/jewish-times/cities"],
  });

  // Fetch Jewish times for selected city with real-time refresh
  const { data: jewishTimes, isLoading, isError, refetch } = useQuery<JewishTimes>({
    queryKey: ["/api/jewish-times", selectedCity],
    refetchInterval: 60000, // Refresh every minute for real-time sync
    refetchOnWindowFocus: true,
  });

  // Auto-save user's city preference
  useEffect(() => {
    localStorage.setItem('preferredCity', selectedCity);
  }, [selectedCity]);

  // Load saved city preference on component mount
  useEffect(() => {
    const savedCity = localStorage.getItem('preferredCity');
    if (savedCity && cities && Array.isArray(cities) && cities.some(city => city.id === savedCity)) {
      setSelectedCity(savedCity);
    }
  }, [cities]);

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    toast({
      title: "מיקום עודכן",
      description: `הזמנים מוצגים עבור ${cities && Array.isArray(cities) ? cities.find(c => c.id === cityId)?.name : cityId}`,
    });
  };

  const formatTimeLabel = (time: string, label: string) => {
    if (!time || time === "לא זמין") return null;
    return (
      <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="font-bold text-police-blue">{time}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center animate-pulse">
          <Sun className="h-6 w-6 text-yellow-600 ml-2" />
          <h1 className="text-xl font-bold text-gray-800">זמני היום</h1>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="text-center text-gray-500">טוען זמנים יהודיים...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !jewishTimes) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center">
          <Sun className="h-6 w-6 text-yellow-600 ml-2" />
          <h1 className="text-xl font-bold text-gray-800">זמני היום</h1>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              שגיאה בטעינת הזמנים היהודיים
              <br />
              <Button onClick={() => refetch()} className="mt-2" variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 ml-2" />
                נסה שוב
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isShabbat = new Date().getDay() === 6;
  const isFriday = new Date().getDay() === 5;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Sun className="h-6 w-6 text-yellow-600 ml-2" />
          <h1 className="text-xl font-bold text-gray-800">זמני היום</h1>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          רענן
        </Button>
      </div>

      {/* Location Selection */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <MapPin className="h-5 w-5 text-police-blue ml-2" />
            בחירת מיקום
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="בחר עיר" />
              </SelectTrigger>
              <SelectContent>
                {cities && Array.isArray(cities) ? cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    <div className="flex items-center gap-2">
                      <span>{city.name}</span>
                      <span className="text-xs text-gray-500">({city.english})</span>
                    </div>
                  </SelectItem>
                )) : (
                  <SelectItem value="ירושלים">ירושלים (Jerusalem)</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {jewishTimes.coordinates && (
              <div className="text-xs text-gray-500 text-center">
                <Globe className="h-3 w-3 inline ml-1" />
                {jewishTimes.coordinates.latitude.toFixed(4)}°, {jewishTimes.coordinates.longitude.toFixed(4)}°
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Date Information */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Calendar className="h-5 w-5 text-police-blue ml-2" />
            תאריך
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {jewishTimes.gregorianDate && (
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">
                  {jewishTimes.gregorianDate?.dayOfWeek || ""}
                </div>
                <div className="text-sm text-gray-600">
                  {jewishTimes.date || ""}
                </div>
              </div>
            )}
            
            {jewishTimes.hebrewDate && (
              <div className="text-center bg-blue-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-police-blue">
                  {jewishTimes.hebrewDate?.formatted || "לא זמין"}
                </div>
                <div className="text-xs text-gray-500">תאריך עברי</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prayer Times */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Clock className="h-5 w-5 text-police-blue ml-2" />
            זמני תפילה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {formatTimeLabel(jewishTimes.dawn || jewishTimes.alotHashachar, "עלות השחר")}
            {formatTimeLabel(jewishTimes.misheyakir, "משיכיר")}
            {formatTimeLabel(jewishTimes.sunrise, "זריחה")}
            {formatTimeLabel(jewishTimes.shemaLatest || jewishTimes.sofZmanShema, "סוף זמן קריאת שמע")}
            {formatTimeLabel(jewishTimes.tefillaLatest || jewishTimes.sofZmanTefilla, "סוף זמן תפילה")}
            {formatTimeLabel(jewishTimes.midday || jewishTimes.chatzot, "חצות היום")}
            {formatTimeLabel(jewishTimes.mincha, "מנחה גדולה")}
            {formatTimeLabel(jewishTimes.minchaKetana, "מנחה קטנה")}
            {formatTimeLabel(jewishTimes.plagHamincha, "פלג המנחה")}
            {formatTimeLabel(jewishTimes.sunset, "שקיעה")}
            {formatTimeLabel(jewishTimes.beinHashmashot, "בין השמשות")}
            {formatTimeLabel(jewishTimes.maariv || jewishTimes.dusk, "צאת הכוכבים")}
            {formatTimeLabel(jewishTimes.chatzotNight, "חצות הלילה")}
          </div>
        </CardContent>
      </Card>

      {/* Shabbat Times */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Moon className="h-5 w-5 text-police-blue ml-2" />
            זמני שבת
            {(isShabbat || isFriday) && (
              <Badge variant="secondary" className="mr-2 bg-blue-100 text-blue-800">
                {isShabbat ? "שבת קודש" : "ערב שבת"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {jewishTimes.parsha && (
              <div className="text-center bg-purple-50 p-3 rounded-lg mb-3">
                <div className="text-lg font-bold text-purple-800">
                  {jewishTimes.parsha}
                </div>
                <div className="text-xs text-gray-500">פרשת השבוע</div>
              </div>
            )}
            
            <div className="space-y-1">
              {formatTimeLabel(jewishTimes.shabbatStart, "הדלקת נרות")}
              {formatTimeLabel(jewishTimes.shabbatEnd, "צאת השבת")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Source Info */}
      <Card className="shadow-card bg-gray-50">
        <CardContent className="p-4">
          <div className="text-xs text-gray-500 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span>מקור נתונים: Hebcal API</span>
              {jewishTimes.fallback && (
                <Badge variant="secondary" className="text-xs">חישוב מקומי</Badge>
              )}
            </div>
            {jewishTimes.lastUpdated && (
              <div>
                עודכן לאחרונה: {new Date(jewishTimes.lastUpdated).toLocaleTimeString('he-IL')}
              </div>
            )}
            <div className="text-green-600 font-medium">
              ✓ סנכרון בזמן אמת
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}