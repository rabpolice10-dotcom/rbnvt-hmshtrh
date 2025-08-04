import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import logo from "@assets/bf4d69d1-82e0-4b41-bc8c-ecca5ca6a895_1753886576969.jpeg";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  personalId: z.string().regex(/^\d{9}$/, "מספר אישי חייב להכיל 9 ספרות"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { deviceId } = useAuth();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      personalId: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, personalId: data.personalId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "התחברות הצליחה",
        description: "ברוך הבא לרבנות המשטרה",
      });
      // Refresh to load user data
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בהתחברות",
        description: error.message || "מספר אישי לא נמצא במערכת או לא אושר",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <img src={logo} alt="לוגו רבנות המשטרה" className="h-16 w-auto mx-auto mb-4" />
          <CardTitle className="text-xl">התחברות לרבנות המשטרה</CardTitle>
          <CardDescription className="text-gray-600">
            הכנס את מספר האישי שלך להתחברות
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="personalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">מספר אישי *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="הכנס מספר אישי (9 ספרות)"
                        className="text-right"
                        dir="rtl"
                        maxLength={9}
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
            
            <button
              onClick={() => setLocation("/admin")}
              className="text-gray-400 hover:text-gray-600 text-xs underline block w-full"
            >
              כניסה למנהלי מערכת
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}