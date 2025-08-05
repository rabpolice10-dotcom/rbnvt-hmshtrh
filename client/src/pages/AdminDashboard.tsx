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
  Activity,
  MessageCircle,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotificationBadges } from "@/hooks/useNotificationBadges";
import { useAuth } from "@/hooks/useAuth";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { apiRequest } from "@/lib/queryClient";
import { performLogout } from "@/lib/logout";
import SimpleUserManagement from "@/components/SimpleUserManagement";
import { NotificationBadge } from "@/components/NotificationBadge";
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

// Edit Answer Component
function EditAnswerContent({ 
  questionId, 
  editingAnswerId, 
  setEditingAnswerId, 
  editAnswerText, 
  setEditAnswerText, 
  editAnswerMutation 
}: {
  questionId: string;
  editingAnswerId: string;
  setEditingAnswerId: (id: string) => void;
  editAnswerText: string;
  setEditAnswerText: (text: string) => void;
  editAnswerMutation: any;
}) {
  const { data: answers } = useQuery({
    queryKey: ["/api/answers/question", questionId],
    queryFn: () => fetch(`/api/answers/question/${questionId}`).then(res => res.json())
  }) as { data: Answer[] | undefined };

  if (!answers || answers.length === 0) {
    return <p className="text-gray-600 text-center py-4">אין תשובות לשאלה זו</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">בחר תשובה לעריכה:</p>
      {answers.map((answer) => (
        <div key={answer.id} className="border rounded-lg p-4 space-y-3">
          <div className="text-right">
            <p className="text-gray-700 mb-2">{answer.content}</p>
            <p className="text-xs text-gray-500">
              נכתב ב-{new Date(answer.createdAt).toLocaleDateString('he-IL')} על ידי {answer.answeredBy}
            </p>
          </div>
          
          {editingAnswerId === answer.id ? (
            <div className="space-y-3">
              <Textarea
                value={editAnswerText}
                onChange={(e) => setEditAnswerText(e.target.value)}
                placeholder="ערוך את התשובה..."
                rows={4}
                className="text-right"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (editAnswerText.trim()) {
                      editAnswerMutation.mutate({ 
                        answerId: answer.id, 
                        content: editAnswerText 
                      });
                    }
                  }}
                  disabled={!editAnswerText.trim() || editAnswerMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  שמור שינויים
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingAnswerId("");
                    setEditAnswerText("");
                  }}
                >
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingAnswerId(answer.id);
                setEditAnswerText(answer.content);
              }}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4 ml-1" />
              ערוך תשובה זו
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [viewedTabs, setViewedTabs] = useState<Set<string>>(new Set());
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const { badges, markAsSeen } = useNotificationBadges();
  const { counts, isLoading: notificationsLoading, markUsersSeen, markQuestionsSeen, markContactsSeen, markNewsSeen } = useAdminNotifications();

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
    queryKey: ["/api/admin/questions"],
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
      return apiRequest(`/api/admin/approve-user/${userId}`, { 
        method: "POST",
        body: { approvedBy: "admin" }
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
      return apiRequest(`/api/admin/reject-user/${userId}`, { 
        method: "POST",
        body: { approvedBy: "admin" }
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
  const [editingAnswerId, setEditingAnswerId] = useState<string>("");
  const [editAnswerText, setEditAnswerText] = useState("");

  const answerQuestionMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      return apiRequest("/api/admin/answers", {
        method: "POST",
        body: {
          questionId,
          content: answer
        }
      });
    },
    onSuccess: async () => {
      toast({ title: "התשובה נשלחה בהצלחה" });
      setAnswerText("");
      setSelectedQuestionId("");
      // Clear any edit state to prevent auto-opening edit mode
      setEditingAnswerId("");
      setEditAnswerText("");
      // Refresh all questions to show updated status
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
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
      return apiRequest(`/api/questions/${questionId}/approve`, {
        method: "POST",
        body: { approvedBy: "admin" }
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

  // Edit answer mutation
  const editAnswerMutation = useMutation({
    mutationFn: async ({ answerId, content }: { answerId: string; content: string }) => {
      return apiRequest(`/api/admin/answers/${answerId}`, {
        method: "PUT",
        body: { content }
      });
    },
    onSuccess: () => {
      toast({ title: "התשובה עודכנה בהצלחה" });
      setEditAnswerText("");
      setEditingAnswerId("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה בעדכון התשובה"
      });
    }
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      return apiRequest(`/api/admin/questions/${questionId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({ title: "השאלה נמחקה בהצלחה" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה במחיקת השאלה"
      });
    }
  });

  // Update question mutation
  const [editingQuestionId, setEditingQuestionId] = useState<string>("");
  const [editQuestionTitle, setEditQuestionTitle] = useState("");
  const [editQuestionContent, setEditQuestionContent] = useState("");

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ questionId, title, content }: { questionId: string; title: string; content: string }) => {
      return apiRequest(`/api/admin/questions/${questionId}`, {
        method: "PUT",
        body: { title, content }
      });
    },
    onSuccess: () => {
      toast({ title: "השאלה עודכנה בהצלחה" });
      setEditingQuestionId("");
      setEditQuestionTitle("");
      setEditQuestionContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה בעדכון השאלה"
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
      return apiRequest("/api/admin/news", { 
        method: "POST",
        body: payload
      });
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
      return apiRequest(`/api/admin/news/${id}`, { 
        method: "DELETE"
      });
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
              onClick={performLogout}
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
                <p className="text-[#4585d9]">ברוך הבא, {user?.fullName || "מנהל המערכת"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <span className="text-sm">מערכת פעילה</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={performLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-2xl hover:shadow-red-600/50 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 border-2 border-red-400 hover:border-red-300"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c, #991b1b)',
                    boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <span className="flex items-center gap-2 text-lg">
                    <span className="text-xl">🚪</span>
                    <span>התנתק מהמערכת</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Main Dashboard */}
      <Tabs 
        value={selectedTab} 
        onValueChange={(tab) => {
          setSelectedTab(tab);
          setViewedTabs(prev => new Set([...Array.from(prev), tab]));
          
          // Mark items as seen by admin when entering tabs
          if (tab === "users" && counts.users > 0) {
            markUsersSeen.mutate();
          } else if (tab === "questions" && counts.questions > 0) {
            markQuestionsSeen.mutate();
          } else if (tab === "content" && counts.news > 0) {
            markNewsSeen.mutate();
          } else if (tab === "messages" && counts.contacts > 0) {
            markContactsSeen.mutate();
          }
          
          // Old notification badge logic for compatibility
          if (tab === 'questions' && badges.questions > 0) {
            markAsSeen('questions');
          } else if (tab === 'content' && badges.news > 0) {
            markAsSeen('news');
          } else if ((tab === 'contact' || tab === 'messages') && badges.contacts > 0) {
            markAsSeen('contacts');
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="users" className="relative">
            ניהול משתמשים
            {counts.users > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center animate-pulse">
                {counts.users}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="questions" className="relative">
            ניהול שאלות
            {counts.questions > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center animate-pulse">
                {counts.questions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="content" className="relative">
            ניהול תוכן
            {counts.news > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center animate-pulse">
                {counts.news}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="relative">
            הודעות
            {counts.contacts > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center animate-pulse">
                {counts.contacts}
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
                  <div className="text-right flex-1 relative">
                    <p className="text-sm text-gray-600 text-right">משתמשים ממתינים</p>
                    <p className="text-2xl font-bold text-gray-800 text-right">{statistics.totalUsers}</p>
                    <NotificationBadge 
                      count={badges.users} 
                      isVisible={badges.users > 0}
                      className="absolute -top-4 -right-4"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <MessageCircleQuestion className="h-8 w-8 text-orange-600" />
                  <div className="text-right flex-1 relative">
                    <p className="text-sm text-gray-600 text-right">שאלות ממתינות</p>
                    <p className="text-2xl font-bold text-gray-800 text-right">{statistics.pendingQuestions}</p>
                    <NotificationBadge 
                      count={badges.questions} 
                      isVisible={badges.questions > 0}
                      className="absolute -top-4 -right-4"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="text-right flex-1">
                    <p className="text-sm text-gray-600 text-right">שאלות שנענו</p>
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

        {/* Comprehensive Users Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <SimpleUserManagement />
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
                      
                      <div className="flex gap-2 pt-2 flex-wrap">
                        {/* כפתור 1: ענה על השאלה / ערוך תשובה */}
                        {question.status === "pending" ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => setSelectedQuestionId(question.id)}
                              >
                                <MessageCircle className="h-4 w-4 ml-1" />
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
                        ) : question.status === "answered" ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                                <Edit className="h-4 w-4 ml-1" />
                                ערוך תשובה
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>עריכת תשובה לשאלה</DialogTitle>
                              </DialogHeader>
                              <EditAnswerContent 
                                questionId={question.id}
                                editingAnswerId={editingAnswerId}
                                setEditingAnswerId={setEditingAnswerId}
                                editAnswerText={editAnswerText}
                                setEditAnswerText={setEditAnswerText}
                                editAnswerMutation={editAnswerMutation}
                              />
                            </DialogContent>
                          </Dialog>
                        ) : null}

                        {/* כפתור 2: אשר שאלה / הסר מהמאגר (מתחלף) */}
                        {!(question as any).isVisible ? (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={async () => {
                              try {
                                await apiRequest(`/api/questions/${question.id}/set-visible`, { 
                                  method: "POST",
                                  body: { isVisible: true }
                                });
                                queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
                                queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
                                toast({ title: "השאלה אושרה לפרסום ציבורי" });
                              } catch (error) {
                                toast({
                                  title: "שגיאה באישור השאלה",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <CheckCircle className="h-4 w-4 ml-1" />
                            אשר שאלה
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={async () => {
                              try {
                                await apiRequest(`/api/questions/${question.id}/set-visible`, { 
                                  method: "POST",
                                  body: { isVisible: false }
                                });
                                queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
                                queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
                                toast({ title: "השאלה הוסרה מהמאגר הציבורי" });
                              } catch (error) {
                                toast({
                                  title: "שגיאה בהסרת השאלה",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            הסר מהמאגר
                          </Button>
                        )}

                        {/* כפתור 3: מחק שאלה (אדום בוהק) */}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="bg-red-700 hover:bg-red-800 text-white border-2 border-red-500"
                          onClick={() => {
                            if (confirm("האם אתה בטוח שברצונך למחוק שאלה זו לצמיתות? פעולה זו לא ניתנת לביטול!")) {
                              deleteQuestionMutation.mutate(question.id);
                            }
                          }}
                          disabled={deleteQuestionMutation.isPending}
                        >
                          <X className="h-4 w-4 ml-1" />
                          מחק שאלה
                        </Button>

                        {/* כפתור 4: ערוך שאלה (תמיד מופיע) */}
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
                                  value={editingQuestionId === question.id ? editQuestionTitle : question.title || ""}
                                  onChange={(e) => {
                                    if (editingQuestionId !== question.id) {
                                      setEditingQuestionId(question.id);
                                      setEditQuestionTitle(question.title || "");
                                      setEditQuestionContent(question.content);
                                    }
                                    setEditQuestionTitle(e.target.value);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label>תוכן השאלה:</Label>
                                <Textarea 
                                  value={editingQuestionId === question.id ? editQuestionContent : question.content}
                                  onChange={(e) => {
                                    if (editingQuestionId !== question.id) {
                                      setEditingQuestionId(question.id);
                                      setEditQuestionTitle(question.title || "");
                                      setEditQuestionContent(question.content);
                                    }
                                    setEditQuestionContent(e.target.value);
                                  }}
                                  rows={3}
                                  className="mt-1"
                                />
                              </div>
                              <Button 
                                className="w-full"
                                onClick={() => {
                                  updateQuestionMutation.mutate({
                                    questionId: question.id,
                                    title: editQuestionTitle,
                                    content: editQuestionContent
                                  });
                                }}
                                disabled={updateQuestionMutation.isPending}
                              >
                                שמור שינויים
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* תגיות סטטוס */}
                        {question.status === "answered" && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 ml-1" />
                            נענה
                          </Badge>
                        )}
                        {(question as any).hasNewAnswer && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            התראה נשלחה למשתמש
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