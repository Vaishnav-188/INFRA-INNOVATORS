import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Pages
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Events from "./pages/Events";
import Jobs from "./pages/Jobs";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUserDirectory from "./pages/AdminUserDirectory";
import StudentDashboard from "./pages/StudentDashboard";
import StudentMentorship from "./pages/StudentMentorship";
import AlumniDashboard from "./pages/AlumniDashboard";
import AlumniMatching from "./pages/AlumniMatching";
import AlumniMentorship from "./pages/AlumniMentorship";
import MentorshipChat from "./pages/MentorshipChat";
import Connections from "./pages/Connections";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/events" element={<Events />} />
            <Route path="/jobs" element={<Jobs />} />

            {/* Protected Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/directory" element={<AdminUserDirectory />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/mentorship" element={<StudentMentorship />} />
            <Route path="/alumni" element={<AlumniDashboard />} />
            <Route path="/matching" element={<AlumniMatching />} />
            <Route path="/mentorship" element={<AlumniMentorship />} />
            <Route path="/mentorship-chat/:mentorshipId" element={<MentorshipChat />} />
            <Route path="/connections" element={<Connections />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
