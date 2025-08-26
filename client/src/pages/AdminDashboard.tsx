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
  contactPhone: z.string().optional(),
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

  const { data: halachot } = useQuery({
    queryKey: ["/api/daily-halacha/all"],
    enabled: hasAdminAccess
  }) as { data: DailyHalacha[] | undefined };

  // User management mutations
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/admin/approve-user/${userId}`, { 
        method: "POST",
        body: { approvedBy: "admin", deviceId: localStorage.getItem('deviceId') || 'admin-device-simple' }
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
        body: { approvedBy: "admin", deviceId: localStorage.getItem('deviceId') || 'admin-device-simple' }
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
  
  // Edit state for news, synagogues, and halacha
  const [editingNewsId, setEditingNewsId] = useState<string>("");
  const [editingSynagogueId, setEditingSynagogueId] = useState<string>("");
  const [editingHalachaId, setEditingHalachaId] = useState<string>("");

  const answerQuestionMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      return apiRequest("/api/admin/answers", {
        method: "POST",
        body: {
          questionId,
          content: answer,
          deviceId: localStorage.getItem('deviceId') || 'admin-device-simple'
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
        body: { approvedBy: "admin", deviceId: localStorage.getItem('deviceId') || 'admin-device-simple' }
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
        body: { content, deviceId: localStorage.getItem('deviceId') || 'admin-device-simple' }
      });
    },
    onSuccess: () => {
      toast({ title: "התשובה עודכנה בהצלחה" });
      setEditAnswerText("");
      setEditingAnswerId("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      // Invalidate answers queries to refresh the EditAnswerContent component
      queryClient.invalidateQueries({ queryKey: ["/api/answers/question"] });
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
        method: "DELETE",
        body: { deviceId: localStorage.getItem('deviceId') || 'admin-device-simple' }
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
        body: { title, content, deviceId: localStorage.getItem('deviceId') || 'admin-device-simple' }
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
      const payload = { ...data, deviceId: localStorage.getItem('deviceId') || 'admin-device-simple' };
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

  const updateNewsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof newsSchema> }) => {
      return apiRequest(`/api/admin/news/${id}`, { 
        method: "PUT",
        body: { ...data, deviceId: localStorage.getItem('deviceId') || 'admin-device-simple' }
      });
    },
    onSuccess: () => {
      toast({ title: "החדשה עודכנה בהצלחה" });
      setEditingNewsId("");
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה בעדכון החדשה" });
    }
  });

  const deleteNewsMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/news/${id}`, { 
        method: "DELETE",
        body: { deviceId: localStorage.getItem('deviceId') || 'admin-device-simple' }
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

  // Synagogue management
  const synagogueForm = useForm<z.infer<typeof synagogueSchema>>({
    resolver: zodResolver(synagogueSchema),
    defaultValues: {
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      shacharit: "",
      mincha: "",
      maariv: "",
      contact: "",
      contactPhone: "",
      notes: ""
    }
  });

  const halachaForm = useForm<z.infer<typeof halachaSchema>>({
    resolver: zodResolver(halachaSchema),
    defaultValues: {
      title: "",
      content: "",
      date: new Date().toISOString().split('T')[0]
    }
  });

  const createSynagogueMutation = useMutation({
    mutationFn: async (data: z.infer<typeof synagogueSchema>) => {
      // Add deviceId for admin authentication
      const payload = { ...data, deviceId: localStorage.getItem('deviceId') || 'admin-device-simple' };
      return apiRequest("/api/admin/synagogues", { 
        method: "POST",
        body: payload
      });
    },
    onSuccess: () => {
      toast({ title: "בית הכנסת נוצר בהצלחה" });
      synagogueForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/synagogues"] });
    },
    onError: (error) => {
      console.error("Synagogue creation error:", error);
      toast({ variant: "destructive", title: "שגיאה ביצירת בית הכנסת" });
    }
  });

  const updateSynagogueMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof synagogueSchema> }) => {
      const deviceId = localStorage.getItem('deviceId') || 'admin-device-simple';
      const payload = { ...data, deviceId };
      console.log('Updating synagogue:', { id, payload });
      return apiRequest(`/api/admin/synagogues/${id}`, { 
        method: "PUT",
        body: payload
      });
    },
    onSuccess: () => {
      toast({ title: "בית הכנסת עודכן בהצלחה" });
      setEditingSynagogueId("");
      queryClient.invalidateQueries({ queryKey: ["/api/synagogues"] });
    },
    onError: (error) => {
      console.error('Synagogue update error:', error);
      toast({ variant: "destructive", title: "שגיאה בעדכון בית הכנסת" });
    }
  });

  const deleteSynagogueMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/synagogues/${id}`, { 
        method: "DELETE",
        body: { deviceId: localStorage.getItem('deviceId') || 'admin-device-simple' }
      });
    },
    onSuccess: () => {
      toast({ title: "בית הכנסת נמחק" });
      queryClient.invalidateQueries({ queryKey: ["/api/synagogues"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה במחיקת בית הכנסת" });
    }
  });

  // Halacha management mutations
  const createHalachaMutation = useMutation({
    mutationFn: async (data: z.infer<typeof halachaSchema>) => {
      const deviceId = localStorage.getItem('deviceId') || 'admin-device-simple';
      const payload = { ...data, deviceId };
      return apiRequest("/api/admin/daily-halacha", { 
        method: "POST",
        body: payload
      });
    },
    onSuccess: () => {
      toast({ title: "הלכה יומית נוצרה בהצלחה" });
      halachaForm.reset({
        title: "",
        content: "",
        date: new Date().toISOString().split('T')[0]
      });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-halacha/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-halacha"] });
    },
    onError: (error) => {
      console.error("Halacha creation error:", error);
      toast({ variant: "destructive", title: "שגיאה ביצירת הלכה יומית" });
    }
  });

  const updateHalachaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof halachaSchema> }) => {
      const deviceId = localStorage.getItem('deviceId') || 'admin-device-simple';
      const payload = { ...data, deviceId };
      return apiRequest(`/api/admin/daily-halacha/${id}`, { 
        method: "PUT",
        body: payload
      });
    },
    onSuccess: () => {
      toast({ title: "הלכה יומית עודכנה בהצלחה" });
      setEditingHalachaId("");
      queryClient.invalidateQueries({ queryKey: ["/api/daily-halacha/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-halacha"] });
    },
    onError: (error) => {
      console.error('Halacha update error:', error);
      toast({ variant: "destructive", title: "שגיאה בעדכון הלכה יומית" });
    }
  });

  const deleteHalachaMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/daily-halacha/${id}`, { 
        method: "DELETE",
        body: { deviceId: localStorage.getItem('deviceId') || 'admin-device-simple' }
      });
    },
    onSuccess: () => {
      toast({ title: "הלכה יומית נמחקה" });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-halacha/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-halacha"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה במחיקת הלכה יומית" });
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
    <div className="p-2 sm:p-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="shadow-card bg-gradient-to-r from-police-blue to-police-blue-dark">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold">מערכת ניהול מאוחדת</h1>
                <p className="text-[#4585d9] text-sm sm:text-base">ברוך הבא, {user?.fullName || "מנהל המערכת"}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 order-2 sm:order-1">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">מערכת פעילה</span>
              </div>
              <div className="w-full sm:w-auto order-1 sm:order-2">
                <button 
                  onClick={performLogout}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-xl shadow-2xl hover:shadow-red-600/50 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 border-2 border-red-400 hover:border-red-300 text-sm sm:text-base"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c, #991b1b)',
                    boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-base sm:text-xl">🚪</span>
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2 sm:px-4 whitespace-nowrap overflow-hidden text-ellipsis">
            סקירה כללית
          </TabsTrigger>
          <TabsTrigger value="users" className="relative text-xs sm:text-sm py-2 px-2 sm:px-4 whitespace-nowrap overflow-hidden text-ellipsis">
            ניהול משתמשים
            {counts.users > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center animate-pulse">
                {counts.users}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="questions" className="relative text-xs sm:text-sm py-2 px-2 sm:px-4 whitespace-nowrap overflow-hidden text-ellipsis">
            ניהול שאלות
            {counts.questions > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center animate-pulse">
                {counts.questions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="news" className="text-xs sm:text-sm py-2 px-2 sm:px-4 whitespace-nowrap overflow-hidden text-ellipsis">
            חדשות
          </TabsTrigger>
          <TabsTrigger value="synagogues" className="text-xs sm:text-sm py-2 px-2 sm:px-4 whitespace-nowrap overflow-hidden text-ellipsis">
            בתי כנסת
          </TabsTrigger>
          <TabsTrigger value="halacha" className="text-xs sm:text-sm py-2 px-2 sm:px-4 whitespace-nowrap overflow-hidden text-ellipsis">
            הלכות יומיות
          </TabsTrigger>
          <TabsTrigger value="messages" className="relative text-xs sm:text-sm py-2 px-2 sm:px-4 whitespace-nowrap overflow-hidden text-ellipsis">
            הודעות
            {counts.contacts > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center animate-pulse">
                {counts.contacts}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="shadow-card">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-row-reverse">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <div className="text-right flex-1 relative">
                    <p className="text-xs sm:text-sm text-gray-600 text-right">משתמשים ממתינים</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800 text-right">{statistics.totalUsers}</p>
                    <NotificationBadge 
                      count={badges.users} 
                      isVisible={badges.users > 0}
                      className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-row-reverse">
                  <MessageCircleQuestion className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                  <div className="text-right flex-1 relative">
                    <p className="text-xs sm:text-sm text-gray-600 text-right">שאלות ממתינות</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800 text-right">{statistics.pendingQuestions}</p>
                    <NotificationBadge 
                      count={badges.questions} 
                      isVisible={badges.questions > 0}
                      className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-row-reverse">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <div className="text-right flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 text-right">שאלות שנענו</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800 text-right">{statistics.answeredQuestions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-row-reverse">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  <div className="text-right flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 text-right">הודעות חדשות</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800 text-right">{statistics.unreadMessages}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                פעילות אחרונה
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                {pendingUsers?.slice(0, 3).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="text-right flex-1">
                      <p className="font-medium text-sm sm:text-base text-right">{user.fullName}</p>
                      <p className="text-xs sm:text-sm text-gray-600 text-right">בקשת הרשמה חדשה</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      ממתין
                    </Badge>
                  </div>
                ))}
                {allQuestions?.filter(q => q.status === "pending").slice(0, 2).map((question) => (
                  <div key={question.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="text-right flex-1">
                      <p className="font-medium text-sm sm:text-base text-right">{question.title || question.content.substring(0, 50)}...</p>
                      <p className="text-xs sm:text-sm text-gray-600 text-right">שאלה חדשה ממתינה לתשובה</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
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
        <TabsContent value="questions" className="space-y-3 sm:space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MessageCircleQuestion className="h-4 w-4 sm:h-5 sm:w-5" />
                ניהול שאלות - כל השאלות במערכת
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
              {!allQuestions || allQuestions.length === 0 ? (
                <p className="text-center text-gray-600 py-8">אין שאלות במערכת</p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {allQuestions.map((question) => (
                    <div key={question.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
                        <div className="space-y-2 flex-1 text-right">
                          <div className="flex items-center gap-1 sm:gap-2 flex-row-reverse flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base text-gray-800 text-right">
                              {question.title || "שאלה"}
                            </h3>
                            <Badge variant={question.status === "pending" ? "secondary" : question.status === "answered" ? "default" : "outline"} className="text-xs">
                              {question.status === "pending" ? "ממתין" : question.status === "answered" ? "נענה" : "סגור"}
                            </Badge>
                            {question.isUrgent && (
                              <Badge variant="destructive" className="text-xs">דחוף</Badge>
                            )}
                            {question.isPrivate && (
                              <Badge variant="outline" className="text-xs">פרטי</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm sm:text-base text-right">{question.content}</p>
                          <div className="text-xs sm:text-sm text-gray-500 text-right">
                            <p className="text-right">קטגוריה: {question.category}</p>
                            <p className="text-right">תאריך: {new Date(question.createdAt).toLocaleDateString('he-IL')}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 sm:gap-2 pt-2 flex-wrap">
                        {/* כפתור 1: ענה על השאלה / ערוך תשובה */}
                        {question.status === "pending" ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm py-2 px-3 sm:py-2 sm:px-4"
                                onClick={() => setSelectedQuestionId(question.id)}
                              >
                                <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
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

        {/* News Management Tab */}
        <TabsContent value="news" className="space-y-4">
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

              {/* Edit News Dialog */}
              <Dialog open={!!editingNewsId} onOpenChange={() => setEditingNewsId("")}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>ערוך חדשה</DialogTitle>
                  </DialogHeader>
                  <Form {...newsForm}>
                    <form onSubmit={newsForm.handleSubmit((data) => {
                      updateNewsMutation.mutate({ id: editingNewsId, data });
                    })} className="space-y-4">
                      <FormField
                        control={newsForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>כותרת</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="כותרת החדשה" />
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
                              <Textarea {...field} placeholder="תקציר קצר של החדשה" rows={2} />
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
                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          disabled={updateNewsMutation.isPending}
                          className="flex-1"
                        >
                          עדכן חדשה
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setEditingNewsId("")}
                          className="flex-1"
                        >
                          ביטול
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* News List */}
              <div className="space-y-3">
                {!newsList || newsList.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">אין חדשות במערכת</p>
                ) : (
                  newsList.map((newsItem) => (
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingNewsId(newsItem.id);
                              // Pre-populate the form with existing data
                              newsForm.setValue("title", newsItem.title);
                              newsForm.setValue("content", newsItem.content);
                              newsForm.setValue("excerpt", newsItem.excerpt || "");
                              newsForm.setValue("isUrgent", newsItem.isUrgent);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteNewsMutation.mutate(newsItem.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Synagogues Management Tab */}
        <TabsContent value="synagogues" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                ניהול בתי כנסת
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-police-blue hover:bg-police-blue-dark text-white">
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף בית כנסת
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>הוספת בית כנסת חדש</DialogTitle>
                  </DialogHeader>
                  <Form {...synagogueForm}>
                    <form onSubmit={synagogueForm.handleSubmit((data) => createSynagogueMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={synagogueForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>שם בית הכנסת</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="הכנס שם בית הכנסת" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={synagogueForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>כתובת</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="כתובת בית הכנסת" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={synagogueForm.control}
                            name="latitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>קו רוחב (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="32.0853" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={synagogueForm.control}
                            name="longitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>קו אורך (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="34.7818" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={synagogueForm.control}
                            name="shacharit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>שחרית (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="07:00" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={synagogueForm.control}
                            name="mincha"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>מנחה (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="18:30" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={synagogueForm.control}
                            name="maariv"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>מעריב (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="19:30" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={synagogueForm.control}
                            name="contact"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>איש קשר (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="שם איש הקשר" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={synagogueForm.control}
                            name="contactPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>טלפון איש קשר (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="050-1234567" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={synagogueForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>הערות (אופציונלי)</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="הערות נוספות" rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          disabled={createSynagogueMutation.isPending}
                          className="w-full"
                        >
                          צור בית כנסת
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                {/* Edit Synagogue Dialog */}
                <Dialog open={!!editingSynagogueId} onOpenChange={() => setEditingSynagogueId("")}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>ערוך בית כנסת</DialogTitle>
                    </DialogHeader>
                    <Form {...synagogueForm}>
                      <form onSubmit={synagogueForm.handleSubmit((data) => {
                        updateSynagogueMutation.mutate({ id: editingSynagogueId, data });
                      })} className="space-y-4">
                        <FormField
                          control={synagogueForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>שם בית הכנסת</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="שם בית הכנסת" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={synagogueForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>כתובת</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="כתובת מלאה" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={synagogueForm.control}
                            name="latitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>קו רוחב (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="32.0853" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={synagogueForm.control}
                            name="longitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>קו אורך (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="34.7818" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={synagogueForm.control}
                            name="shacharit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>שחרית (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="07:00" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={synagogueForm.control}
                            name="mincha"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>מנחה (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="18:30" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={synagogueForm.control}
                            name="maariv"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>מעריב (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="19:30" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={synagogueForm.control}
                            name="contact"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>איש קשר (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="שם איש הקשר" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={synagogueForm.control}
                            name="contactPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>טלפון איש קשר (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="050-1234567" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={synagogueForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>הערות (אופציונלי)</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="הערות נוספות" rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button 
                            type="submit" 
                            disabled={updateSynagogueMutation.isPending}
                            className="flex-1"
                          >
                            עדכן בית כנסת
                          </Button>
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => setEditingSynagogueId("")}
                            className="flex-1"
                          >
                            ביטול
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                {/* Synagogue List */}
                <div className="space-y-3">
                  {synagogues?.map((synagogue) => (
                    <div key={synagogue.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 text-right">
                          <h3 className="font-semibold text-gray-800 text-right mb-1">{synagogue.name}</h3>
                          <p className="text-gray-600 text-sm mb-2 text-right">{synagogue.address}</p>
                          {(synagogue.shacharit || synagogue.mincha || synagogue.maariv) && (
                            <div className="flex gap-4 text-xs text-gray-500 mb-2 flex-row-reverse">
                              {synagogue.shacharit && <span>שחרית: {synagogue.shacharit}</span>}
                              {synagogue.mincha && <span>מנחה: {synagogue.mincha}</span>}
                              {synagogue.maariv && <span>מעריב: {synagogue.maariv}</span>}
                            </div>
                          )}
                          {(synagogue.contact || synagogue.contactPhone) && (
                            <div className="text-xs text-gray-500 text-right">
                              {synagogue.contact && <span>איש קשר: {synagogue.contact}</span>}
                              {synagogue.contact && synagogue.contactPhone && <span> | </span>}
                              {synagogue.contactPhone && <span>טלפון: {synagogue.contactPhone}</span>}
                            </div>
                          )}
                          {synagogue.notes && (
                            <p className="text-xs text-gray-500 text-right mt-1">{synagogue.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingSynagogueId(synagogue.id);
                              // Pre-populate the form with existing data
                              synagogueForm.setValue("name", synagogue.name);
                              synagogueForm.setValue("address", synagogue.address);
                              synagogueForm.setValue("latitude", synagogue.latitude || "");
                              synagogueForm.setValue("longitude", synagogue.longitude || "");
                              synagogueForm.setValue("shacharit", synagogue.shacharit || "");
                              synagogueForm.setValue("mincha", synagogue.mincha || "");
                              synagogueForm.setValue("maariv", synagogue.maariv || "");
                              synagogueForm.setValue("contact", synagogue.contact || "");
                              synagogueForm.setValue("contactPhone", synagogue.contactPhone || "");
                              synagogueForm.setValue("notes", synagogue.notes || "");
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteSynagogueMutation.mutate(synagogue.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* Halacha Management Tab */}
        <TabsContent value="halacha" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                  ניהול הלכה יומית
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-police-blue hover:bg-police-blue-dark text-white">
                      <Plus className="h-4 w-4 ml-2" />
                      הוסף הלכה יומית
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>הוספת הלכה יומית חדשה</DialogTitle>
                    </DialogHeader>
                    <Form {...halachaForm}>
                      <form onSubmit={halachaForm.handleSubmit((data) => createHalachaMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={halachaForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>תאריך</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="date"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={halachaForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>כותרת (אופציונלי)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="כותרת ההלכה" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={halachaForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>תוכן ההלכה</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="תוכן ההלכה היומית" rows={6} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          disabled={createHalachaMutation.isPending}
                          className="w-full"
                        >
                          צור הלכה יומית
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                {/* Edit Halacha Dialog */}
                <Dialog open={!!editingHalachaId} onOpenChange={() => setEditingHalachaId("")}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>ערוך הלכה יומית</DialogTitle>
                    </DialogHeader>
                    <Form {...halachaForm}>
                      <form onSubmit={halachaForm.handleSubmit((data) => {
                        updateHalachaMutation.mutate({ id: editingHalachaId, data });
                      })} className="space-y-4">
                        <FormField
                          control={halachaForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>תאריך</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={halachaForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>כותרת (אופציונלי)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="כותרת ההלכה" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={halachaForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>תוכן ההלכה</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="תוכן ההלכה היומית" rows={6} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button 
                            type="submit" 
                            disabled={updateHalachaMutation.isPending}
                            className="flex-1"
                          >
                            עדכן הלכה
                          </Button>
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => setEditingHalachaId("")}
                            className="flex-1"
                          >
                            ביטול
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                {/* Halacha List */}
                <div className="space-y-3">
                  {halachot?.map((halacha) => (
                    <div key={halacha.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 text-right">
                          <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                            <span className="text-sm font-medium text-gray-600">
                              {new Date(halacha.date).toLocaleDateString('he-IL')}
                            </span>
                            {new Date(halacha.date).toDateString() === new Date().toDateString() && (
                              <Badge className="bg-purple-100 text-purple-800">היום</Badge>
                            )}
                          </div>
                          {halacha.title && (
                            <h3 className="font-semibold text-gray-800 text-right mb-2">{halacha.title}</h3>
                          )}
                          <p className="text-gray-700 text-sm text-right line-clamp-2">
                            {halacha.content.length > 150 
                              ? halacha.content.substring(0, 150) + "..." 
                              : halacha.content}
                          </p>
                          <p className="text-xs text-gray-500 text-right mt-2">
                            נוצר: {new Date(halacha.createdAt).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingHalachaId(halacha.id);
                              // Pre-populate the form with existing data
                              halachaForm.setValue("title", halacha.title || "");
                              halachaForm.setValue("content", halacha.content);
                              halachaForm.setValue("date", new Date(halacha.date).toISOString().split('T')[0]);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteHalachaMutation.mutate(halacha.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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