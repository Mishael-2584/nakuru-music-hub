import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import About from "./pages/About";
import Courses from "./pages/Courses";
import ServicesPage from "./pages/Services";
import FeesPage from "./pages/Fees";
import Gallery from "./pages/Gallery";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import NotFound from "./pages/NotFound";
import RegistrationPage from "./pages/Registration";
import EmailDebug from "./pages/EmailDebug";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherSignup from "./pages/TeacherSignup";
import Shop from "./pages/Shop";
import Team from "./pages/Team";
import SignOut from "./pages/SignOut";
import RoleTest from "./pages/RoleTest";

const queryClient = new QueryClient();

// Pending Teacher Component
const PendingTeacherPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-xl w-full shadow-2xl border-0 bg-white rounded-lg p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
          <p className="text-gray-600 mb-6">
            Your teacher application is currently under review by our admin team. 
            You will receive an email notification once your account has been approved.
          </p>
          <p className="text-sm text-gray-500">
            In the meantime, you can access the student portal to explore our academy.
          </p>
          <div className="mt-6">
            <a 
              href="/student" 
              className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Student Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/fees" element={<FeesPage />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/team" element={<Team />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/registration" element={<RegistrationPage />} />
            <Route path="/email-debug" element={<EmailDebug />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher-signup" element={<TeacherSignup />} />
            <Route path="/pending-teacher" element={<PendingTeacherPage />} />
            <Route path="/signout" element={<SignOut />} />
            <Route path="/roletest" element={<RoleTest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
