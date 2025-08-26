import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Calendar, Clock, Filter } from "lucide-react";
import type { DailyHalacha } from "@shared/schema";

export default function DailyHalachaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const { data: halachot, isLoading } = useQuery({
    queryKey: ["/api/daily-halacha/all"],
  }) as { data: DailyHalacha[] | undefined; isLoading: boolean };

  const { data: todayHalacha } = useQuery({
    queryKey: ["/api/daily-halacha"],
  }) as { data: DailyHalacha | undefined };

  // Filter and sort halachot
  const filteredAndSortedHalachot = halachot?.filter(halacha => {
    const matchesSearch = !searchTerm || 
      halacha.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (halacha.title && halacha.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = !selectedDate || 
      new Date(halacha.date).toISOString().split('T')[0] === selectedDate;

    return matchesSearch && matchesDate;
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case "oldest":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "title":
        return (a.title || "").localeCompare(b.title || "");
      default:
        return 0;
    }
  }) || [];

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDate("");
    setSortBy("newest");
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען הלכות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BookOpen className="h-6 w-6 text-purple-600 ml-2" />
          <h1 className="text-2xl font-bold text-gray-800">הלכה יומית לשוטרים</h1>
        </div>
      </div>

      {/* Today's Halacha - Highlighted */}
      {todayHalacha && (
        <Card className="shadow-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Badge variant="default" className="bg-purple-600 text-white mb-2">
                הלכה יומית - היום
              </Badge>
            </div>
            {todayHalacha.title && (
              <h2 className="text-xl font-bold text-gray-800 mb-3">{todayHalacha.title}</h2>
            )}
            <p className="text-gray-700 leading-relaxed text-lg mb-4">{todayHalacha.content}</p>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 ml-1" />
              <span>{new Date(todayHalacha.date).toLocaleDateString('he-IL')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Controls */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="חפש בהלכות לפי נושא או תוכן..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right"
                data-testid="input-search-halacha"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Date Filter */}
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-right"
                data-testid="input-date-filter"
              />

              {/* Sort Options */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="text-right" data-testid="select-sort">
                  <SelectValue placeholder="מיון" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">החדשות ביותר</SelectItem>
                  <SelectItem value="oldest">הישנות ביותר</SelectItem>
                  <SelectItem value="title">לפי כותרת</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchTerm || selectedDate || sortBy !== "newest") && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center"
                  data-testid="button-clear-filters"
                >
                  <Filter className="h-4 w-4 ml-1" />
                  נקה סינונים
                </Button>
              )}
            </div>

            {/* Results Counter */}
            <div className="flex items-center text-sm text-gray-600">
              <Badge variant="outline" className="text-gray-600">
                {filteredAndSortedHalachot.length} {filteredAndSortedHalachot.length === 1 ? 'הלכה' : 'הלכות'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Halachot List */}
      {filteredAndSortedHalachot.length > 0 ? (
        <div className="space-y-4">
          {filteredAndSortedHalachot.map((halacha) => (
            <Card key={halacha.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {/* Header with date */}
                  <div className="flex items-center justify-between">
                    {halacha.title && (
                      <h3 className="text-lg font-semibold text-gray-800">{halacha.title}</h3>
                    )}
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 ml-1" />
                      <span>{new Date(halacha.date).toLocaleDateString('he-IL')}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 leading-relaxed">{halacha.content}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 ml-1" />
                      <span>{new Date(halacha.date).toLocaleDateString('he-IL')}</span>
                    </div>
                    {new Date(halacha.date).toDateString() === new Date().toDateString() && (
                      <Badge variant="default" className="bg-purple-600 text-white text-xs">
                        היום
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">לא נמצאו הלכות המתאימות לחיפוש</p>
            {(searchTerm || selectedDate) && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-3"
                data-testid="button-clear-search"
              >
                נקה חיפוש
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}