import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Questions from "@/pages/Questions";
import QuestionDetail from "@/pages/QuestionDetail";
import Synagogues from "@/pages/Synagogues";
import Videos from "@/pages/Videos";
import Profile from "@/pages/Profile";
import AdminDashboard from "@/pages/AdminDashboard";
import Contact from "@/pages/Contact";
import JewishTimesNew from "@/pages/JewishTimesNew";
import DailyHalacha from "@/pages/DailyHalacha";
import News from "@/pages/News";
import PWATest from "@/pages/PWATest";
import Landing from "@/pages/Landing";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Check localStorage immediately for admin status
  const isAdminInStorage = localStorage.getItem('isAdmin') === 'true';
  
  console.log('App state:', { isAuthenticated, isLoading, location, isAdminInStorage });
  
  // Force login page if explicitly requested
  if (location === "/login") {
    return <Login />;
  }
  
  // Force register page if explicitly requested
  if (location === "/register") {
    return <Register />;
  }
  
  // Always show landing page first for unauthenticated users
  if (!isAuthenticated && !isLoading && !isAdminInStorage) {
    // Default to landing page (login/register) for all other routes
    return <Landing />;
  }
  
  // If user is authenticated (not admin), show the main app
  if (isAuthenticated && !isAdminInStorage) {
    return (
      <Layout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/questions" component={Questions} />
          <Route path="/questions/:id" component={QuestionDetail} />
          <Route path="/synagogues" component={Synagogues} />
          <Route path="/videos" component={Videos} />
          <Route path="/profile" component={Profile} />
          <Route path="/contact" component={Contact} />
          <Route path="/jewish-times" component={JewishTimesNew} />
          <Route path="/daily-halacha" component={DailyHalacha} />
          <Route path="/news" component={News} />
          <Route path="/pwa-test" component={PWATest} />
          <Route path="*">
            {() => {
              // For any unmatched route when authenticated, redirect to home
              window.location.href = "/";
              return <div>מפנה...</div>;
            }}
          </Route>
        </Switch>
      </Layout>
    );
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-police-blue to-police-blue-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Allow admin access only if admin flag exists
  if (location === "/admin" && isAdminInStorage) {
    return <AdminDashboard />;
  }

  // Default fallback - show landing page
  return <Landing />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
