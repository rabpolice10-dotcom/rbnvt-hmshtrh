import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Wifi, WifiOff, Download } from "lucide-react";

export default function PWATest() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (iOS)
    const checkStandalone = () => {
      const standalone = (window.navigator as any).standalone ||
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches;
      setIsStandalone(standalone);
    };

    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center mb-6">
        <Smartphone className="h-6 w-6 text-police-blue ml-2" />
        <h1 className="text-2xl font-bold text-gray-800">בדיקת PWA</h1>
      </div>

      {/* PWA Status */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            {isStandalone ? <Smartphone className="h-5 w-5 text-green-600 ml-2" /> : <Monitor className="h-5 w-5 text-blue-600 ml-2" />}
            מצב הפעלה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>מצב standalone (מסך מלא):</span>
            <Badge variant={isStandalone ? "default" : "secondary"} className={isStandalone ? "bg-green-600" : ""}>
              {isStandalone ? "פעיל ✓" : "לא פעיל"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>התקנה:</span>
            <Badge variant={isInstalled ? "default" : "secondary"} className={isInstalled ? "bg-green-600" : ""}>
              {isInstalled ? "מותקן ✓" : "לא מותקן"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>חיבור לאינטרנט:</span>
            <div className="flex items-center">
              {isOnline ? <Wifi className="h-4 w-4 text-green-600 ml-1" /> : <WifiOff className="h-4 w-4 text-red-600 ml-1" />}
              <Badge variant={isOnline ? "default" : "destructive"} className={isOnline ? "bg-green-600" : ""}>
                {isOnline ? "מחובר" : "לא מחובר"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Instructions */}
      <Card className="shadow-card border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">הוראות התקנה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isStandalone && (
            <div className="space-y-2">
              <p className="text-blue-700 font-medium">iPhone/iPad:</p>
              <p className="text-sm text-blue-600">
                1. פתח באפליקציית Safari<br/>
                2. לחץ על כפתור השיתוף (⬆️)<br/>
                3. בחר "הוסף למסך הבית"<br/>
                4. לחץ "הוסף"
              </p>
              
              <p className="text-blue-700 font-medium mt-4">Android:</p>
              <p className="text-sm text-blue-600">
                1. פתח ב-Chrome<br/>
                2. לחץ על התפריט (⋮)<br/>
                3. בחר "הוסף למסך הבית"<br/>
                4. לחץ "הוסף"
              </p>
            </div>
          )}

          {installPrompt && (
            <Button 
              onClick={handleInstall}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 ml-2" />
              התקן את האפליקציה
            </Button>
          )}

          {isStandalone && (
            <div className="text-center p-4 bg-green-100 rounded-lg">
              <p className="text-green-800 font-bold">🎉 האפליקציה פועלת במצב מסך מלא!</p>
              <p className="text-sm text-green-700">האפליקציה הותקנה בהצלחה ופועלת כאפליקציית PWA.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>פרטים טכניים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="font-medium">User Agent:</span>
            <span className="text-xs break-all">{navigator.userAgent}</span>
            
            <span className="font-medium">Service Worker:</span>
            <span>{'serviceWorker' in navigator ? 'נתמך ✓' : 'לא נתמך ✗'}</span>
            
            <span className="font-medium">Manifest:</span>
            <span>קיים ✓</span>
            
            <span className="font-medium">Push Notifications:</span>
            <span>{'Notification' in window ? 'נתמך ✓' : 'לא נתמך ✗'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}