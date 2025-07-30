import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, UserX, Users, MessageCircleQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User, Question } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["/api/admin/pending-users"],
  }) as { data: User[] | undefined; isLoading: boolean };

  const { data: allQuestions, isLoading: loadingQuestions } = useQuery({
    queryKey: ["/api/questions"],
  }) as { data: Question[] | undefined; isLoading: boolean };

  const approveUser = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/approve-user/${userId}`, {
        approvedBy: "admin"
      });
    },
    onSuccess: () => {
      toast({
        title: "משתמש אושר",
        description: "המשתמש אושר בהצלחה",
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
        description: "המשתמש נדחה בהצלחה",
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

  const unansweredQuestions = allQuestions?.filter(q => q.status === "pending") || [];
  const urgentQuestions = unansweredQuestions.filter(q => q.isUrgent);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">לוח בקרה - מנהלים</h1>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-police-blue mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{pendingUsers?.length || 0}</p>
            <p className="text-sm text-gray-600">משתמשים ממתינים</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <MessageCircleQuestion className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{unansweredQuestions.length}</p>
            <p className="text-sm text-gray-600">שאלות ללא מענה</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">אישור משתמשים</TabsTrigger>
          <TabsTrigger value="questions">ניהול שאלות</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {loadingUsers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
              <p className="text-gray-600">טוען משתמשים...</p>
            </div>
          ) : pendingUsers && pendingUsers.length > 0 ? (
            pendingUsers.map((user) => (
              <Card key={user.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{user.fullName}</h3>
                      <p className="text-sm text-gray-600">מ.א: {user.personalId}</p>
                      <p className="text-sm text-gray-600">טלפון: {user.phone}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        הוגש: {new Date(user.createdAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    <div className="flex space-x-reverse space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveUser.mutate(user.id)}
                        disabled={approveUser.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectUser.mutate(user.id)}
                        disabled={rejectUser.isPending}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">אין משתמשים ממתינים</h3>
              <p className="text-gray-500">כל הבקשות טופלו</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          {urgentQuestions.length > 0 && (
            <div>
              <h3 className="font-bold text-red-600 mb-3">שאלות דחופות</h3>
              {urgentQuestions.map((question) => (
                <Card key={question.id} className="shadow-card border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Badge variant="secondary" className="ml-2">{question.category}</Badge>
                          <Badge variant="destructive">דחוף</Badge>
                        </div>
                        <p className="text-gray-800 mb-2">{question.content}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(question.createdAt).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {loadingQuestions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
              <p className="text-gray-600">טוען שאלות...</p>
            </div>
          ) : unansweredQuestions.length > 0 ? (
            <div>
              <h3 className="font-bold text-gray-800 mb-3">שאלות ללא מענה</h3>
              {unansweredQuestions.filter(q => !q.isUrgent).map((question) => (
                <Card key={question.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Badge variant="secondary">{question.category}</Badge>
                        </div>
                        <p className="text-gray-800 mb-2">{question.content}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(question.createdAt).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircleQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">אין שאלות ללא מענה</h3>
              <p className="text-gray-500">כל השאלות נענו</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
