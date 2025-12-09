import { Switch, Route } from "wouter";
import { Nav } from "@/components/nav";
import Dashboard from "@/pages/dashboard";
import Teams from "@/pages/teams";
import TradeSimulator from "@/pages/trade-simulator";
import TradeHistory from "@/pages/trade-history";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased dark">
      <Nav />
      <main className="container py-6">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/teams" component={Teams} />
          <Route path="/trade" component={TradeSimulator} />
          <Route path="/history" component={TradeHistory} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
