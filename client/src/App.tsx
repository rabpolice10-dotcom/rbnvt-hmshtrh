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

  // Allow admin access regardless of user status
  if (location === "/admin") {
    return <AdminDashboard />;
  }

  // Show register page for non-authenticated users
  if (location === "/register") {
    return <Register />;
  }

  // Show login page for non-authenticated users
  if (location === "/login") {
    return <Login />;
  }

  // Show login page for non-authenticated users or while loading
  if (isLoading || !isAuthenticated) {
    return <Login />;
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
        <Route component={NotFound} />
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
