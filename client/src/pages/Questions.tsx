import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AskRabbiModal } from "@/components/AskRabbiModal";
import { MessageCircleQuestion, Search, Plus, CheckCircle, Clock, AlertCircle, Lock, Filter, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Question } from "@shared/schema";

export default function Questions() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showAskRabbi, setShowAskRabbi] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Get public answered questions for all users + user's own questions
  const { data: publicQuestions, isLoading: publicLoading } = useQuery({
    queryKey: ["/api/questions"],
    enabled: !!user,
  }) as { data: Question[] | undefined; isLoading: boolean };

  const { data: userQuestions, isLoading: userLoading } = useQuery({
    queryKey: ["/api/questions/user", user?.id],
    enabled: !!user,
  }) as { data: Question[] | undefined; isLoading: boolean };

  const { data: searchResults } = useQuery({
    queryKey: ["/api/questions/search", `q=${searchQuery}`],
    enabled: searchQuery.length > 2,
  }) as { data: Question[] | undefined };

  const isLoading = publicLoading || userLoading;
  
  // Combine public questions with user's own questions (avoiding duplicates)
  const allQuestions = publicQuestions && userQuestions ? [
    ...publicQuestions,
    ...userQuestions.filter(uq => !publicQuestions.some(pq => pq.id === uq.id))
  ] : (publicQuestions || userQuestions || []);

  // Filter and sort questions
  let displayQuestions = searchQuery.length > 2 ? searchResults : allQuestions;
  
  if (displayQuestions) {
    // Apply filters
    displayQuestions = displayQuestions.filter(question => {
      if (filterBy === "mine" && question.userId !== user?.id) return false;
      if (filterBy === "unanswered" && question.status !== "pending") return false;
      if (categoryFilter !== "all" && question.category !== categoryFilter) return false;
      return true;
    });

    // Apply sorting
    displayQuestions = [...displayQuestions].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "category":
          return a.category.localeCompare(b.category, 'he');
        default:
          return 0;
      }
    });
  }

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
        <h1 className="text-xl font-bold text-gray-800">שאל את הרב</h1>
        <Button
          onClick={() => setShowAskRabbi(true)}
          className="bg-police-blue hover:bg-police-blue-dark text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 ml-2" />
          שאלה חדשה
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
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
        
        <div className="flex flex-wrap gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-4 w-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">החדשות ביותר</SelectItem>
              <SelectItem value="oldest">הישנות ביותר</SelectItem>
              <SelectItem value="category">לפי קטגוריה</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[120px]">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="mine">רק שלי</SelectItem>
              <SelectItem value="unanswered">לא נענו</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              <SelectItem value="שבת וחגים">שבת וחגים</SelectItem>
              <SelectItem value="כשרות">כשרות</SelectItem>
              <SelectItem value="שיטור ובטחון">שיטור ובטחון</SelectItem>
              <SelectItem value="תפילה">תפילה</SelectItem>
              <SelectItem value="אחר">אחר</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
            <Card 
              key={question.id} 
              className="shadow-card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                if (question.status === "answered") {
                  navigate(`/questions/${question.id}`);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {question.category}
                      </span>
                    </div>
                    <p className="text-gray-800 mb-3 line-clamp-3">{question.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        {getStatusIcon(question.status)}
                        <span className="mr-1">{getStatusText(question.status)}</span>
                        {question.status === "answered" && (
                          <span className="mr-2 text-blue-600 cursor-pointer">לחץ לצפייה</span>
                        )}
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
