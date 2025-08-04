import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircleQuestion, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Lock, 
  Edit, 
  Eye,
  User,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Question, Answer } from "@shared/schema";

interface QuestionWithAnswers extends Question {
  answers: Answer[];
  user?: { fullName: string };
}

export function AdminQuestionManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithAnswers | null>(null);
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null);
  const [answerContent, setAnswerContent] = useState("");
  const [newAnswerContent, setNewAnswerContent] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionEditData, setQuestionEditData] = useState({
    content: "",
    category: "",
    isUrgent: false,
    isPrivate: false
  });

  // Fetch all questions
  const { data: questions, isLoading } = useQuery({
    queryKey: ["/api/questions"],
  }) as { data: Question[] | undefined; isLoading: boolean };

  // Approve question mutation
  const approveQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      return apiRequest("POST", `/api/questions/${questionId}/approve`, {
        approvedBy: "admin"
      });
    },
    onSuccess: () => {
      toast({
        title: "השאלה אושרה",
        description: "השאלה אושרה ותוצג לציבור",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה באישור השאלה",
      });
    }
  });

  // Create answer mutation
  const createAnswer = useMutation({
    mutationFn: async (data: { questionId: string; content: string }) => {
      return apiRequest("POST", "/api/admin/answers", {
        questionId: data.questionId,
        content: data.content
      });
    },
    onSuccess: () => {
      toast({
        title: "התשובה נשלחה",
        description: "התשובה נוספה בהצלחה",
      });
      setNewAnswerContent("");
      setSelectedQuestion(null);
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בשליחת התשובה",
      });
    }
  });

  // Update answer mutation
  const updateAnswer = useMutation({
    mutationFn: async (data: { answerId: string; content: string }) => {
      return apiRequest("PUT", `/api/answers/${data.answerId}`, {
        content: data.content
      });
    },
    onSuccess: () => {
      toast({
        title: "התשובה עודכנה",
        description: "התשובה עודכנה בהצלחה",
      });
      setEditingAnswer(null);
      setAnswerContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון התשובה",
      });
    }
  });

  // Update question mutation
  const updateQuestion = useMutation({
    mutationFn: async (data: { questionId: string; updates: any }) => {
      return apiRequest("PUT", `/api/questions/${data.questionId}`, data.updates);
    },
    onSuccess: () => {
      toast({
        title: "השאלה עודכנה",
        description: "השאלה עודכנה בהצלחה",
      });
      setEditingQuestion(null);
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון השאלה",
      });
    }
  });

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

  const handleViewQuestion = async (question: Question) => {
    try {
      const response = await apiRequest("GET", `/api/questions/${question.id}`);
      setSelectedQuestion(response as unknown as QuestionWithAnswers);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת פרטי השאלה",
      });
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionEditData({
      content: question.content,
      category: question.category,
      isUrgent: question.isUrgent,
      isPrivate: question.isPrivate
    });
  };

  const handleEditAnswer = (answer: Answer) => {
    setEditingAnswer(answer);
    setAnswerContent(answer.content);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
        <p className="text-gray-600">טוען שאלות...</p>
      </div>
    );
  }

  const pendingQuestions = questions?.filter(q => q.status === "pending" || !q.isApproved) || [];
  const answeredQuestions = questions?.filter(q => q.status === "answered") || [];
  const allQuestions = questions || [];

  return (
    <div className="space-y-6" dir="rtl">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">ממתינות לטיפול ({pendingQuestions.length})</TabsTrigger>
          <TabsTrigger value="answered">נענו ({answeredQuestions.length})</TabsTrigger>
          <TabsTrigger value="all">כל השאלות ({allQuestions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingQuestions.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircleQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">אין שאלות ממתינות לטיפול</p>
            </div>
          ) : (
            pendingQuestions.map((question) => (
              <Card key={question.id} className="shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">שאלה ממתינה</CardTitle>
                    <div className="flex items-center space-x-reverse space-x-2">
                      {getStatusIcon(question.status)}
                      <span className="text-sm">{getStatusText(question.status)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{question.category}</Badge>
                    {question.isUrgent && <Badge variant="destructive">דחוף</Badge>}
                    {question.isPrivate && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        פרטי
                      </Badge>
                    )}
                    {!question.isApproved && <Badge variant="outline">ממתין לאישור</Badge>}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800 leading-relaxed">{question.content}</p>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span>תאריך: {new Date(question.createdAt).toLocaleDateString('he-IL')}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleViewQuestion(question)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      צפה בפרטים
                    </Button>
                    
                    <Button
                      onClick={() => handleEditQuestion(question)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 ml-2" />
                      ערוך שאלה
                    </Button>

                    {!question.isApproved && (
                      <Button
                        onClick={() => approveQuestion.mutate(question.id)}
                        disabled={approveQuestion.isPending}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 ml-2" />
                        אשר שאלה
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="answered" className="space-y-4">
          {answeredQuestions.map((question) => (
            <Card key={question.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-reverse space-x-2">
                    <Badge variant="secondary">{question.category}</Badge>
                    {question.isUrgent && <Badge variant="destructive">דחוף</Badge>}
                    {question.isPrivate && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        פרטי
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-reverse space-x-1">
                    {getStatusIcon(question.status)}
                    <span className="text-sm text-green-600">נענתה</span>
                  </div>
                </div>
                
                <p className="text-gray-800 mb-3 line-clamp-2">{question.content}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{new Date(question.createdAt).toLocaleDateString('he-IL')}</span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewQuestion(question)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      צפה בפרטים
                    </Button>
                    <Button
                      onClick={() => handleEditQuestion(question)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 ml-2" />
                      ערוך
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {allQuestions.map((question) => (
            <Card key={question.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-reverse space-x-2">
                    <Badge variant="secondary">{question.category}</Badge>
                    {question.isUrgent && <Badge variant="destructive">דחוף</Badge>}
                    {question.isPrivate && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        פרטי
                      </Badge>
                    )}
                    {!question.isApproved && <Badge variant="outline">ממתין לאישור</Badge>}
                  </div>
                  <div className="flex items-center space-x-reverse space-x-1">
                    {getStatusIcon(question.status)}
                    <span className="text-sm">{getStatusText(question.status)}</span>
                  </div>
                </div>
                
                <p className="text-gray-800 mb-3 line-clamp-2">{question.content}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{new Date(question.createdAt).toLocaleDateString('he-IL')}</span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewQuestion(question)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      צפה
                    </Button>
                    <Button
                      onClick={() => handleEditQuestion(question)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 ml-2" />
                      ערוך
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Question Detail Dialog */}
      <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>פרטי השאלה</DialogTitle>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{selectedQuestion.category}</Badge>
                {selectedQuestion.isUrgent && <Badge variant="destructive">דחוף</Badge>}
                {selectedQuestion.isPrivate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    פרטי
                  </Badge>
                )}
                {!selectedQuestion.isApproved && <Badge variant="outline">ממתין לאישור</Badge>}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">השאלה:</h4>
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedQuestion.content}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 ml-2" />
                  <span>שואל: {selectedQuestion.user?.fullName || "משתמש"}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 ml-2" />
                  <span>תאריך: {new Date(selectedQuestion.createdAt).toLocaleDateString('he-IL')}</span>
                </div>
              </div>

              {/* Existing Answers */}
              {selectedQuestion.answers && selectedQuestion.answers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">תשובות קיימות:</h4>
                  {selectedQuestion.answers.map((answer) => (
                    <div key={answer.id} className="bg-green-50 p-4 rounded-lg border-r-4 border-green-500">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-2">{answer.content}</p>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>נענה על ידי: {answer.answeredBy}</span>
                        <div className="flex items-center gap-2">
                          <span>{new Date(answer.createdAt).toLocaleDateString('he-IL')}</span>
                          <Button
                            onClick={() => handleEditAnswer(answer)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Answer */}
              {selectedQuestion.status === "pending" && (
                <div className="space-y-3">
                  <h4 className="font-medium">הוסף תשובה:</h4>
                  <Textarea
                    value={newAnswerContent}
                    onChange={(e) => setNewAnswerContent(e.target.value)}
                    placeholder="כתוב את התשובה כאן..."
                    className="min-h-[120px] text-right"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => createAnswer.mutate({
                        questionId: selectedQuestion.id,
                        content: newAnswerContent
                      })}
                      disabled={!newAnswerContent.trim() || createAnswer.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      שלח תשובה
                    </Button>
                    {!selectedQuestion.isApproved && (
                      <Button
                        onClick={() => approveQuestion.mutate(selectedQuestion.id)}
                        disabled={approveQuestion.isPending}
                        variant="outline"
                      >
                        אשר שאלה
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Answer Dialog */}
      <Dialog open={!!editingAnswer} onOpenChange={() => setEditingAnswer(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>ערוך תשובה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              className="min-h-[120px] text-right"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => editingAnswer && updateAnswer.mutate({
                  answerId: editingAnswer.id,
                  content: answerContent
                })}
                disabled={updateAnswer.isPending}
                className="bg-police-blue hover:bg-police-blue-dark text-white"
              >
                שמור שינויים
              </Button>
              <Button
                onClick={() => setEditingAnswer(null)}
                variant="outline"
              >
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>ערוך שאלה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">קטגוריה</Label>
              <Select
                value={questionEditData.category}
                onValueChange={(value) => setQuestionEditData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="שבת וחגים">שבת וחגים</SelectItem>
                  <SelectItem value="כשרות">כשרות</SelectItem>
                  <SelectItem value="שיטור ובטחון">שיטור ובטחון</SelectItem>
                  <SelectItem value="תפילה">תפילה</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="content">תוכן השאלה</Label>
              <Textarea
                value={questionEditData.content}
                onChange={(e) => setQuestionEditData(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-[120px] text-right"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => editingQuestion && updateQuestion.mutate({
                  questionId: editingQuestion.id,
                  updates: questionEditData
                })}
                disabled={updateQuestion.isPending}
                className="bg-police-blue hover:bg-police-blue-dark text-white"
              >
                שמור שינויים
              </Button>
              <Button
                onClick={() => setEditingQuestion(null)}
                variant="outline"
              >
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}