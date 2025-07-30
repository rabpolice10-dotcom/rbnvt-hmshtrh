import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AskRabbiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AskRabbiModal({ open, onOpenChange }: AskRabbiModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    category: "",
    content: "",
    isUrgent: false,
    isPrivate: false
  });

  const submitQuestion = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error("User not authenticated");
      
      return apiRequest("POST", "/api/questions", {
        ...data,
        userId: user.id
      });
    },
    onSuccess: () => {
      toast({
        title: "השאלה נשלחה בהצלחה",
        description: "תקבל הודעה כאשר התשובה תהיה מוכנה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setFormData({ category: "", content: "", isUrgent: false, isPrivate: false });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בשליחת השאלה. אנא נסה שוב.",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion.mutate(formData);
  };

  const categories = [
    "שבת וחגים",
    "כשרות",
    "שיטור ובטחון",
    "תפילה",
    "אחר"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-right">שאל את הרב</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">השאלה שלך</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="הכנס את השאלה שלך כאן..."
              className="h-32 resize-none text-right"
              required
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-reverse space-x-2">
              <Checkbox
                id="urgent"
                checked={formData.isUrgent}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isUrgent: !!checked }))}
              />
              <Label htmlFor="urgent" className="text-sm text-gray-700">שאלה דחופה</Label>
            </div>
            
            <div className="flex items-center space-x-reverse space-x-2">
              <Checkbox
                id="private"
                checked={formData.isPrivate}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: !!checked }))}
              />
              <Label htmlFor="private" className="text-sm text-gray-700">שאלה פרטית</Label>
            </div>
            <p className="text-xs text-gray-500 mt-1">שאלה פרטית לא תוצג לציבור, רק למנהלים ולמשלח</p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-police-blue hover:bg-police-blue-dark text-white"
            disabled={submitQuestion.isPending}
          >
            {submitQuestion.isPending ? "שולח..." : "שלח שאלה"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
