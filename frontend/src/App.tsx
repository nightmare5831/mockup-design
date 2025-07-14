
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './store/store';
import Index from "./pages/Index";
import Mockup from "./pages/Mockup";
import Projects from "./pages/Projects";
import Features from "./pages/Features";
import Admin from "./pages/Admin";
import Subscription from "./pages/Subscription";
import SubscriptionCheckout from "./pages/SubscriptionCheckout";
import AccountSubscription from "./pages/AccountSubscription";
import Credits from "./pages/Credits";
import CreditHistory from "./pages/CreditHistory";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import NotificationDisplay from "./components/Notifications/NotificationDisplay";
import AuthModal from "./components/Modals/AuthModal";
import PricingModal from "./components/Modals/PricingModal";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NotificationDisplay />
        <AuthModal />
        <PricingModal />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/mockup" element={<Mockup />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/features" element={<Features />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/subscription/checkout" element={<SubscriptionCheckout />} />
            <Route path="/account/subscription" element={<AccountSubscription />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/credits/history" element={<CreditHistory />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
