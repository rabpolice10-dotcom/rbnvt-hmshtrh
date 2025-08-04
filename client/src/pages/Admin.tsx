import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users, MessageCircleQuestion, Clock, CheckCircle, XCircle, Shield, Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { AdminContentManager } from "@/components/AdminContentManager";
import type { User, Question, Answer } from "@shared/schema";

interface AdminCheckResponse {
  isAdmin: boolean;
  user: User;
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("users");
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = async () => {
      // For admin email, always grant access
      if (user?.email === "admin@police.gov.il" || user?.isAdmin) {
        setHasAdminAccess(true);
        setIsCheckingAdmin(false);
        return;
      }

      // Check localStorage for admin flag
      const isAdminStored = localStorage.getItem('isAdmin') === 'true';
      if (isAdminStored) {
        setHasAdminAccess(true);
        setIsCheckingAdmin(false);
        return;
      }

      if (!user?.deviceId) {
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const response = await apiRequest("POST", "/api/admin/check", { deviceId: user.deviceId });
        const adminData = response as unknown as AdminCheckResponse;
        setHasAdminAccess(adminData.isAdmin);
      } catch (error) {
        console.error("Admin check failed:", error);
        setHasAdminAccess(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminAccess();
  }, [user?.email, user?.deviceId, user?.isAdmin]);

  // Fetch pending users
  const { data: pendingUsers } = useQuery({
    queryKey: ["/api/users/pending"],
    enabled: hasAdminAccess
  }) as { data: User[] | undefined };

  // Fetch all questions for admin review
  const { data: allQuestions } = useQuery({
    queryKey: ["/api/questions"],
    enabled: hasAdminAccess
  }) as { data: Question[] | undefined };

  // User approval mutations
  const approveUserMutation = useMutation({
    mutationFn: async ({ userId, deviceId }: { userId: string; deviceId: string }) => {
      return apiRequest("POST", `/api/users/approve/${userId}`, { deviceId });
    },
    onSuccess: () => {
      toast({ title: "המשתמש אושר בהצלחה" });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה באישור המשתמש"
      });
    }
  });

  const rejectUserMutation = useMutation({
    mutationFn: async ({ userId, deviceId }: { userId: string; deviceId: string }) => {
      return apiRequest("POST", `/api/users/reject/${userId}`, { deviceId });
    },
    onSuccess: () => {
      toast({ title: "המשתמש נדחה" });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה בדחיית המשתמש"
      });
    }
  });

  // Answer question mutation
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [answerText, setAnswerText] = useState("");
  
  const answerMutation = useMutation({
    mutationFn: async ({ questionId, answer, deviceId }: { questionId: string; answer: string; deviceId: string }) => {
      return apiRequest("POST", "/api/admin/answers", {
        questionId,
        answer,
        deviceId
      });
    },
    onSuccess: () => {
      toast({ title: "התשובה נשלחה בהצלחה" });
      setAnswerText("");
      setSelectedQuestionId("");
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה בשליחת התשובה"
      });
    }
  });

  // Loading state
  if (isCheckingAdmin) {
    return (
      <div className="p-4">
        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
            <p className="text-gray-600">בודק הרשאות...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access denied
  if (!hasAdminAccess) {
    return (
      <div className="p-4">
        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">אין הרשאת גישה</h2>
            <p className="text-gray-600 mb-4">רק מנהלי מערכת יכולים לגשת לדף זה.</p>
            <Link href="/">
              <Button className="bg-police-blue hover:bg-police-blue-dark text-white">
                חזור לדף הבית
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <Card className="shadow-card bg-gradient-to-r from-police-blue-light to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-police-blue" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">פאנל ניהול</h1>
                <p className="text-sm text-gray-600">ברוך הבא, {user?.fullName || "מנהל"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" className="text-police-blue border-police-blue hover:bg-police-blue hover:text-white">
                  <LogOut className="h-4 w-4 ml-2" />
                  דף הבית
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-police-blue" />
              <div>
                <p className="text-sm text-gray-600">משתמשים ממתינים</p>
                <p className="text-2xl font-bold text-gray-800">{pendingUsers?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageCircleQuestion className="h-8 w-8 text-police-blue" />
              <div>
                <p className="text-sm text-gray-600">שאלות ממתינות</p>
                <p className="text-2xl font-bold text-gray-800">
                  {allQuestions?.filter(q => q.status === "pending").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-police-blue" />
              <div>
                <p className="text-sm text-gray-600">ניהול פעיל</p>
                <p className="text-2xl font-bold text-gray-800">מערכת</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">ניהול משתמשים</TabsTrigger>
          <TabsTrigger value="questions">ניהול שאלות</TabsTrigger>
          <TabsTrigger value="content">ניהול תוכן</TabsTrigger>
        </TabsList>

        {/* User Management */}
        <TabsContent value="users" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                משתמשים ממתינים לאישור
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!pendingUsers || pendingUsers.length === 0 ? (
                <p className="text-center text-gray-600 py-8">אין משתמשים ממתינים לאישור</p>
              ) : (
                pendingUsers.map((pendingUser) => (
                  <div key={pendingUser.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-800">{pendingUser.fullName}</h3>
                        <p className="text-sm text-gray-600">{pendingUser.email}</p>
                        <p className="text-sm text-gray-600">טלפון: {pendingUser.phone}</p>
                        {(pendingUser as any).rank && <p className="text-sm text-gray-600">דרגה: {(pendingUser as any).rank}</p>}
                        {(pendingUser as any).unit && <p className="text-sm text-gray-600">יחידה: {(pendingUser as any).unit}</p>}
                        {pendingUser.personalId && (
                          <p className="text-sm text-gray-600">מספר אישי: {pendingUser.personalId}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 ml-1" />
                        ממתין
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => approveUserMutation.mutate({ 
                          userId: pendingUser.id, 
                          deviceId: user?.deviceId || "" 
                        })}
                        disabled={approveUserMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 ml-1" />
                        אשר
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectUserMutation.mutate({ 
                          userId: pendingUser.id, 
                          deviceId: user?.deviceId || "" 
                        })}
                        disabled={rejectUserMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 ml-1" />
                        דחה
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Question Management */}
        <TabsContent value="questions" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircleQuestion className="h-5 w-5" />
                שאלות ממתינות לתשובה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!allQuestions || allQuestions.filter(q => q.status === "pending").length === 0 ? (
                <p className="text-center text-gray-600 py-8">אין שאלות ממתינות לתשובה</p>
              ) : (
                allQuestions
                  .filter(q => q.status === "pending")
                  .map((question) => (
                    <div key={question.id} className="border rounded-lg p-4 space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-800">{question.title || "שאלה ללא כותרת"}</h3>
                          <div className="flex gap-2">
                            <Badge variant="secondary">
                              {question.category}
                            </Badge>
                            {question.isUrgent && (
                              <Badge variant="destructive">דחוף</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700">{question.content}</p>
                        <p className="text-xs text-gray-500">
                          נשאל ב-{new Date(question.createdAt).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="bg-police-blue hover:bg-police-blue-dark text-white"
                            onClick={() => setSelectedQuestionId(question.id)}
                          >
                            ענה על השאלה
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>מענה לשאלה</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="font-medium text-gray-800">{question.title || "שאלה ללא כותרת"}</p>
                              <p className="text-sm text-gray-600 mt-1">{question.content}</p>
                            </div>
                            <Textarea
                              placeholder="כתוב כאן את התשובה..."
                              value={answerText}
                              onChange={(e) => setAnswerText(e.target.value)}
                              className="h-32 resize-none text-right"
                            />
                            <Button
                              className="w-full bg-police-blue hover:bg-police-blue-dark text-white"
                              onClick={() => answerMutation.mutate({
                                questionId: question.id,
                                answer: answerText,
                                deviceId: user?.deviceId || ""
                              })}
                              disabled={!answerText.trim() || answerMutation.isPending}
                            >
                              {answerMutation.isPending ? "שולח..." : "שלח תשובה"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Management */}
        <TabsContent value="content" className="space-y-4">
          <AdminContentManager deviceId={user?.deviceId || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}