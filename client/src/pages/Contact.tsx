import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, ExternalLink } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

export default function Contact() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [message, setMessage] = useState("");

  const submitMessage = useMutation({
    mutationFn: async (messageText: string) => {
      return apiRequest("POST", "/api/contact", {
        userId: user?.id,
        fullName: user?.fullName,
        phone: user?.phone,
        message: messageText
      });
    },
    onSuccess: () => {
      toast({
        title: "ההודעה נשלחה בהצלחה",
        description: "נחזור אליך בהקדם האפשרי",
      });
      setMessage("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בשליחת ההודעה. אנא נסה שוב.",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      submitMessage.mutate(message);
    }
  };

  const openWhatsApp = () => {
    // Replace with the actual WhatsApp number for the organization
    const whatsappNumber = "972501234567"; // Example number
    const message = "שלום, אני פונה מאפליקציה רבנות המשטרה";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center mb-6">
        <MessageSquare className="h-6 w-6 text-police-blue ml-2" />
        <h1 className="text-xl font-bold text-gray-800">צור קשר עם מנהלי האפליקציה</h1>
      </div>

      {/* WhatsApp Contact */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center mb-3">
            <SiWhatsapp className="h-5 w-5 text-green-600 ml-2" />
            <h3 className="font-bold text-gray-800">וואטסאפ רבנות המשטרה</h3>
          </div>
          
          <p className="text-gray-600 mb-4 text-sm">
            ליצירת קשר מהיר ומיידי עם צוות רבנות המשטרה
          </p>
          
          <Button
            onClick={openWhatsApp}
            className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center space-x-reverse space-x-2"
          >
            <SiWhatsapp className="h-5 w-5" />
            <span>שלח הודעה בוואטסאפ</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center mb-4">
            <Send className="h-5 w-5 text-police-blue ml-2" />
            <h3 className="font-bold text-gray-800">שלח הודעה למנהלי האתר</h3>
          </div>
          
          {user && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">שולח: {user.fullName}</p>
              <p className="text-sm text-gray-600">טלפון: {user.phone}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הודעה</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="כתב את הודעתך כאן..."
                className="h-32 resize-none text-right"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-police-blue hover:bg-police-blue-dark text-white"
              disabled={submitMessage.isPending}
            >
              {submitMessage.isPending ? "שולח..." : "שלח הודעה"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Additional Contact Information */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center mb-3">
            <MessageSquare className="h-5 w-5 text-police-blue ml-2" />
            <h3 className="font-bold text-gray-800">פרטי יצירת קשר נוספים</h3>
          </div>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>מוקד רבנות המשטרה</span>
              <span className="font-medium text-police-blue">*6911</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>שעות פעילות</span>
              <span className="font-medium">א'-ה' 08:00-16:00</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>מקרי חירום</span>
              <span className="font-medium text-red-600">24/7</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="shadow-card border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <h3 className="font-bold text-orange-800 mb-2">הודעה חשובה</h3>
          <div className="text-sm text-orange-700 space-y-1">
            <p>• למקרי חירום הלכתיים פנה למוקד הטלפוני</p>
            <p>• התשובה להודעות דרך האפליקציה תתקבל תוך 24-48 שעות</p>
            <p>• לשאלות דחופות השתמש בוואטסאפ או במוקד הטלפוני</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}