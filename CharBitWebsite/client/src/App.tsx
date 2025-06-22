import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AgeVerificationModal } from "@/components/AgeVerificationModal";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";

// Pages
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import CreateCharacter from "@/pages/CreateCharacter";
import Character from "@/pages/Character";
import Profile from "@/pages/Profile";
import TagExplorer from "@/pages/TagExplorer";
import CreatorApplication from "@/pages/CreatorApplication";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Handle unauthorized errors globally
  useEffect(() => {
    const handleError = (event: any) => {
      if (event.detail && isUnauthorizedError(new Error(event.detail.message))) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    };

    window.addEventListener('queryError', handleError);
    return () => window.removeEventListener('queryError', handleError);
  }, [toast]);

  // Show landing page for unauthenticated users
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Authenticated layout with sidebar
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/create" component={CreateCharacter} />
          <Route path="/character/:id" component={Character} />
          <Route path="/user/:username">
            {(params) => <Profile username={params.username} />}
          </Route>
          <Route path="/profile">
            {() => <Profile />}
          </Route>
          <Route path="/favorites">
            {() => <Profile activeTab="favorites" />}
          </Route>
          <Route path="/creator/apply" component={CreatorApplication} />
          <Route path="/following">
            {() => <Profile activeTab="following" />}
          </Route>
          <Route path="/friends">
            {() => <Profile activeTab="friends" />}
          </Route>
          <Route path="/messages">
            {() => <Profile activeTab="messages" />}
          </Route>
          <Route path="/explore" component={Home} />
          <Route path="/tags" component={TagExplorer} />
          <Route path="/tags/:tag" component={TagExplorer} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AgeVerificationModal />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
