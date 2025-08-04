import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import logo from "@assets/bf4d69d1-82e0-4b41-bc8c-ecca5ca6a895_1753886576969.jpeg";

export default function Register() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      fullName: "",
      personalId: "",
      phone: "",
      email: "",
      password: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "בקשה נשלחה בהצלחה",
        description: "בקשתך נשלחה לאישור מנהל המערכת. תקבל הודעה כשהבקשה תאושר.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה ברישום",
        description: error.message || "אירעה שגיאה בעת שליחת הבקשה",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    registerMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <img src={logo} alt="לוגו רבנות המשטרה" className="h-16 w-auto mx-auto mb-4" />
            <CardTitle className="text-green-600">✓ בקשה נשלחה בהצלחה</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              בקשתך נשלחה למנהל המערכת לאישור.
            </p>
            <p className="text-sm text-gray-500">
              תקבל הודעה כשהבקשה תאושר ותוכל להתחבר לאפליקציה.
            </p>
            <Button 
              onClick={() => setLocation("/login")} 
              variant="outline"
              className="w-full"
            >
              יש לי כבר חשבון - התחבר
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <img src={logo} alt="לוגו רבנות המשטרה" className="h-16 w-auto mx-auto mb-4" />
          <CardTitle className="text-xl">רישום לרבנות המשטרה</CardTitle>
          <CardDescription className="text-gray-600">
            מלא את הפרטים הנדרשים להצטרפות למערכת
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription className="text-sm text-blue-800">
              <strong>הודעת פרטיות:</strong> הנתונים שלך ישמשו אך ורק לצורך אימות המשתמש ולא יועברו לגורמים חיצוניים. 
              המידע נשמר בצורה מאובטחת במערכת המשטרה.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">שם מלא *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="הכנס שם מלא"
                        className="text-right"
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">מספר אישי *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="הכנס מספר אישי (7 ספרות)"
                        className="text-right"
                        dir="rtl"
                        maxLength={7}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">מספר טלפון *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="05X-XXXXXXX"
                        className="text-right"
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">דואר אלקטרוני</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email"
                        placeholder="example@email.com"
                        className="text-right"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">בחר סיסמה *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password"
                        placeholder="בחר סיסמה (לפחות 6 תווים)"
                        className="text-right"
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "שולח בקשה..." : "שלח בקשה לאישור"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setLocation("/login")}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              כבר יש לי חשבון - התחבר
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}