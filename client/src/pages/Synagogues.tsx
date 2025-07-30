import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Route, Clock } from "lucide-react";
import type { Synagogue } from "@shared/schema";

export default function Synagogues() {
  const { data: synagogues, isLoading } = useQuery({
    queryKey: ["/api/synagogues"],
  }) as { data: Synagogue[] | undefined; isLoading: boolean };

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

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">בתי כנסת משטרתיים</h1>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
          <p className="text-gray-600">טוען בתי כנסת...</p>
        </div>
      ) : synagogues && synagogues.length > 0 ? (
        <div className="space-y-4">
          {synagogues.map((synagogue) => (
            <Card key={synagogue.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">{synagogue.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 ml-1" />
                      <span>{synagogue.address}</span>
                    </div>
                    {synagogue.contact && (
                      <p className="text-sm text-gray-600">
                        <strong>איש קשר:</strong> {synagogue.contact}
                      </p>
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
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Route className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openMaps(synagogue.address, synagogue.latitude || undefined, synagogue.longitude || undefined)}
                      className="text-green-600 hover:bg-green-50"
                    >
                      <MapPin className="h-4 w-4" />
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
          ))}
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
