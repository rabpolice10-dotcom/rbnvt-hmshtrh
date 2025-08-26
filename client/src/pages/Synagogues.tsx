import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Filter, Navigation, Clock, SortAsc } from "lucide-react";
import { SiWaze, SiGooglemaps } from "react-icons/si";
import type { Synagogue } from "@shared/schema";

export default function Synagogues() {
  const { data: synagogues, isLoading } = useQuery({
    queryKey: ["/api/synagogues"],
  }) as { data: Synagogue[] | undefined; isLoading: boolean };

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [timeFilter, setTimeFilter] = useState("");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get user location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  // Extract unique cities and regions from synagogues
  const cities = useMemo(() => {
    if (!synagogues) return [];
    const citySet = new Set<string>();
    synagogues.forEach(synagogue => {
      // Extract city from address (assuming format like "רחוב 123, עיר")
      const addressParts = synagogue.address.split(',');
      if (addressParts.length > 1) {
        const city = addressParts[addressParts.length - 1].trim();
        citySet.add(city);
      }
    });
    return Array.from(citySet).sort();
  }, [synagogues]);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter and sort synagogues
  const filteredAndSortedSynagogues = useMemo(() => {
    if (!synagogues) return [];

    let filtered = synagogues.filter(synagogue => {
      // Text search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        synagogue.name.toLowerCase().includes(searchLower) ||
        synagogue.address.toLowerCase().includes(searchLower) ||
        (synagogue.contact && synagogue.contact.toLowerCase().includes(searchLower)) ||
        (synagogue.notes && synagogue.notes.toLowerCase().includes(searchLower));

      // City filter
      const matchesCity = !selectedCity || selectedCity === "all" || 
        synagogue.address.toLowerCase().includes(selectedCity.toLowerCase());

      // Region filter (basic implementation based on common cities)
      let matchesRegion = true;
      if (selectedRegion && selectedRegion !== "all") {
        const address = synagogue.address.toLowerCase();
        switch (selectedRegion) {
          case "center":
            matchesRegion = address.includes("תל אביב") || address.includes("רמת גן") || 
                          address.includes("גבעתיים") || address.includes("חולון") || 
                          address.includes("בת ים") || address.includes("רמת השרון");
            break;
          case "jerusalem":
            matchesRegion = address.includes("ירושלים") || address.includes("בית שמש") ||
                          address.includes("מעלה אדומים");
            break;
          case "north":
            matchesRegion = address.includes("חיפה") || address.includes("נהריה") || 
                          address.includes("עכו") || address.includes("צפת") ||
                          address.includes("טבריה") || address.includes("נצרת");
            break;
          case "south":
            matchesRegion = address.includes("באר שבע") || address.includes("אשדוד") || 
                          address.includes("אשקלון") || address.includes("אילת") ||
                          address.includes("קריית גת");
            break;
        }
      }

      // Time filter
      let matchesTime = true;
      if (timeFilter && timeFilter !== "all") {
        switch (timeFilter) {
          case "morning":
            matchesTime = !!synagogue.shacharit;
            break;
          case "afternoon":
            matchesTime = !!synagogue.mincha;
            break;
          case "evening":
            matchesTime = !!synagogue.maariv;
            break;
          case "all-prayers":
            matchesTime = !!(synagogue.shacharit && synagogue.mincha && synagogue.maariv);
            break;
        }
      }

      return matchesSearch && matchesCity && matchesRegion && matchesTime;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, 'he');
        case "city":
          return a.address.localeCompare(b.address, 'he');
        case "distance":
          if (!userLocation) return 0;
          const distA = a.latitude && a.longitude ? 
            calculateDistance(userLocation.latitude, userLocation.longitude, parseFloat(a.latitude), parseFloat(a.longitude)) : 
            Infinity;
          const distB = b.latitude && b.longitude ? 
            calculateDistance(userLocation.latitude, userLocation.longitude, parseFloat(b.latitude), parseFloat(b.longitude)) : 
            Infinity;
          return distA - distB;
        default:
          return 0;
      }
    });

    return filtered;
  }, [synagogues, searchTerm, selectedCity, selectedRegion, sortBy, timeFilter, userLocation]);

  const openWaze = (address: string) => {
    const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(address)}`;
    window.open(wazeUrl, '_blank');
  };

  const openMaps = (address: string, latitude?: string, longitude?: string) => {
    let mapsUrl: string;
    if (latitude && longitude) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    } else {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    window.open(mapsUrl, '_blank');
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCity("");
    setSelectedRegion("");
    setSortBy("name");
    setTimeFilter("");
    setUserLocation(null);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">בתי כנסת משטרתיים</h1>
        <Badge variant="outline" className="text-xs">
          {filteredAndSortedSynagogues.length} {filteredAndSortedSynagogues.length === 1 ? 'בית כנסת' : 'בתי כנסת'}
        </Badge>
      </div>

      {/* Search and Filter Controls */}
      <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm border">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="חפש בית כנסת לפי שם, כתובת או איש קשר..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-right"
            data-testid="input-search-synagogue"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Region Filter */}
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="text-right" data-testid="select-region">
              <SelectValue placeholder="אזור" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל האזורים</SelectItem>
              <SelectItem value="center">מרכז</SelectItem>
              <SelectItem value="jerusalem">ירושלים והסביבה</SelectItem>
              <SelectItem value="north">צפון</SelectItem>
              <SelectItem value="south">דרום</SelectItem>
            </SelectContent>
          </Select>

          {/* City Filter */}
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="text-right" data-testid="select-city">
              <SelectValue placeholder="עיר" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הערים</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Time Filter */}
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="text-right" data-testid="select-time-filter">
              <SelectValue placeholder="זמני תפילה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל זמני התפילה</SelectItem>
              <SelectItem value="morning">שחרית בלבד</SelectItem>
              <SelectItem value="afternoon">מנחה בלבד</SelectItem>
              <SelectItem value="evening">מעריב בלבד</SelectItem>
              <SelectItem value="all-prayers">כל התפילות</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="text-right" data-testid="select-sort">
              <SelectValue placeholder="מיון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">לפי שם</SelectItem>
              <SelectItem value="city">לפי עיר</SelectItem>
              <SelectItem value="distance">לפי מרחק</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              className="flex items-center gap-2"
              data-testid="button-get-location"
            >
              <Navigation className="h-4 w-4" />
              מצא קרוב אלי
            </Button>
            {userLocation && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                מיקום זוהה
              </Badge>
            )}
          </div>
          
          {(searchTerm || selectedCity || selectedRegion || timeFilter || sortBy !== "name") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
              data-testid="button-clear-filters"
            >
              נקה סינון
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
          <p className="text-gray-600">טוען בתי כנסת...</p>
        </div>
      ) : filteredAndSortedSynagogues.length > 0 ? (
        <div className="space-y-4">
          {filteredAndSortedSynagogues.map((synagogue) => {
            // Calculate distance if user location is available
            const distance = userLocation && synagogue.latitude && synagogue.longitude ?
              calculateDistance(
                userLocation.latitude, 
                userLocation.longitude, 
                parseFloat(synagogue.latitude), 
                parseFloat(synagogue.longitude)
              ).toFixed(1) : null;

            return (
            <Card key={synagogue.id} className="shadow-card" data-testid={`card-synagogue-${synagogue.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800">{synagogue.name}</h3>
                      {distance && (
                        <Badge variant="outline" className="text-xs">
                          {distance} ק"מ
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 ml-1" />
                      <span>{synagogue.address}</span>
                    </div>
                    {(synagogue.contact || synagogue.contactPhone) && (
                      <div className="text-sm text-gray-600">
                        <strong>איש קשר:</strong>
                        {synagogue.contact && <span> {synagogue.contact}</span>}
                        {synagogue.contact && synagogue.contactPhone && <span> | </span>}
                        {synagogue.contactPhone && <span>טלפון: {synagogue.contactPhone}</span>}
                      </div>
                    )}
                    {synagogue.notes && (
                      <p className="text-sm text-gray-600 mt-1">{synagogue.notes}</p>
                    )}
                  </div>
                  <div className="flex space-x-reverse space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openWaze(synagogue.address)}
                      className="text-blue-600 hover:bg-blue-50 flex items-center space-x-reverse space-x-1"
                      title="פתח בוויז"
                    >
                      <SiWaze className="h-4 w-4" />
                      <span className="text-xs">Waze</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openMaps(synagogue.address, synagogue.latitude || undefined, synagogue.longitude || undefined)}
                      className="text-green-600 hover:bg-green-50 flex items-center space-x-reverse space-x-1"
                      title="פתח במפות גוגל"
                    >
                      <SiGooglemaps className="h-4 w-4" />
                      <span className="text-xs">Maps</span>
                    </Button>
                  </div>
                </div>

                {/* Prayer Times */}
                {(synagogue.shacharit || synagogue.mincha || synagogue.maariv) && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {synagogue.shacharit && (
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-gray-600">שחרית</p>
                        <p className="font-bold text-gray-800">{synagogue.shacharit}</p>
                      </div>
                    )}
                    {synagogue.mincha && (
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-gray-600">מנחה</p>
                        <p className="font-bold text-gray-800">{synagogue.mincha}</p>
                      </div>
                    )}
                    {synagogue.maariv && (
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-gray-600">מעריב</p>
                        <p className="font-bold text-gray-800">{synagogue.maariv}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      ) : synagogues && synagogues.length > 0 ? (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">לא נמצאו בתי כנסת מתאימים</h3>
          <p className="text-gray-500 mb-4">נסה לשנות את הפילטרים או החיפוש</p>
          <Button
            variant="outline"
            onClick={clearFilters}
            className="mx-auto"
            data-testid="button-clear-filters-empty"
          >
            נקה את כל הפילטרים
          </Button>
        </div>
      ) : (
        <div className="text-center py-8">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">אין בתי כנסת זמינים</h3>
          <p className="text-gray-500">בתי כנסת יתווספו בקרוב</p>
        </div>
      )}
    </div>
  );
}
