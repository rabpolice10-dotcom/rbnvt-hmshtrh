import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Download, User, Calendar, Phone, Mail, Activity, CheckCircle, XCircle, Clock, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface UserStats {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    personalId: string;
    status: string;
    isAdmin: boolean;
    createdAt: string;
    lastLoginAt?: string;
    loginCount: number;
    questionsSubmitted: number;
  };
  questionsCount: number;
  lastActivity: string;
}

interface SystemStats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
  totalQuestions: number;
  answeredQuestions: number;
  pendingQuestions: number;
  recentRegistrations: number;
  activeUsers: number;
}

interface UserActivity {
  user: any;
  statistics: {
    questionsSubmitted: number;
    questionsAnswered: number;
    lastLogin: string | null;
    totalLoginCount: number;
    joinDate: string;
    accountStatus: string;
  };
  recentActivity: Array<{
    type: string;
    title: string;
    content: string;
    date: string;
    status: string;
  }>;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Fetch users with filtering and pagination
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/admin/users', { search, statusFilter, sortBy, sortOrder, page: currentPage }],
    queryFn: () => apiRequest(`/api/admin/users?status=${statusFilter}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}&page=${currentPage}&limit=20`)
  });

  // Fetch system statistics
  const { data: systemStats } = useQuery<SystemStats>({
    queryKey: ['/api/admin/system-stats'],
    queryFn: () => apiRequest('/api/admin/system-stats')
  });

  // Fetch detailed user information
  const { data: userDetails } = useQuery<UserActivity>({
    queryKey: ['/api/admin/users', selectedUser],
    queryFn: () => apiRequest(`/api/admin/users/${selectedUser}`),
    enabled: !!selectedUser
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status, reason }: { userId: string; status: string; reason?: string }) =>
      apiRequest(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status, 
          reason,
          deviceId: localStorage.getItem('deviceId') || 'admin-device-simple'
        })
      }),
    onSuccess: () => {
      toast({
        title: "הצלחה",
        description: "סטטוס המשתמש עודכן בהצלחה",
      });
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בעדכון סטטוס המשתמש",
        variant: "destructive",
      });
    }
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: ({ action, userIds, reason }: { action: string; userIds: string[]; reason?: string }) =>
      apiRequest('/api/admin/users/bulk-action', {
        method: 'POST',
        body: JSON.stringify({ 
          action, 
          userIds, 
          reason,
          deviceId: localStorage.getItem('deviceId') || 'admin-device-simple'
        })
      }),
    onSuccess: (result) => {
      toast({
        title: "הצלחה",
        description: `פעולה בוצעה בהצלחה: ${result.successful} מתוך ${result.successful + result.failed}`,
      });
      setSelectedUsers([]);
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-stats'] });
    }
  });

  // Export users mutation
  const exportMutation = useMutation({
    mutationFn: (format: string) => apiRequest(`/api/admin/users/export?format=${format}`),
    onSuccess: (data, format) => {
      if (format === 'csv') {
        // Handle CSV download
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users-export.csv';
        a.click();
      } else {
        // Handle JSON download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users-export.json';
        a.click();
      }
      toast({
        title: "הצלחה",
        description: "נתוני המשתמשים יוצאו בהצלחה",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 ml-1" />מאושר</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 ml-1" />נדחה</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 ml-1" />ממתין</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: he });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(usersData?.users.map((u: any) => u.user.id) || []);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* System Statistics Cards */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">סה"כ משתמשים</p>
                  <p className="text-2xl font-bold text-[#4585d9]">{systemStats.totalUsers}</p>
                </div>
                <User className="h-8 w-8 text-[#4585d9]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">משתמשים פעילים</p>
                  <p className="text-2xl font-bold text-green-600">{systemStats.activeUsers}</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ממתינים לאישור</p>
                  <p className="text-2xl font-bold text-yellow-600">{systemStats.pendingUsers}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">הרשמות חדשות (7 ימים)</p>
                  <p className="text-2xl font-bold text-[#4585d9]">{systemStats.recentRegistrations}</p>
                </div>
                <Calendar className="h-8 w-8 text-[#4585d9]" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>ניהול משתמשים</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportMutation.mutate('json')}
                disabled={exportMutation.isPending}
              >
                <Download className="w-4 h-4 ml-1" />
                יצוא JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportMutation.mutate('csv')}
                disabled={exportMutation.isPending}
              >
                <Download className="w-4 h-4 ml-1" />
                יצוא CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="חיפוש לפי שם, אימייל, טלפון או ת.ז."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="סינון לפי סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="pending">ממתין לאישור</SelectItem>
                <SelectItem value="approved">מאושר</SelectItem>
                <SelectItem value="rejected">נדחה</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="מיון לפי" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">תאריך הצטרפות</SelectItem>
                <SelectItem value="fullName">שם</SelectItem>
                <SelectItem value="email">אימייל</SelectItem>
                <SelectItem value="status">סטטוס</SelectItem>
                <SelectItem value="lastLoginAt">התחברות אחרונה</SelectItem>
                <SelectItem value="loginCount">מספר התחברויות</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">יורד</SelectItem>
                <SelectItem value="asc">עולה</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex gap-2 mb-4 p-3 bg-blue-50 rounded-lg border">
              <span className="text-sm font-medium">{selectedUsers.length} משתמשים נבחרו:</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline">אשר הכל</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>אישור משתמשים</AlertDialogTitle>
                    <AlertDialogDescription>
                      האם אתה בטוח שברצונך לאשר {selectedUsers.length} משתמשים?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction onClick={() => bulkActionMutation.mutate({ action: 'approve', userIds: selectedUsers })}>
                      אשר
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline">דחה הכל</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>דחיית משתמשים</AlertDialogTitle>
                    <AlertDialogDescription>
                      האם אתה בטוח שברצונך לדחות {selectedUsers.length} משתמשים?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction onClick={() => bulkActionMutation.mutate({ action: 'reject', userIds: selectedUsers })}>
                      דחה
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Users Table */}
          {usersLoading ? (
            <div className="text-center py-8">טוען משתמשים...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === usersData?.users.length && usersData?.users.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>שם מלא</TableHead>
                    <TableHead>אימייל</TableHead>
                    <TableHead>טלפון</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>שאלות</TableHead>
                    <TableHead>תאריך הצטרפות</TableHead>
                    <TableHead>פעילות אחרונה</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users.map((item: any) => (
                    <TableRow key={item.user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(item.user.id)}
                          onCheckedChange={(checked) => handleSelectUser(item.user.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.user.isAdmin && <Badge variant="secondary" className="text-xs">מנהל</Badge>}
                          {item.user.fullName}
                        </div>
                      </TableCell>
                      <TableCell>{item.user.email}</TableCell>
                      <TableCell>{item.user.phone}</TableCell>
                      <TableCell>{getStatusBadge(item.user.status)}</TableCell>
                      <TableCell>{item.questionsCount || 0}</TableCell>
                      <TableCell>{formatDate(item.user.createdAt)}</TableCell>
                      <TableCell>
                        {item.user.lastLoginAt ? formatDate(item.user.lastLoginAt) : 'מעולם לא התחבר'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(item.user.id)}
                              >
                                פרטים
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>פרטי משתמש - {item.user.fullName}</DialogTitle>
                              </DialogHeader>
                              {userDetails && (
                                <div className="space-y-4" dir="rtl">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">פרטים אישיים</h4>
                                      <div className="space-y-1 text-sm">
                                        <p><strong>שם:</strong> {userDetails.user.fullName}</p>
                                        <p><strong>אימייל:</strong> {userDetails.user.email}</p>
                                        <p><strong>טלפון:</strong> {userDetails.user.phone}</p>
                                        <p><strong>ת.ז.:</strong> {userDetails.user.personalId}</p>
                                        <p><strong>סטטוס:</strong> {getStatusBadge(userDetails.user.status)}</p>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-semibold mb-2">סטטיסטיקות</h4>
                                      <div className="space-y-1 text-sm">
                                        <p><strong>שאלות שנשלחו:</strong> {userDetails.statistics.questionsSubmitted}</p>
                                        <p><strong>שאלות שנענו:</strong> {userDetails.statistics.questionsAnswered}</p>
                                        <p><strong>התחברויות:</strong> {userDetails.statistics.totalLoginCount}</p>
                                        <p><strong>התחברות אחרונה:</strong> {userDetails.statistics.lastLogin ? formatDate(userDetails.statistics.lastLogin) : 'מעולם לא'}</p>
                                        <p><strong>תאריך הצטרפות:</strong> {formatDate(userDetails.statistics.joinDate)}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold mb-2">פעילות אחרונה</h4>
                                    <div className="max-h-40 overflow-y-auto">
                                      {userDetails.recentActivity.length > 0 ? (
                                        userDetails.recentActivity.map((activity, index) => (
                                          <div key={index} className="border-b pb-2 mb-2 last:border-b-0">
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <p className="font-medium text-sm">{activity.title}</p>
                                                <p className="text-xs text-gray-600">{activity.content}</p>
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                {formatDate(activity.date)}
                                              </div>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-sm text-gray-500">אין פעילות אחרונה</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {item.user.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => updateStatusMutation.mutate({ userId: item.user.id, status: 'approved' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                אשר
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => updateStatusMutation.mutate({ userId: item.user.id, status: 'rejected' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                דחה
                              </Button>
                            </>
                          )}

                          {item.user.status === 'approved' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                >
                                  בטל אישור
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>ביטול אישור משתמש</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    האם אתה בטוח שברצונך לבטל את אישור המשתמש {item.user.fullName}?
                                    משתמש זה לא יוכל יותר לגשת למערכת.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => updateStatusMutation.mutate({ userId: item.user.id, status: 'rejected', reason: 'חריגה מהכללים' })}
                                  >
                                    בטל אישור
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {usersData && usersData.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                קודם
              </Button>
              <span className="px-4 py-2 text-sm">
                עמוד {currentPage} מתוך {usersData.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === usersData.pages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                הבא
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}