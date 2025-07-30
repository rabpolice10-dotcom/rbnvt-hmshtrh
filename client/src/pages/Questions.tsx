import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AskRabbiModal } from "@/components/AskRabbiModal";
import { MessageCircleQuestion, Search, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Question } from "@shared/schema";

export default function Questions() {
  const { user } = useAuth();
  const [showAskRabbi, setShowAskRabbi] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: questions, isLoading } = useQuery({
    queryKey: ["/api/questions", "user", user?.id],
    enabled: !!user,
  }) as { data: Question[] | undefined; isLoading: boolean };

  const { data: searchResults } = useQuery({
    queryKey: ["/api/questions/search", `q=${searchQuery}`],
    enabled: searchQuery.length > 2,
  }) as { data: Question[] | undefined };

  const displayQuestions = searchQuery.length > 2 ? searchResults : questions;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "answered":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">שאלות ותשובות</h1>
        <Button
          onClick={() => setShowAskRabbi(true)}
          className="bg-police-blue hover:bg-police-blue-dark text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 ml-2" />
          שאלה חדשה
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="חפש שאלות..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 text-right"
        />
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
            <p className="text-gray-600">טוען שאלות...</p>
          </div>
        ) : displayQuestions && displayQuestions.length > 0 ? (
          displayQuestions.map((question) => (
            <Card key={question.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {question.category}
                      </span>
                      {question.isUrgent && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded mr-2">
                          דחוף
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 mb-3">{question.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        {getStatusIcon(question.status)}
                        <span className="mr-1">{getStatusText(question.status)}</span>
                      </div>
                      <span>{new Date(question.createdAt).toLocaleDateString('he-IL')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageCircleQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchQuery ? "לא נמצאו תוצאות" : "אין שאלות עדיין"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? "נסה מונח חיפוש אחר" : "התחל בשאילת השאלה הראשונה שלך"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowAskRabbi(true)}
                className="bg-police-blue hover:bg-police-blue-dark text-white"
              >
                שאל את הרב
              </Button>
            )}
          </div>
        )}
      </div>

      <AskRabbiModal open={showAskRabbi} onOpenChange={setShowAskRabbi} />
    </div>
  );
}
