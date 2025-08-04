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
import JewishTimes from "@/pages/JewishTimes";
import Landing from "@/pages/Landing";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // console.log('App state:', { isAuthenticated, isLoading, location });

  // Always show landing page first for unauthenticated users
  if (!isAuthenticated && !isLoading) {
    // Allow access to specific auth pages
    if (location === "/register") {
      return <Register />;
    }
    if (location === "/login") {
      return <Login />;
    }
    if (location === "/admin") {
      return <AdminDashboard />;
    }
    // Default to landing page (login/register) for all other routes
    return <Landing />;
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-police-blue to-police-blue-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Allow admin access 
  if (location === "/admin") {
    return <AdminDashboard />;
  }

  // Show app for authenticated users
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
        <Route path="/jewish-times" component={JewishTimes} />
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
