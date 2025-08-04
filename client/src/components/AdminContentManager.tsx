import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Newspaper, MapPin, BookOpen, Video, MessageSquare, Trash2, Edit, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { News, Synagogue, DailyHalacha, Video as VideoType, ContactMessage } from "@shared/schema";

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

interface AdminContentManagerProps {
  deviceId: string;
}

export function AdminContentManager({ deviceId }: AdminContentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("news");

  // News Management
  const { data: newsList } = useQuery({
    queryKey: ["/api/news"],
  }) as { data: News[] | undefined };

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
      return apiRequest("POST", "/api/admin/news", { ...data, deviceId });
    },
    onSuccess: () => {
      toast({ title: "החדשה נוצרה בהצלחה" });
      newsForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה ביצירת החדשה" });
    }
  });

  const deleteNewsMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/news/${id}`, { deviceId });
    },
    onSuccess: () => {
      toast({ title: "החדשה נמחקה בהצלחה" });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה במחיקת החדשה" });
    }
  });

  // Synagogue Management
  const { data: synagoguesList } = useQuery({
    queryKey: ["/api/synagogues"],
  }) as { data: Synagogue[] | undefined };

  const synagogueForm = useForm<z.infer<typeof synagogueSchema>>({
    resolver: zodResolver(synagogueSchema),
    defaultValues: {
      name: "",
      address: "",
      shacharit: "",
      mincha: "",
      maariv: "",
      contact: "",
      notes: ""
    }
  });

  const createSynagogueMutation = useMutation({
    mutationFn: async (data: z.infer<typeof synagogueSchema>) => {
      return apiRequest("POST", "/api/admin/synagogues", { ...data, deviceId });
    },
    onSuccess: () => {
      toast({ title: "בית הכנסת נוצר בהצלחה" });
      synagogueForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/synagogues"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה ביצירת בית הכנסת" });
    }
  });

  const deleteSynagogueMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/synagogues/${id}`, { deviceId });
    },
    onSuccess: () => {
      toast({ title: "בית הכנסת נמחק בהצלחה" });
      queryClient.invalidateQueries({ queryKey: ["/api/synagogues"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה במחיקת בית הכנסת" });
    }
  });

  // Daily Halacha Management
  const halachaForm = useForm<z.infer<typeof halachaSchema>>({
    resolver: zodResolver(halachaSchema),
    defaultValues: {
      title: "",
      content: "",
      date: new Date().toISOString().split('T')[0]
    }
  });

  const createHalachaMutation = useMutation({
    mutationFn: async (data: z.infer<typeof halachaSchema>) => {
      return apiRequest("POST", "/api/admin/daily-halacha", { 
        ...data, 
        date: new Date(data.date),
        deviceId 
      });
    },
    onSuccess: () => {
      toast({ title: "הלכה יומית נוצרה בהצלחה" });
      halachaForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/daily-halacha"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה ביצירת הלכה יומית" });
    }
  });

  // Video Management
  const { data: videosList } = useQuery({
    queryKey: ["/api/videos"],
  }) as { data: VideoType[] | undefined };

  const videoForm = useForm<z.infer<typeof videoSchema>>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: "",
      description: "",
      youtubeId: "",
      thumbnail: ""
    }
  });

  const createVideoMutation = useMutation({
    mutationFn: async (data: z.infer<typeof videoSchema>) => {
      return apiRequest("POST", "/api/admin/videos", { ...data, deviceId });
    },
    onSuccess: () => {
      toast({ title: "הסרטון נוצר בהצלחה" });
      videoForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה ביצירת הסרטון" });
    }
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/videos/${id}`, { deviceId });
    },
    onSuccess: () => {
      toast({ title: "הסרטון נמחק בהצלחה" });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה במחיקת הסרטון" });
    }
  });

  // Contact Messages Management
  const { data: contactMessages } = useQuery({
    queryKey: ["/api/admin/contact-messages"],
    queryFn: () => apiRequest("GET", "/api/admin/contact-messages", { deviceId })
  }) as { data: ContactMessage[] | undefined };

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PUT", `/api/admin/contact-messages/${id}/read`, { deviceId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact-messages"] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">ניהול תוכן</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="news">חדשות</TabsTrigger>
          <TabsTrigger value="synagogues">בתי כנסת</TabsTrigger>
          <TabsTrigger value="halacha">הלכה יומית</TabsTrigger>
          <TabsTrigger value="videos">סרטונים</TabsTrigger>
          <TabsTrigger value="messages">הודעות</TabsTrigger>
        </TabsList>

        {/* News Management */}
        <TabsContent value="news" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">ניהול חדשות</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-police-blue hover:bg-police-blue-dark text-white">
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף חדשה
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
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
                            <Input {...field} placeholder="כותרת החדשה" className="text-right" />
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
                            <Input {...field} placeholder="תקציר קצר" className="text-right" />
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
                            <Textarea {...field} placeholder="תוכן החדשה" className="h-32 resize-none text-right" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-police-blue hover:bg-police-blue-dark text-white"
                      disabled={createNewsMutation.isPending}
                    >
                      {createNewsMutation.isPending ? "יוצר..." : "צור חדשה"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {newsList?.map((news) => (
              <Card key={news.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{news.title}</h4>
                      {news.excerpt && <p className="text-sm text-gray-600 mt-1">{news.excerpt}</p>}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(news.publishedAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNewsMutation.mutate(news.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Synagogues Management */}
        <TabsContent value="synagogues" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">ניהול בתי כנסת</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-police-blue hover:bg-police-blue-dark text-white">
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף בית כנסת
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
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
                            <Input {...field} placeholder="שם בית הכנסת" className="text-right" />
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
                            <Input {...field} placeholder="כתובת מלאה" className="text-right" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={synagogueForm.control}
                        name="shacharit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שחרית</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="07:00" className="text-right" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={synagogueForm.control}
                        name="mincha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>מנחה</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="13:30" className="text-right" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={synagogueForm.control}
                        name="maariv"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>מעריב</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="19:30" className="text-right" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={synagogueForm.control}
                      name="contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>פרטי קשר</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="טלפון או אימייל" className="text-right" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={synagogueForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>הערות</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="הערות נוספות" className="h-20 resize-none text-right" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-police-blue hover:bg-police-blue-dark text-white"
                      disabled={createSynagogueMutation.isPending}
                    >
                      {createSynagogueMutation.isPending ? "יוצר..." : "צור בית כנסת"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {synagoguesList?.map((synagogue) => (
              <Card key={synagogue.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{synagogue.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{synagogue.address}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        {synagogue.shacharit && <span>שחרית: {synagogue.shacharit}</span>}
                        {synagogue.mincha && <span>מנחה: {synagogue.mincha}</span>}
                        {synagogue.maariv && <span>מעריב: {synagogue.maariv}</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSynagogueMutation.mutate(synagogue.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Daily Halacha Management */}
        <TabsContent value="halacha" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">ניהול הלכה יומית</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-police-blue hover:bg-police-blue-dark text-white">
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף הלכה יומית
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>הוספת הלכה יומית</DialogTitle>
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
                            <Input {...field} placeholder="כותרת ההלכה" className="text-right" />
                          </FormControl>
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
                            <Textarea {...field} placeholder="תוכן ההלכה היומית" className="h-32 resize-none text-right" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-police-blue hover:bg-police-blue-dark text-white"
                      disabled={createHalachaMutation.isPending}
                    >
                      {createHalachaMutation.isPending ? "יוצר..." : "צור הלכה יומית"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        {/* Videos Management */}
        <TabsContent value="videos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">ניהול סרטונים</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-police-blue hover:bg-police-blue-dark text-white">
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף סרטון
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>הוספת סרטון חדש</DialogTitle>
                </DialogHeader>
                <Form {...videoForm}>
                  <form onSubmit={videoForm.handleSubmit((data) => createVideoMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={videoForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>כותרת</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="כותרת הסרטון" className="text-right" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={videoForm.control}
                      name="youtubeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>מזהה YouTube</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="dQw4w9WgXcQ" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={videoForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>תיאור (אופציונלי)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="תיאור הסרטון" className="h-24 resize-none text-right" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-police-blue hover:bg-police-blue-dark text-white"
                      disabled={createVideoMutation.isPending}
                    >
                      {createVideoMutation.isPending ? "יוצר..." : "צור סרטון"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {videosList?.map((video) => (
              <Card key={video.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{video.title}</h4>
                      {video.description && <p className="text-sm text-gray-600 mt-1">{video.description}</p>}
                      <p className="text-xs text-gray-500 mt-2">YouTube ID: {video.youtubeId}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteVideoMutation.mutate(video.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Contact Messages */}
        <TabsContent value="messages" className="space-y-4">
          <h3 className="text-lg font-semibold">הודעות ממשתמשים</h3>
          <div className="grid gap-4">
            {contactMessages?.map((message) => (
              <Card key={message.id} className={`shadow-card ${!message.isRead ? 'border-r-4 border-r-police-blue' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-800">{message.fullName}</h4>
                        {!message.isRead && <span className="bg-police-blue text-white text-xs px-2 py-1 rounded">חדש</span>}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{message.phone}</p>
                      <p className="text-gray-700">{message.message}</p>
                      <p className="text-xs text-gray-500 mt-3">
                        {new Date(message.createdAt).toLocaleDateString('he-IL')} {new Date(message.createdAt).toLocaleTimeString('he-IL')}
                      </p>
                    </div>
                    {!message.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(message.id)}
                        className="text-police-blue border-police-blue hover:bg-police-blue hover:text-white"
                      >
                        סמן כנקרא
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}