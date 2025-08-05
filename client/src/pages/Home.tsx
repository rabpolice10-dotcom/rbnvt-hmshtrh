import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AskRabbiModal } from "@/components/AskRabbiModal";
import { MessageCircleQuestion, Clock, BookOpen, Newspaper, Sun, Calendar, CheckCircle, TriangleAlert, Bell, BellRing } from "lucide-react";
import type { News, DailyHalacha, Question, Notification } from "@shared/schema";
import { getHebrewDate } from "@/utils/hebrewDate";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import logo from "@assets/bf4d69d1-82e0-4b41-bc8c-ecca5ca6a895_1753886576969.jpeg";

export default function Home(): JSX.Element {
  const { user, isAuthenticated, isLoading, error, deviceId } = useAuth();
  const queryClient = useQueryClient();
  const [showAskRabbi, setShowAskRabbi] = useState(false);

  const { data: dailyHalacha } = useQuery({
    queryKey: ["/api/daily-halacha"],
    retry: false,
  }) as { data: DailyHalacha | undefined };

  const { data: recentNews } = useQuery({
    queryKey: ["/api/news", { limit: 3 }],
    queryFn: () => apiRequest("/api/news?limit=3")
  }) as { data: News[] | undefined };

  const { data: recentQuestions } = useQuery({
    queryKey: ["/api/questions"],
    retry: false,
  }) as { data: Question[] | undefined };

  // Get user's notifications
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications", user?.id],
    enabled: !!user,
  }) as { data: Notification[] | undefined };

  // Get user's questions to check for new answers
  const { data: userQuestions } = useQuery({
    queryKey: ["/api/questions/user", user?.id],
    enabled: !!user,
  }) as { data: Question[] | undefined };

  // Count unread notifications
  const unreadNotifications = notifications?.filter(n => !n.isRead).length || 0;
  
  // Count questions with new answers
  const questionsWithNewAnswers = userQuestions?.filter(q => 
    q.status === "answered" && (q as any).hasNewAnswer
  ).length || 0;
  
  // Debug logging (can be removed in production)
  console.log('useAuth for regular user:', { user, isAuthenticated, isLoading, error, deviceId });
  console.log('Questions with new answers:', questionsWithNewAnswers);

  const { data: jewishTimes } = useQuery({
    queryKey: ["/api/jewish-times"],
    retry: false,
  }) as { data: { 
    location: string; 
    hebrewDate?: { formatted?: string }; 
    gregorianDate?: { dayOfWeek?: string }; 
    sunrise?: string; 
    sunset?: string; 
  } | undefined };

  // Mark notifications as read
  const markNotificationsAsRead = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      return apiRequest("/api/notifications/mark-read", { method: "POST", body: { notificationIds } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  });

  // Mark question answer as viewed
  const markQuestionAnswerViewed = useMutation({
    mutationFn: async (questionId: string) => {
      return apiRequest(`/api/questions/${questionId}/mark-answer-viewed`, { method: "POST", body: {} });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions/user"] });
    }
  });

  return (
    <div className="p-4 space-y-4">
      {/* Notifications Banner */}
      {(unreadNotifications > 0 || questionsWithNewAnswers > 0) && (
        <Card className="shadow-card bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BellRing className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-bold text-blue-800 text-right">יש לך התראות חדשות!</h3>
                  <p className="text-sm text-blue-600 text-right">
                    {questionsWithNewAnswers > 0 && `${questionsWithNewAnswers} שאלות נענו`}
                    {questionsWithNewAnswers > 0 && unreadNotifications > 0 && " • "}
                    {unreadNotifications > 0 && `${unreadNotifications} התראות חדשות`}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  window.location.pathname = "/questions";
                  // Mark notifications as read when user clicks
                  if (notifications && notifications.length > 0) {
                    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
                    if (unreadIds.length > 0) {
                      markNotificationsAsRead.mutate(unreadIds);
                    }
                  }
                }}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                צפה בהתראות
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => setShowAskRabbi(true)}
          className="bg-police-blue-light hover:bg-blue-100 text-gray-800 p-4 rounded-lg h-auto flex-col space-y-2 relative"
          variant="ghost"
        >
          <MessageCircleQuestion className="h-8 w-8 text-police-blue" />
          <span className="text-sm font-medium">שאל את הרב</span>
          {questionsWithNewAnswers > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
              {questionsWithNewAnswers}
            </Badge>
          )}
        </Button>
        
        <Button
          onClick={() => window.location.href = "/jewish-times"}
          className="bg-green-50 hover:bg-green-100 text-gray-800 p-4 rounded-lg h-auto flex-col space-y-2"
          variant="ghost"
        >
          <Clock className="h-8 w-8 text-green-600" />
          <span className="text-sm font-medium">זמני היום</span>
        </Button>
      </div>
      {/* Jewish Times Quick View */}
      {jewishTimes && (
        <Card 
          className="shadow-card cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => window.location.href = "/jewish-times"}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Sun className="h-5 w-5 text-yellow-600 ml-2" />
                <h3 className="font-bold text-gray-800">זמני היום</h3>
              </div>
              <div className="text-xs text-gray-500">לכל זמני היום</div>
            </div>
            
            <div className="mb-3 text-center">
              <div className="text-sm font-medium text-gray-700">
                {jewishTimes?.hebrewDate?.formatted || getHebrewDate()}
              </div>
              {jewishTimes?.gregorianDate?.dayOfWeek && (
                <div className="text-xs text-gray-500">
                  {jewishTimes.gregorianDate.dayOfWeek}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">זריחה:</span>
                <span className="font-medium">{(jewishTimes as any).sunrise}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">שקיעה:</span>
                <span className="font-medium">{(jewishTimes as any).sunset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">סוף זמן ק"ש:</span>
                <span className="font-medium">{(jewishTimes as any).shemaLatest}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">סוף זמן תפילה:</span>
                <span className="font-medium">{(jewishTimes as any).tefillaLatest}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
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
            <Button 
              variant="ghost" 
              className="text-police-blue text-sm p-0 h-auto"
              onClick={() => window.location.pathname = "/questions"}
            >
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
            <Button 
              variant="ghost" 
              className="text-police-blue text-sm p-0 h-auto"
              onClick={() => window.location.pathname = "/news"}
            >
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
                      <TriangleAlert className="h-4 w-4 text-orange-500 flex-shrink-0" />
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
      <AskRabbiModal open={showAskRabbi} onOpenChange={setShowAskRabbi} />
    </div>
  );
}
