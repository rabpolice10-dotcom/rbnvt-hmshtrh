import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Questions from "@/pages/Questions";
import Synagogues from "@/pages/Synagogues";
import Videos from "@/pages/Videos";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import Contact from "@/pages/Contact";
import JewishTimes from "@/pages/JewishTimes";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user } = useAuth();
  const [location] = useLocation();

  // Allow admin access regardless of user status
  if (location === "/admin") {
    return <Admin />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/questions" component={Questions} />
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
        <AuthProvider>
          <Toaster />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
