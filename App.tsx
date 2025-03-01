import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Rank.tsx";
import ChildSafetyPage from "./pages/ChildSafetyPage";
import BiologyEducationPage from "./pages/BiologyEducationPage.tsx";
import { ThemeProvider } from "@/components/ThemeProvider";
import BiologyLearning from "./pages/BiologyLearning.tsx";
import HomePage from "./pages/Homepage.tsx";
import Profile from "./pages/Profile.tsx";
import QuizPage from "./pages/QuizPage.tsx";
import Auth from "./pages/Auth.tsx";
import LearningSubjects from "./pages/LearningSubjects.tsx";
import Rank from "./pages/Rank.tsx";
import BiologyQuiz from "./pages/BiologyQuiz.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/Profile" element={<Profile />} />
            <Route path="/safety" element={<ChildSafetyPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/learn/biology" element={<BiologyLearning />} />
            <Route path="/bioquiz" element={<BiologyQuiz/>} />
            <Route path="/learn/biovideos" element={<BiologyEducationPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/subs"element={<LearningSubjects />} />
            <Route path="/Rank"element={<Rank />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;