import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Calendar, TriangleAlert } from "lucide-react";
import type { News } from "@shared/schema";

export default function NewsPage(): JSX.Element {
  const { data: newsList, isLoading } = useQuery({
    queryKey: ["/api/news"],
    retry: false,
  }) as { data: News[] | undefined; isLoading: boolean };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-32">
              <CardContent className="p-4">
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-3 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 h-3 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center mb-6">
        <Newspaper className="h-6 w-6 text-red-600 ml-3" />
        <h1 className="text-2xl font-bold text-gray-800">חדשות ועדכונים</h1>
      </div>

      {newsList && newsList.length > 0 ? (
        <div className="space-y-4">
          {newsList.map((newsItem) => (
            <Card key={newsItem.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg text-gray-800 text-right">
                        {newsItem.title}
                      </CardTitle>
                      {newsItem.isUrgent && (
                        <div className="flex items-center">
                          <TriangleAlert className="h-4 w-4 text-orange-500 ml-1" />
                          <Badge variant="destructive" className="text-xs">דחוף</Badge>
                        </div>
                      )}
                    </div>
                    {newsItem.excerpt && (
                      <p className="text-gray-600 text-sm mb-3 text-right">{newsItem.excerpt}</p>
                    )}
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 ml-1" />
                      <span>{new Date(newsItem.publishedAt).toLocaleDateString('he-IL')}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="prose prose-sm max-w-none text-right">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {newsItem.content}
                  </p>
                </div>
                {newsItem.createdBy && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-right">
                      פורסם על ידי: {newsItem.createdBy}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">אין חדשות זמינות</h3>
            <p className="text-gray-600">עדיין לא פורסמו חדשות במערכת</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}