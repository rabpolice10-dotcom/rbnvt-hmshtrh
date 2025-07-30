import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AskRabbiModal } from "@/components/AskRabbiModal";
import { MessageCircleQuestion, Clock, BookOpen, Newspaper, Sun, Calendar, CheckCircle, TriangleAlert } from "lucide-react";
import type { News, DailyHalacha, Question } from "@shared/schema";

export default function Home() {
  const [showAskRabbi, setShowAskRabbi] = useState(false);

  const { data: dailyHalacha } = useQuery({
    queryKey: ["/api/daily-halacha"],
    retry: false,
  }) as { data: DailyHalacha | undefined };

  const { data: recentNews } = useQuery({
    queryKey: ["/api/news", "limit=3"],
  }) as { data: News[] | undefined };

  const { data: recentQuestions } = useQuery({
    queryKey: ["/api/questions"],
    retry: false,
  }) as { data: Question[] | undefined };

  const { data: jewishTimes } = useQuery({
    queryKey: ["/api/jewish-times"],
    retry: false,
  });

  return (
    <div className="p-4 space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => setShowAskRabbi(true)}
          className="bg-police-blue-light hover:bg-blue-100 text-gray-800 p-4 rounded-lg h-auto flex-col space-y-2"
          variant="ghost"
        >
          <MessageCircleQuestion className="h-8 w-8 text-police-blue" />
          <span className="text-sm font-medium">שאל את הרב</span>
        </Button>
        
        <Button
          className="bg-green-50 hover:bg-green-100 text-gray-800 p-4 rounded-lg h-auto flex-col space-y-2"
          variant="ghost"
        >
          <Clock className="h-8 w-8 text-green-600" />
          <span className="text-sm font-medium">זמנים יהודיים</span>
        </Button>
      </div>

      {/* Daily Halacha Card */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center mb-3">
            <BookOpen className="h-5 w-5 text-purple-600 ml-2" />
            <h3 className="font-bold text-gray-800">הלכה יומית לשוטרים</h3>
          </div>
          
          {dailyHalacha ? (
            <>
              <p className="text-gray-700 leading-relaxed">{dailyHalacha.content}</p>
              <div className="mt-3 text-xs text-gray-500 flex items-center">
                <Calendar className="h-3 w-3 ml-1" />
                <span>{new Date(dailyHalacha.date).toLocaleDateString('he-IL')}</span>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">אין הלכה יומית זמינה כרגע</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Q&A */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <MessageCircleQuestion className="h-5 w-5 text-blue-600 ml-2" />
              <h3 className="font-bold text-gray-800">שאלות ותשובות אחרונות</h3>
            </div>
            <Button variant="ghost" className="text-police-blue text-sm p-0 h-auto">
              צפה בכל
            </Button>
          </div>
          
          {recentQuestions && recentQuestions.length > 0 ? (
            <div className="space-y-3">
              {recentQuestions.slice(0, 2).map((question) => (
                <div key={question.id} className="border-r-3 border-police-blue pr-3">
                  <p className="text-sm text-gray-700 mb-1">{question.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      {question.status === "answered" ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
                          נענתה
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 text-yellow-500 ml-1" />
                          ממתין לתשובה
                        </>
                      )}
                    </span>
                    <span>{new Date(question.createdAt).toLocaleDateString('he-IL')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">אין שאלות אחרונות</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* News Feed */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Newspaper className="h-5 w-5 text-red-600 ml-2" />
              <h3 className="font-bold text-gray-800">חדשות ועדכונים</h3>
            </div>
            <Button variant="ghost" className="text-police-blue text-sm p-0 h-auto">
              צפה בכל
            </Button>
          </div>
          
          {recentNews && recentNews.length > 0 ? (
            <div className="space-y-3">
              {recentNews.map((item) => (
                <div key={item.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 mb-1">{item.title}</h4>
                      {item.excerpt && (
                        <p className="text-sm text-gray-600 mb-2">{item.excerpt}</p>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(item.publishedAt).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                    {item.isUrgent && (
                      <TriangleAlert className="h-4 w-4 text-orange-500 flex-shrink-0" title="דחוף" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">אין חדשות זמינות</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jewish Times Widget */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center mb-3">
            <Sun className="h-5 w-5 text-yellow-600 ml-2" />
            <h3 className="font-bold text-gray-800">זמנים יהודיים - ירושלים</h3>
            <Button variant="ghost" className="mr-auto text-police-blue text-xs p-0 h-auto">
              שנה מיקום
            </Button>
          </div>
          
          {jewishTimes ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-yellow-50 rounded">
                <p className="text-gray-600">זריחה</p>
                <p className="font-bold text-gray-800">{jewishTimes.sunrise}</p>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <p className="text-gray-600">שקיעה</p>
                <p className="font-bold text-gray-800">{jewishTimes.sunset}</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <p className="text-gray-600">כניסת שבת</p>
                <p className="font-bold text-gray-800">{jewishTimes.shabbatIn}</p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <p className="text-gray-600">צאת שבת</p>
                <p className="font-bold text-gray-800">{jewishTimes.shabbatOut}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">טוען זמנים...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AskRabbiModal open={showAskRabbi} onOpenChange={setShowAskRabbi} />
    </div>
  );
}
