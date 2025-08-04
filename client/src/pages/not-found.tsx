import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">דף לא נמצא</h1>

          <p className="mt-4 text-sm text-gray-600 mb-6">
            הדף שחיפשת לא קיים במערכת
          </p>
          
          <Button 
            onClick={() => {
              // Clear all data and go to landing page
              localStorage.clear();
              window.location.href = "/";
            }}
            className="w-full bg-police-blue hover:bg-police-blue-dark text-white"
          >
            חזור לדף הראשי
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
