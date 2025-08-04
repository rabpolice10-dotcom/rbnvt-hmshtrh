import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  MessageCircleQuestion, 
  Newspaper, 
  MapPin, 
  BookOpen, 
  Video, 
  MessageSquare, 
  Settings, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  BarChart3,
  TrendingUp,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { User, Question, Answer, News, Synagogue, DailyHalacha, Video as VideoType, ContactMessage } from "@shared/schema";

// Form schemas
const newsSchema = z.object({
  title: z.string().min(1, "כותרת נדרשת"),
  content: z.string().min(1, "תוכן נדרש"),
  excerpt: z.string().optional(),
  isUrgent: z.boolean().default(false)
});

const synagogueSchema = z.object({
  name: z.string().min(1, "שם נדרש"),
  address: z.string().min(1, "כתובת נדרשת"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  shacharit: z.string().optional(),
  mincha: z.string().optional(),
  maariv: z.string().optional(),
  contact: z.string().optional(),
  notes: z.string().optional()
});

const halachaSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "תוכן נדרש"),
  date: z.string()
});

const videoSchema = z.object({
  title: z.string().min(1, "כותרת נדרשת"),
  description: z.string().optional(),
  youtubeId: z.string().min(1, "מזהה YouTube נדרש"),
  thumbnail: z.string().optional()
});

interface QuestionWithAnswers extends Question {
  answers: Answer[];
  user?: { fullName: string };
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [viewedTabs, setViewedTabs] = useState<Set<string>>(new Set());
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  // Check admin access - prioritize localStorage admin flag
  useEffect(() => {
    console.log('Checking admin access:', { user, localStorage_isAdmin: localStorage.getItem('isAdmin') });
    
    const checkAdminAccess = async () => {
      // FIRST check localStorage for admin flag (immediate after login)
      const isAdminStored = localStorage.getItem('isAdmin') === 'true';
      if (isAdminStored) {
        console.log('Admin access granted via localStorage');
        setHasAdminAccess(true);
        setIsCheckingAdmin(false);
        return;
      }

      // THEN check if user has admin privileges
      if (user?.email === "admin@police.gov.il" || user?.isAdmin) {
        console.log('Admin access granted via user object');
        setHasAdminAccess(true);
        setIsCheckingAdmin(false);
        return;
      }

      // Only deny access if we have no user AND no admin flag
      if (!user && !isAdminStored) {
        console.log('No admin access found');
        setHasAdminAccess(false);
        setIsCheckingAdmin(false);
      }
    };

    checkAdminAccess();
  }, [user?.email, user?.isAdmin]);

  // Data fetching - only when admin access is confirmed
  const { data: pendingUsers } = useQuery({
    queryKey: ["/api/admin/pending-users"],
    enabled: hasAdminAccess
  }) as { data: User[] | undefined };

  const { data: allQuestions } = useQuery({
    queryKey: ["/api/questions"],
    enabled: hasAdminAccess
  }) as { data: Question[] | undefined };

  const { data: newsList } = useQuery({
    queryKey: ["/api/news"],
    enabled: hasAdminAccess
  }) as { data: News[] | undefined };

  const { data: synagogues } = useQuery({
    queryKey: ["/api/synagogues"],
    enabled: hasAdminAccess
  }) as { data: Synagogue[] | undefined };

  const { data: videos } = useQuery({
    queryKey: ["/api/videos"],
    enabled: hasAdminAccess
  }) as { data: VideoType[] | undefined };

  const { data: contactMessages } = useQuery({
    queryKey: ["/api/admin/contact-messages"],
    enabled: hasAdminAccess
  }) as { data: ContactMessage[] | undefined };

  // User management mutations
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/approve-user/${userId}`, { 
        approvedBy: "admin" 
      });
    },
    onSuccess: () => {
      toast({ title: "המשתמש אושר בהצלחה" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה באישור המשתמש"
      });
    }
  });

  const rejectUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/reject-user/${userId}`, { 
        approvedBy: "admin" 
      });
    },
    onSuccess: () => {
      toast({ title: "המשתמש נדחה" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה בדחיית המשתמש"
      });
    }
  });

  // Question management
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [answerText, setAnswerText] = useState("");

  const answerQuestionMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      return apiRequest("POST", "/api/admin/answers", {
        questionId,
        content: answer
      });
    },
    onSuccess: async () => {
      toast({ title: "התשובה נשלחה בהצלחה" });
      setAnswerText("");
      setSelectedQuestionId("");
      // Mark question as visible when answered
      if (selectedQuestionId) {
        await apiRequest("POST", `/api/questions/${selectedQuestionId}/set-visible`, { isVisible: true });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה בשליחת התשובה"
      });
    }
  });

  const approveQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      return apiRequest("POST", `/api/questions/${questionId}/approve`, {
        approvedBy: "admin"
      });
    },
    onSuccess: () => {
      toast({ title: "השאלה אושרה" });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה באישור השאלה"
      });
    }
  });

  // Content management forms
  const newsForm = useForm<z.infer<typeof newsSchema>>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      isUrgent: false
    }
  });

  const createNewsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof newsSchema>) => {
      // Add deviceId for admin authentication
      const payload = { ...data, deviceId: user?.deviceId };
      return apiRequest("POST", "/api/admin/news", payload);
    },
    onSuccess: () => {
      toast({ title: "החדשה נוצרה בהצלחה" });
      newsForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
    onError: (error) => {
      console.error("News creation error:", error);
      toast({ variant: "destructive", title: "שגיאה ביצירת החדשה" });
    }
  });

  const deleteNewsMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/news/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "החדשה נמחקה" });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה במחיקת החדשה" });
    }
  });

  // Statistics calculations with dynamic updates
  const statistics = {
    totalUsers: pendingUsers?.length || 0,
    pendingQuestions: allQuestions?.filter(q => q.status === "pending").length || 0,
    answeredQuestions: allQuestions?.filter(q => q.status === "answered").length || 0,
    totalNews: newsList?.length || 0,
    totalSynagogues: synagogues?.length || 0,
    totalVideos: videos?.length || 0,
    unreadMessages: contactMessages?.filter(m => !m.isRead).length || 0
  };

  // Reset viewed tabs when new items appear or disappear
  useEffect(() => {
    if (statistics.totalUsers === 0 && viewedTabs.has("users")) {
      setViewedTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete("users");
        return newSet;
      });
    }
    if (statistics.pendingQuestions === 0 && viewedTabs.has("questions")) {
      setViewedTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete("questions");
        return newSet;
      });
    }
    if (statistics.unreadMessages === 0 && viewedTabs.has("messages")) {
      setViewedTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete("messages");
        return newSet;
      });
    }
  }, [statistics.totalUsers, statistics.pendingQuestions, statistics.unreadMessages, viewedTabs]);

  // Loading state
  if (isCheckingAdmin) {
    return (
      <div className="p-4">
        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
            <p className="text-gray-600">בודק הרשאות מנהל...</p>
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
            <Button 
              onClick={() => {
                // Clear all authentication data and force full page reload
                localStorage.clear();
                sessionStorage.clear();
                // Force complete page reload to clear all React state
                window.location.href = "/";
                window.location.reload();
              }}
              className="bg-police-blue hover:bg-police-blue-dark text-white"
            >
              חזור לדף ההרשמה/התחברות
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <Card className="shadow-card bg-gradient-to-r from-police-blue to-police-blue-dark">
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">מערכת ניהול מאוחדת</h1>
                <p className="text-blue-100">ברוך הבא, {user?.fullName || "מנהל המערכת"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <span className="text-sm">מערכת פעילה</span>
              </div>
              <Button 
                onClick={() => {
                  // Use the logout function from useAuth
                  logout();
                }}
                variant="outline"
                className="bg-white text-police-blue border-white hover:bg-gray-100"
              >
                יציאה לדף ההתחברות
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard */}
      <Tabs 
        value={selectedTab} 
        onValueChange={(tab) => {
          setSelectedTab(tab);
          setViewedTabs(prev => new Set([...prev, tab]));
        }}
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="users" className="relative">
            ניהול משתמשים
            {statistics.totalUsers > 0 && !viewedTabs.has("users") && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {statistics.totalUsers}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="questions" className="relative">
            ניהול שאלות
            {statistics.pendingQuestions > 0 && !viewedTabs.has("questions") && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {statistics.pendingQuestions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="content" className="relative">
            ניהול תוכן
            {(newsList?.filter(n => (n as any).isNew).length || 0) > 0 && !viewedTabs.has("content") && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {newsList?.filter(n => (n as any).isNew).length || 0}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="relative">
            הודעות
            {statistics.unreadMessages > 0 && !viewedTabs.has("messages") && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {statistics.unreadMessages}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="text-right flex-1">
                    <p className="text-sm text-gray-600 text-right">משתמשים ממתינים</p>
                    <p className="text-2xl font-bold text-gray-800 text-right">{statistics.totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <MessageCircleQuestion className="h-8 w-8 text-orange-600" />
                  <div className="text-right flex-1">
                    <p className="text-sm text-gray-600 text-right">שאלות ממתינות</p>
                    <p className="text-2xl font-bold text-gray-800 text-right">{statistics.pendingQuestions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="text-right flex-1">
                    <p className="text-sm text-gray-600 text-right">שאלות נענו</p>
                    <p className="text-2xl font-bold text-gray-800 text-right">{statistics.answeredQuestions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                  <div className="text-right flex-1">
                    <p className="text-sm text-gray-600 text-right">הודעות חדשות</p>
                    <p className="text-2xl font-bold text-gray-800 text-right">{statistics.unreadMessages}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                פעילות אחרונה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingUsers?.slice(0, 3).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="text-right flex-1">
                      <p className="font-medium text-right">{user.fullName}</p>
                      <p className="text-sm text-gray-600 text-right">בקשת הרשמה חדשה</p>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      ממתין
                    </Badge>
                  </div>
                ))}
                {allQuestions?.filter(q => q.status === "pending").slice(0, 2).map((question) => (
                  <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="text-right flex-1">
                      <p className="font-medium text-right">{question.title || question.content.substring(0, 50)}...</p>
                      <p className="text-sm text-gray-600 text-right">שאלה חדשה ממתינה לתשובה</p>
                    </div>
                    <Badge variant="secondary">
                      <MessageCircleQuestion className="h-3 w-3 mr-1" />
                      ממתין
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                ניהול משתמשים - משתמשים ממתינים לאישור
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!pendingUsers || pendingUsers.length === 0 ? (
                <p className="text-center text-gray-600 py-8">אין משתמשים ממתינים לאישור</p>
              ) : (
                pendingUsers.map((pendingUser) => (
                  <div key={pendingUser.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 text-right flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg text-right">{pendingUser.fullName}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <p className="text-right"><strong>אימייל:</strong> {pendingUser.email}</p>
                          <p className="text-right"><strong>טלפון:</strong> {pendingUser.phone}</p>
                          <p className="text-right"><strong>מספר אישי:</strong> {pendingUser.personalId}</p>
                          <p className="text-right"><strong>תאריך הרשמה:</strong> {new Date(pendingUser.createdAt).toLocaleDateString('he-IL')}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        ממתין לאישור
                      </Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => approveUserMutation.mutate(pendingUser.id)}
                        disabled={approveUserMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 ml-1" />
                        אשר משתמש
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectUserMutation.mutate(pendingUser.id)}
                        disabled={rejectUserMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 ml-1" />
                        דחה משתמש
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Management Tab */}
        <TabsContent value="questions" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircleQuestion className="h-5 w-5" />
                ניהול שאלות - כל השאלות במערכת
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!allQuestions || allQuestions.length === 0 ? (
                <p className="text-center text-gray-600 py-8">אין שאלות במערכת</p>
              ) : (
                <div className="space-y-4">
                  {allQuestions.map((question) => (
                    <div key={question.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1 text-right">
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <h3 className="font-semibold text-gray-800 text-right">
                              {question.title || "שאלה"}
                            </h3>
                            <Badge variant={question.status === "pending" ? "secondary" : question.status === "answered" ? "default" : "outline"}>
                              {question.status === "pending" ? "ממתין" : question.status === "answered" ? "נענה" : "סגור"}
                            </Badge>
                            {question.isUrgent && (
                              <Badge variant="destructive">דחוף</Badge>
                            )}
                            {question.isPrivate && (
                              <Badge variant="outline">פרטי</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-right">{question.content}</p>
                          <div className="text-sm text-gray-500 text-right">
                            <p className="text-right">קטגוריה: {question.category}</p>
                            <p className="text-right">תאריך: {new Date(question.createdAt).toLocaleDateString('he-IL')}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {question.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => approveQuestionMutation.mutate(question.id)}
                              disabled={approveQuestionMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 ml-1" />
                              אשר שאלה
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => setSelectedQuestionId(question.id)}
                                >
                                  <Edit className="h-4 w-4 ml-1" />
                                  ענה על השאלה
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>מענה לשאלה</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="font-medium mb-2">השאלה:</p>
                                    <p className="text-gray-700">{question.content}</p>
                                  </div>
                                  <div>
                                    <Label htmlFor="answer">התשובה:</Label>
                                    <Textarea
                                      id="answer"
                                      value={answerText}
                                      onChange={(e) => setAnswerText(e.target.value)}
                                      placeholder="הכנס את התשובה כאן..."
                                      rows={5}
                                      className="mt-1"
                                    />
                                  </div>
                                  <Button
                                    onClick={() => answerQuestionMutation.mutate({ 
                                      questionId: selectedQuestionId, 
                                      answer: answerText 
                                    })}
                                    disabled={answerQuestionMutation.isPending || !answerText.trim()}
                                    className="w-full"
                                  >
                                    שלח תשובה
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                        
                        {/* Always show edit and visibility toggle buttons */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 ml-1" />
                              ערוך שאלה
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>עריכת שאלה</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>כותרת השאלה:</Label>
                                <Input 
                                  defaultValue={question.title} 
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label>תוכן השאלה:</Label>
                                <Textarea 
                                  defaultValue={question.content} 
                                  rows={3}
                                  className="mt-1"
                                />
                              </div>
                              <Button className="w-full">
                                שמור שינויים
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant={(question as any).isVisible ? "default" : "outline"}
                          onClick={async () => {
                            await apiRequest("POST", `/api/questions/${question.id}/set-visible`, { 
                              isVisible: !(question as any).isVisible 
                            });
                            queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
                          }}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          {(question as any).isVisible ? "הסתר" : "הפוך לציבורי"}
                        </Button>

                        {question.status === "answered" && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 ml-1" />
                            נענה
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Management Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-4">
            {/* News Management */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  ניהול חדשות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-police-blue hover:bg-police-blue-dark text-white">
                      <Plus className="h-4 w-4 ml-2" />
                      הוסף חדשה
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>הוספת חדשה חדשה</DialogTitle>
                    </DialogHeader>
                    <Form {...newsForm}>
                      <form onSubmit={newsForm.handleSubmit((data) => createNewsMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={newsForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>כותרת</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="הכנס כותרת החדשה" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={newsForm.control}
                          name="excerpt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>תקציר (אופציונלי)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="תקציר קצר של החדשה" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={newsForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>תוכן</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="תוכן מלא של החדשה" rows={5} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={newsForm.control}
                          name="isUrgent"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>חדשה דחופה</FormLabel>
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          disabled={createNewsMutation.isPending}
                          className="w-full"
                        >
                          צור חדשה
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                {/* News List */}
                <div className="space-y-3">
                  {newsList?.map((newsItem) => (
                    <div key={newsItem.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 text-right">
                          <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                            <h3 className="font-semibold text-gray-800 text-right">{newsItem.title}</h3>
                            {newsItem.isUrgent && (
                              <Badge variant="destructive">דחוף</Badge>
                            )}
                          </div>
                          {newsItem.excerpt && (
                            <p className="text-gray-600 text-sm mb-2 text-right">{newsItem.excerpt}</p>
                          )}
                          <p className="text-xs text-gray-500 text-right">
                            {new Date(newsItem.publishedAt).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteNewsMutation.mutate(newsItem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                הודעות יצירת קשר
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!contactMessages || contactMessages.length === 0 ? (
                <p className="text-center text-gray-600 py-8">אין הודעות</p>
              ) : (
                contactMessages.map((message) => (
                  <div key={message.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 text-right">
                        <h3 className="font-semibold text-gray-800 text-right">{message.fullName}</h3>
                        <p className="text-sm text-gray-600 text-right">{message.phone}</p>
                        <p className="text-gray-700 mt-2 text-right">{message.message}</p>
                        <p className="text-xs text-gray-500 mt-2 text-right">
                          {new Date(message.createdAt).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      {!message.isRead && (
                        <Badge variant="secondary">חדש</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}