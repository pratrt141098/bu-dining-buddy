import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PreferencesProvider } from "@/context/PreferencesContext";
import Home from "./pages/Home";
import AllHalls from "./pages/AllHalls";
import HallDetail from "./pages/HallDetail";
import Confirmed from "./pages/Confirmed";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PreferencesProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/halls" element={<AllHalls />} />
            <Route path="/halls/:id" element={<HallDetail />} />
            <Route path="/confirmed" element={<Confirmed />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PreferencesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
