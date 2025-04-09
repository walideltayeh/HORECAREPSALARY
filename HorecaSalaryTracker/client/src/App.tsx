import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/dashboard";
import Cafes from "./pages/cafes";
import KpiSettings from "./pages/kpi-settings";
import Salary from "./pages/salary";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/cafes" component={Cafes} />
      <Route path="/kpi-settings" component={KpiSettings} />
      <Route path="/salary" component={Salary} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Router />
      </MainLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
