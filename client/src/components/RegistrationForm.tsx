import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RegistrationForm() {
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    personalId: "",
    phone: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(formData);
      toast({
        title: "בקשה נשלחה בהצלחה",
        description: "הבקשה שלך נשלחה לאישור מנהל המערכת",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "שגיאה ברישום",
        description: "אירעה שגיאה בשליחת הבקשה. אנא נסה שוב.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="p-4">
      <Card className="shadow-card mt-4">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <UserPlus className="h-12 w-12 text-police-blue mb-3 mx-auto" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">הרשמה ראשונית</h2>
            <p className="text-gray-600 text-sm">אנא מלא את הפרטים הבאים להרשמה למערכת</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                שם מלא
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange("fullName")}
                placeholder="הכנס שם מלא"
                required
                className="text-right"
              />
            </div>
            
            <div>
              <Label htmlFor="personalId" className="block text-sm font-medium text-gray-700 mb-1">
                מספר אישי
              </Label>
              <Input
                id="personalId"
                type="text"
                value={formData.personalId}
                onChange={handleChange("personalId")}
                placeholder="הכנס מספר אישי"
                required
                className="text-right"
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                מספר טלפון
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange("phone")}
                placeholder="הכנס מספר טלפון"
                required
                className="text-right"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-police-blue hover:bg-police-blue-dark text-white py-3"
              disabled={isLoading}
            >
              {isLoading ? "שולח..." : "שלח בקשה להרשמה"}
            </Button>
          </form>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start">
              <Info className="h-4 w-4 text-yellow-600 mt-0.5 ml-2 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                הבקשה תישלח לאישור מנהל. תקבל הודעה כאשר החשבון יאושר.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
