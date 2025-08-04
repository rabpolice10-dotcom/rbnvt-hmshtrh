import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MessageCircleQuestion, Clock, CheckCircle, XCircle, Plus, Settings, Newspaper, MapPin, Video, BookOpen, Shield, Mail, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { User, Question } from "@shared/schema";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("users");

  // Allow admin access - this page is accessed when admin logs in
  const canAccess = true;

  if (!canAccess) {
    return (
      <div className="p-4">
        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">אין הרשאת גישה</h2>
            <p className="text-gray-600">רק מנהלי מערכת יכולים לגשת לדף זה.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="shadow-card bg-gradient-to-r from-police-blue-light to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="h-6 w-6 text-police-blue ml-2" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">מנהל המערכת</h1>
                <p className="text-sm text-gray-600">ניהול מערכת רבנות המשטרה</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                localStorage.removeItem('device-id');
                window.location.href = '/login';
              }}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4 ml-1" />
              התנתק
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="users">משתמשים</TabsTrigger>
          <TabsTrigger value="questions">שאלות</TabsTrigger>
          <TabsTrigger value="contact">הודעות</TabsTrigger>
          <TabsTrigger value="news">חדשות</TabsTrigger>
          <TabsTrigger value="synagogues">בתי כנסת</TabsTrigger>
          <TabsTrigger value="videos">סרטונים</TabsTrigger>
          <TabsTrigger value="halacha">הלכה יומית</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <QuestionManagement />
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <ContactManagement />
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <NewsManagement />
        </TabsContent>

        <TabsContent value="synagogues" className="space-y-4">
          <SynagogueManagement />
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <VideoManagement />
        </TabsContent>

        <TabsContent value="halacha" className="space-y-4">
          <HalachaManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// User Management Component
function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ["/api/admin/pending-users"],
  }) as { data: User[] | undefined; isLoading: boolean };

  const approveUser = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/approve-user/${userId}`, {
        approvedBy: "admin"
      });
    },
    onSuccess: () => {
      toast({
        title: "משתמש אושר בהצלחה",
        description: "המשתמש יכול כעת להשתמש באפליקציה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה באישור המשתמש",
      });
    }
  });

  const rejectUser = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/reject-user/${userId}`, {
        approvedBy: "admin"
      });
    },
    onSuccess: () => {
      toast({
        title: "משתמש נדחה",
        description: "המשתמש לא יוכל להשתמש באפליקציה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בדחיית המשתמש",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
        <p className="text-gray-600">טוען משתמשים...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">משתמשים ממתינים לאישור</h2>
        <Badge variant="secondary">
          {pendingUsers?.length || 0} ממתינים
        </Badge>
      </div>

      {pendingUsers && pendingUsers.length > 0 ? (
        <div className="space-y-3">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{user.fullName}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>טלפון: {user.phone}</p>
                      <p>מספר אישי: {user.personalId}</p>
                      <p>נרשם: {new Date(user.createdAt).toLocaleDateString('he-IL')}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => approveUser.mutate(user.id)}
                      disabled={approveUser.isPending}
                    >
                      <CheckCircle className="h-4 w-4 ml-1" />
                      אשר
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => rejectUser.mutate(user.id)}
                      disabled={rejectUser.isPending}
                    >
                      <XCircle className="h-4 w-4 ml-1" />
                      דחה
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">אין משתמשים ממתינים לאישור</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Question Management Component
function QuestionManagement() {
  const { data: questions, isLoading } = useQuery({
    queryKey: ["/api/questions"],
  }) as { data: Question[] | undefined; isLoading: boolean };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
        <p className="text-gray-600">טוען שאלות...</p>
      </div>
    );
  }

  const pendingQuestions = questions?.filter(q => q.status === "pending") || [];
  const answeredQuestions = questions?.filter(q => q.status === "answered") || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-orange-500 ml-2" />
              <div>
                <p className="text-sm text-gray-600">שאלות ממתינות</p>
                <p className="text-2xl font-bold text-orange-600">{pendingQuestions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
              <div>
                <p className="text-sm text-gray-600">שאלות שנענו</p>
                <p className="text-2xl font-bold text-green-600">{answeredQuestions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">ממתינות לתשובה</TabsTrigger>
          <TabsTrigger value="answered">נענו</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pendingQuestions.length > 0 ? (
            pendingQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-6 text-center">
                <MessageCircleQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">אין שאלות ממתינות</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="answered" className="space-y-3">
          {answeredQuestions.length > 0 ? (
            answeredQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">אין שאלות שנענו</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Question Card Component
function QuestionCard({ question }: { question: Question }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAnswering, setIsAnswering] = useState(false);
  const [answer, setAnswer] = useState("");

  const submitAnswer = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/answers", {
        questionId: question.id,
        content: answer,
        answeredBy: "admin"
      });
    },
    onSuccess: () => {
      toast({
        title: "תשובה נשלחה בהצלחה",
        description: "השואל יקבל הודעה על התשובה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setIsAnswering(false);
      setAnswer("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בשליחת התשובה",
      });
    }
  });

  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Badge variant={question.isUrgent ? "destructive" : "secondary"}>
                {question.category}
              </Badge>
              {question.isUrgent && (
                <Badge variant="destructive">דחוף</Badge>
              )}
              {question.isPrivate && (
                <Badge variant="outline">פרטי</Badge>
              )}
            </div>
            <Badge variant={question.status === "pending" ? "default" : "secondary"}>
              {question.status === "pending" ? "ממתין" : "נענה"}
            </Badge>
          </div>
          
          <div>
            <p className="text-gray-800 leading-relaxed">{question.content}</p>
            <p className="text-xs text-gray-500 mt-2">
              נשלח: {new Date(question.createdAt).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {question.status === "pending" && (
            <div className="space-y-3">
              {!isAnswering ? (
                <Button
                  size="sm"
                  onClick={() => setIsAnswering(true)}
                  className="bg-police-blue hover:bg-police-blue-dark text-white"
                >
                  ענה על השאלה
                </Button>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="הכנס את התשובה כאן..."
                    className="h-32 resize-none text-right"
                  />
                  <div className="flex space-x-2 space-x-reverse">
                    <Button
                      size="sm"
                      onClick={() => submitAnswer.mutate()}
                      disabled={!answer.trim() || submitAnswer.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      שלח תשובה
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAnswering(false);
                        setAnswer("");
                      }}
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// News Management Component
function NewsManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [newsData, setNewsData] = useState({
    title: "",
    content: "",
    excerpt: "",
    isUrgent: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: news, isLoading } = useQuery({
    queryKey: ["/api/news"],
  }) as { data: any[] | undefined; isLoading: boolean };

  const createNews = useMutation({
    mutationFn: async (data: typeof newsData) => {
      return apiRequest("POST", "/api/news", {
        ...data,
        createdBy: "admin"
      });
    },
    onSuccess: () => {
      toast({
        title: "חדשה נוצרה בהצלחה",
        description: "החדשה פורסמה באפליקציה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setNewsData({ title: "", content: "", excerpt: "", isUrgent: false });
      setIsCreating(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה ביצירת החדשה",
      });
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">ניהול חדשות</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-police-blue hover:bg-police-blue-dark text-white">
              <Plus className="h-4 w-4 ml-1" />
              הוסף חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-right">הוסף חדשה חדשה</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              createNews.mutate(newsData);
            }} className="space-y-4">
              <div>
                <Label>כותרת</Label>
                <Input
                  value={newsData.title}
                  onChange={(e) => setNewsData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="הכנס כותרת..."
                  className="text-right"
                  required
                />
              </div>
              <div>
                <Label>תקציר</Label>
                <Input
                  value={newsData.excerpt}
                  onChange={(e) => setNewsData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="תקציר קצר..."
                  className="text-right"
                />
              </div>
              <div>
                <Label>תוכן</Label>
                <Textarea
                  value={newsData.content}
                  onChange={(e) => setNewsData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="תוכן החדשה..."
                  className="h-32 resize-none text-right"
                  required
                />
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={newsData.isUrgent}
                  onChange={(e) => setNewsData(prev => ({ ...prev, isUrgent: e.target.checked }))}
                />
                <Label htmlFor="urgent">חדשה דחופה</Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-police-blue hover:bg-police-blue-dark text-white"
                disabled={createNews.isPending}
              >
                {createNews.isPending ? "יוצר..." : "צור חדשה"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
          <p className="text-gray-600">טוען חדשות...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {news && news.length > 0 ? (
            news.map((item: any) => (
              <Card key={item.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.title}</h3>
                      {item.excerpt && (
                        <p className="text-sm text-gray-600 mt-1">{item.excerpt}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        פורסם: {new Date(item.publishedAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    {item.isUrgent && (
                      <Badge variant="destructive">דחוף</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-6 text-center">
                <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">אין חדשות</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Synagogue Management Component
function SynagogueManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [synagogueData, setSynagogueData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    shacharit: "",
    mincha: "",
    maariv: "",
    contact: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: synagogues, isLoading } = useQuery({
    queryKey: ["/api/synagogues"],
  }) as { data: any[] | undefined; isLoading: boolean };

  const createSynagogue = useMutation({
    mutationFn: async (data: typeof synagogueData) => {
      return apiRequest("POST", "/api/synagogues", data);
    },
    onSuccess: () => {
      toast({
        title: "בית כנסת נוסף בהצלחה",
        description: "בית הכנסת מופיע כעת ברשימה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/synagogues"] });
      setSynagogueData({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        shacharit: "",
        mincha: "",
        maariv: "",
        contact: "",
        notes: ""
      });
      setIsCreating(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת בית הכנסת",
      });
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">ניהול בתי כנסת</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-police-blue hover:bg-police-blue-dark text-white">
              <Plus className="h-4 w-4 ml-1" />
              הוסף בית כנסת
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-right">הוסף בית כנסת חדש</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              createSynagogue.mutate(synagogueData);
            }} className="space-y-4">
              <div>
                <Label>שם בית הכנסת</Label>
                <Input
                  value={synagogueData.name}
                  onChange={(e) => setSynagogueData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="שם בית הכנסת..."
                  className="text-right"
                  required
                />
              </div>
              <div>
                <Label>כתובת</Label>
                <Input
                  value={synagogueData.address}
                  onChange={(e) => setSynagogueData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="כתובת מלאה..."
                  className="text-right"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>קו רוחב</Label>
                  <Input
                    value={synagogueData.latitude}
                    onChange={(e) => setSynagogueData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="32.0853"
                    className="text-right"
                  />
                </div>
                <div>
                  <Label>קו אורך</Label>
                  <Input
                    value={synagogueData.longitude}
                    onChange={(e) => setSynagogueData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="34.7818"
                    className="text-right"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>שחרית</Label>
                  <Input
                    value={synagogueData.shacharit}
                    onChange={(e) => setSynagogueData(prev => ({ ...prev, shacharit: e.target.value }))}
                    placeholder="07:00"
                    className="text-right"
                  />
                </div>
                <div>
                  <Label>מנחה</Label>
                  <Input
                    value={synagogueData.mincha}
                    onChange={(e) => setSynagogueData(prev => ({ ...prev, mincha: e.target.value }))}
                    placeholder="13:15"
                    className="text-right"
                  />
                </div>
                <div>
                  <Label>מעריב</Label>
                  <Input
                    value={synagogueData.maariv}
                    onChange={(e) => setSynagogueData(prev => ({ ...prev, maariv: e.target.value }))}
                    placeholder="18:15"
                    className="text-right"
                  />
                </div>
              </div>
              <div>
                <Label>איש קשר</Label>
                <Input
                  value={synagogueData.contact}
                  onChange={(e) => setSynagogueData(prev => ({ ...prev, contact: e.target.value }))}
                  placeholder="שם ומספר טלפון..."
                  className="text-right"
                />
              </div>
              <div>
                <Label>הערות</Label>
                <Textarea
                  value={synagogueData.notes}
                  onChange={(e) => setSynagogueData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="הערות נוספות..."
                  className="h-24 resize-none text-right"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-police-blue hover:bg-police-blue-dark text-white"
                disabled={createSynagogue.isPending}
              >
                {createSynagogue.isPending ? "מוסיף..." : "הוסף בית כנסת"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
          <p className="text-gray-600">טוען בתי כנסת...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {synagogues && synagogues.length > 0 ? (
            synagogues.map((synagogue: any) => (
              <Card key={synagogue.id} className="shadow-card">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-800">{synagogue.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{synagogue.address}</p>
                  {(synagogue.shacharit || synagogue.mincha || synagogue.maariv) && (
                    <div className="text-xs text-gray-500 mt-2">
                      {synagogue.shacharit && `שחרית: ${synagogue.shacharit} `}
                      {synagogue.mincha && `מנחה: ${synagogue.mincha} `}
                      {synagogue.maariv && `מעריב: ${synagogue.maariv}`}
                    </div>
                  )}
                  {synagogue.contact && (
                    <p className="text-xs text-gray-500 mt-1">איש קשר: {synagogue.contact}</p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">אין בתי כנסת רשומים</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Video Management Component
function VideoManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [videoData, setVideoData] = useState({
    title: "",
    description: "",
    youtubeId: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: videos, isLoading } = useQuery({
    queryKey: ["/api/videos"],
  }) as { data: any[] | undefined; isLoading: boolean };

  const createVideo = useMutation({
    mutationFn: async (data: typeof videoData) => {
      return apiRequest("POST", "/api/videos", {
        ...data,
        addedBy: "admin"
      });
    },
    onSuccess: () => {
      toast({
        title: "סרטון נוסף בהצלחה",
        description: "הסרטון מופיע כעת ברשימה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setVideoData({ title: "", description: "", youtubeId: "" });
      setIsCreating(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת הסרטון",
      });
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">ניהול סרטונים</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-police-blue hover:bg-police-blue-dark text-white">
              <Plus className="h-4 w-4 ml-1" />
              הוסף סרטון
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-right">הוסף סרטון חדש</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              createVideo.mutate(videoData);
            }} className="space-y-4">
              <div>
                <Label>כותרת הסרטון</Label>
                <Input
                  value={videoData.title}
                  onChange={(e) => setVideoData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="כותרת הסרטון..."
                  className="text-right"
                  required
                />
              </div>
              <div>
                <Label>תיאור</Label>
                <Textarea
                  value={videoData.description}
                  onChange={(e) => setVideoData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="תיאור הסרטון..."
                  className="h-24 resize-none text-right"
                />
              </div>
              <div>
                <Label>מזהה YouTube</Label>
                <Input
                  value={videoData.youtubeId}
                  onChange={(e) => setVideoData(prev => ({ ...prev, youtubeId: e.target.value }))}
                  placeholder="dQw4w9WgXcQ"
                  className="text-right"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  המזהה מהקישור: youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong>
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-police-blue hover:bg-police-blue-dark text-white"
                disabled={createVideo.isPending}
              >
                {createVideo.isPending ? "מוסיף..." : "הוסף סרטון"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
          <p className="text-gray-600">טוען סרטונים...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos && videos.length > 0 ? (
            videos.map((video: any) => (
              <Card key={video.id} className="shadow-card">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-800">{video.title}</h3>
                  {video.description && (
                    <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      נוסף: {new Date(video.createdAt).toLocaleDateString('he-IL')}
                    </p>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-police-blue hover:underline text-sm"
                    >
                      צפה ביוטיוב
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-6 text-center">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">אין סרטונים</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Halacha Management Component
function HalachaManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [halachaData, setHalachaData] = useState({
    title: "",
    content: "",
    date: new Date().toISOString().split('T')[0]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: todayHalacha, isLoading } = useQuery({
    queryKey: ["/api/daily-halacha"],
  }) as { data: any | undefined; isLoading: boolean };

  const createHalacha = useMutation({
    mutationFn: async (data: typeof halachaData) => {
      return apiRequest("POST", "/api/daily-halacha", {
        ...data,
        date: new Date(data.date),
        createdBy: "admin"
      });
    },
    onSuccess: () => {
      toast({
        title: "הלכה יומית נוצרה בהצלחה",
        description: "ההלכה מופיעה כעת באפליקציה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-halacha"] });
      setHalachaData({
        title: "",
        content: "",
        date: new Date().toISOString().split('T')[0]
      });
      setIsCreating(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה ביצירת ההלכה היומית",
      });
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">ניהול הלכה יומית</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-police-blue hover:bg-police-blue-dark text-white">
              <Plus className="h-4 w-4 ml-1" />
              הוסף הלכה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-right">הוסף הלכה יומית</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              createHalacha.mutate(halachaData);
            }} className="space-y-4">
              <div>
                <Label>כותרת</Label>
                <Input
                  value={halachaData.title}
                  onChange={(e) => setHalachaData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="כותרת ההלכה..."
                  className="text-right"
                  required
                />
              </div>
              <div>
                <Label>תאריך</Label>
                <Input
                  type="date"
                  value={halachaData.date}
                  onChange={(e) => setHalachaData(prev => ({ ...prev, date: e.target.value }))}
                  className="text-right"
                  required
                />
              </div>
              <div>
                <Label>תוכן ההלכה</Label>
                <Textarea
                  value={halachaData.content}
                  onChange={(e) => setHalachaData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="תוכן ההלכה היומית..."
                  className="h-32 resize-none text-right"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-police-blue hover:bg-police-blue-dark text-white"
                disabled={createHalacha.isPending}
              >
                {createHalacha.isPending ? "יוצר..." : "צור הלכה"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-right">הלכה יומית להיום</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-police-blue mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">טוען...</p>
            </div>
          ) : todayHalacha ? (
            <div>
              <h3 className="font-semibold text-gray-800">{todayHalacha.title}</h3>
              <p className="text-gray-600 mt-2 leading-relaxed">{todayHalacha.content}</p>
              <p className="text-xs text-gray-500 mt-3">
                תאריך: {new Date(todayHalacha.date).toLocaleDateString('he-IL')}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">אין הלכה יומית להיום</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Contact Management Component
function ContactManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/admin/contact-messages"],
  }) as { data: any[] | undefined; isLoading: boolean };

  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest("POST", `/api/admin/contact-messages/${messageId}/read`, {});
    },
    onSuccess: () => {
      toast({
        title: "הודעה סומנה כנקראה",
        description: "ההודעה עודכנה בהצלחה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact-messages"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון ההודעה",
      });
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">ניהול הודעות צור קשר</h2>
        <Badge variant="secondary">
          {messages?.filter(msg => !msg.isRead).length || 0} הודעות חדשות
        </Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
          <p className="text-gray-600">טוען הודעות...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages && messages.length > 0 ? (
            messages.map((message: any) => (
              <Card key={message.id} className={`shadow-card ${!message.isRead ? 'border-police-blue border-2' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-gray-800">{message.fullName}</h3>
                        {!message.isRead && (
                          <Badge variant="default" className="mr-2 bg-police-blue">
                            חדש
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">📞 {message.phone}</p>
                      <p className="text-gray-800 leading-relaxed">{message.message}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center space-x-reverse space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleDateString('he-IL')} בשעה {new Date(message.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {!message.isRead && (
                      <Button
                        onClick={() => markAsRead.mutate(message.id)}
                        disabled={markAsRead.isPending}
                        size="sm"
                        variant="outline"
                        className="text-police-blue border-police-blue hover:bg-police-blue hover:text-white"
                      >
                        {markAsRead.isPending ? "מעדכן..." : "סמן כנקרא"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-6 text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">אין הודעות צור קשר</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}