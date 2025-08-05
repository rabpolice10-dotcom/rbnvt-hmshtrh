import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, CheckCircle, AlertCircle, Lock, User, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Question, Answer } from "@shared/schema";

interface QuestionWithAnswer extends Question {
  answers: Answer[];
  user: { fullName: string };
}

export default function QuestionDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: question, isLoading } = useQuery({
    queryKey: ["/api/questions", id],
    enabled: !!id,
  }) as { data: QuestionWithAnswer | undefined; isLoading: boolean };

  // Mark question answer as viewed
  const markQuestionAnswerViewed = useMutation({
    mutationFn: async (questionId: string) => {
      return apiRequest(`/api/questions/${questionId}/mark-answer-viewed`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    }
  });

  // Mark as viewed if it has new answer and belongs to current user
  useEffect(() => {
    if (question && (question as any).hasNewAnswer && question.userId === user?.id) {
      markQuestionAnswerViewed.mutate(question.id);
    }
  }, [question, user?.id, markQuestionAnswerViewed]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "answered":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "answered":
        return "נענתה";
      case "pending":
        return "ממתין לתשובה";
      case "closed":
        return "סגורה";
      default:
        return "לא ידוע";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
          <p className="text-gray-600">טוען פרטי השאלה...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">השאלה לא נמצאה</h3>
          <Button
            onClick={() => navigate("/questions")}
            className="bg-police-blue hover:bg-police-blue-dark text-white"
          >
            חזור לשאלות
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/questions")}
          className="ml-2"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-gray-800">פרטי השאלה</h1>
      </div>

      {/* Question Card */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">השאלה</CardTitle>
            <div className="flex items-center space-x-reverse space-x-2">
              {getStatusIcon(question.status)}
              <span className="text-sm font-medium">{getStatusText(question.status)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Question metadata */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {question.category}
            </span>
            {question.isUrgent && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                דחוף
              </span>
            )}
            {question.isPrivate && (
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded flex items-center">
                <Lock className="h-3 w-3 ml-1" />
                פרטי
              </span>
            )}
          </div>

          {/* Question content */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{question.content}</p>
          </div>

          {/* Question details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <User className="h-4 w-4 ml-2" />
              <span>נשאל על ידי: {question.user?.fullName || "משתמש"}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 ml-2" />
              <span>תאריך: {new Date(question.createdAt).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answer Card */}
      {question.answers && question.answers.length > 0 ? (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg text-green-700">התשובה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.answers.map((answer) => (
              <div key={answer.id}>
                <div className="bg-green-50 p-4 rounded-lg border-r-4 border-green-500">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{answer.content}</p>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 ml-2" />
                    <span>נענה על ידי: {answer.answeredBy}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 ml-2" />
                    <span>תאריך תשובה: {new Date(answer.createdAt).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
                
                {answer.updatedAt && answer.updatedAt !== answer.createdAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    עודכן: {new Date(answer.updatedAt).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : question.status === "pending" ? (
        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">ממתין לתשובה</h3>
            <p className="text-gray-500">השאלה נמצאת בתהליך עיבוד ותענה בהקדם האפשרי</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Back Button */}
      <div className="pt-4">
        <Button
          onClick={() => navigate("/questions")}
          className="bg-police-blue hover:bg-police-blue-dark text-white"
        >
          חזור לרשימת השאלות
        </Button>
      </div>
    </div>
  );
}