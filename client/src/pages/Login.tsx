import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import logo from "@assets/bf4d69d1-82e0-4b41-bc8c-ecca5ca6a895_1753886576969.jpeg";
import { loginSchema, type LoginUser } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";

// Admin credentials
const ADMIN_EMAIL = "admin@police.gov.il";
const ADMIN_PASSWORD = "admin123";

export default function Login() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { deviceId } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      console.log('Starting login with:', { email: data.email, deviceId });
      
      // Check if admin login - SIMPLE VERSION
      if (data.email === ADMIN_EMAIL && data.password === ADMIN_PASSWORD) {
        // Store admin flag
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminEmail', ADMIN_EMAIL);
        localStorage.setItem('deviceId', 'admin-device-simple');
        
        return { 
          isAdmin: true, 
          email: ADMIN_EMAIL,
          fullName: "מנהל המערכת",
          deviceId: 'admin-device-simple'
        };
      }
      
      const loginPayload = { ...data, deviceId };
      console.log('Sending login request:', loginPayload);
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginPayload),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Login error response:', error);
        throw new Error(error.message);
      }
      
      const result = await response.json();
      console.log('Login successful:', result);
      // Store the user's device ID for future requests
      if (result.user && result.user.deviceId) {
        localStorage.setItem('deviceId', result.user.deviceId);
      }
      return result;
    },
    onSuccess: async (result) => {
      if (result.isAdmin) {
        toast({
          title: "התחברות מנהל הצליחה",
          description: "עובר לממשק ניהול",
        });
        
        // Force refresh of auth state
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        
        // Navigate to admin page immediately
        setLocation("/admin");
        return;
      }
      
      toast({
        title: "התחברות הצליחה",
        description: "ברוך הבא לרבנות המשטרה",
      });
      
      // Clear any localStorage flags and set the correct device ID
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('adminEmail');
      if (result.user && result.user.deviceId) {
        localStorage.setItem('deviceId', result.user.deviceId);
      }
      
      // Invalidate the auth query to refresh user data
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Navigate to home page after a short delay
      setTimeout(() => {
        setLocation("/");
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בהתחברות",
        description: error.message || "פרטי התחברות לא נכונים או החשבון לא אושר",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginUser) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <img src={logo} alt="לוגו רבנות המשטרה" className="h-16 w-auto mx-auto mb-4" />
          <CardTitle className="text-xl">התחברות לרבנות המשטרה</CardTitle>
          <CardDescription className="text-gray-600">
            הכנס אימייל וסיסמה להתחברות
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">אימייל *</FormLabel>
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
                    <FormLabel className="text-right">סיסמה *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password"
                        placeholder="הכנס סיסמה"
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
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "מתחבר..." : "התחבר"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 space-y-3 text-center">
            <button
              onClick={() => setLocation("/register")}
              className="text-blue-600 hover:text-blue-800 text-sm underline block w-full"
            >
              אין לי חשבון - הרשם למערכת
            </button>
            

          </div>
        </CardContent>
      </Card>
    </div>
  );
}