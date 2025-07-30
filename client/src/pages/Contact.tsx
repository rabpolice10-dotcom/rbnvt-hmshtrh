import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Phone, Send } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: ""
  });

  const sendMessage = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("/api/contact", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "הודעה נשלחה בהצלחה",
        description: "המנהלים יחזרו אליך בהקדם האפשרי",
      });
      setFormData({ name: "", phone: "", message: "" });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשליחת ההודעה. נסה שוב.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות",
        variant: "destructive",
      });
      return;
    }
    sendMessage.mutate(formData);
  };

  const whatsappNumber = "972501234567"; // מספר וואטסאפ של הרבנות
  const whatsappMessage = "שלום, אני פונה מאפליקציה רבנות המשטרה";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="p-4 space-y-4">
      {/* WhatsApp Contact */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center mb-4">
            <MessageSquare className="h-5 w-5 text-green-600 ml-2" />
            <h3 className="font-bold text-gray-800">צור קשר ישיר</h3>
          </div>
          
          <Button
            onClick={() => window.open(whatsappUrl, '_blank')}
            className="w-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center space-x-2 space-x-reverse py-3"
          >
            <FaWhatsapp className="h-5 w-5" />
            <span>וואטסאפ רבנות המשטרה</span>
          </Button>
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center mb-4">
            <Send className="h-5 w-5 text-police-blue ml-2" />
            <h3 className="font-bold text-gray-800">שלח הודעה למנהלים</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="הכנס את שמך המלא"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">מספר טלפון</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="050-1234567"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="message">הודעה</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="כתב את ההודעה שלך כאן..."
                rows={4}
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={sendMessage.isPending}
              className="w-full bg-police-blue hover:bg-police-blue-dark text-white"
            >
              {sendMessage.isPending ? "שולח..." : "שלח הודעה"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}