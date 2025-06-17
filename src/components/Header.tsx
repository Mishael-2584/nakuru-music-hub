
import { Music, Phone, Mail, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const navigateToPage = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleHomeClick = () => {
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleAuthAction = async () => {
    if (loading) return;
    
    if (isAuthenticated && user) {
      if (location.pathname === '/admin') {
        try {
          await signOut();
          toast({
            title: "Signed out",
            description: "You have been successfully signed out.",
          });
          navigate('/');
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to sign out. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        navigate("/admin");
      }
    } else {
      navigate("/auth");
    }
    setIsMobileMenuOpen(false);
  };

  const getAuthButtonText = () => {
    if (loading) return "Loading...";
    if (isAuthenticated) {
      return location.pathname === '/admin' ? "Sign Out" : "Admin Panel";
    }
    return "Admin Login";
  };

  const getAuthButtonIcon = () => {
    if (isAuthenticated && location.pathname === '/admin') {
      return <LogOut className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  };

  return (
    <header className="bg-gradient-to-r from-primary to-accent text-white sticky top-0 z-50 shadow-2xl">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 cursor-pointer" onClick={handleHomeClick}>
            <div className="p-2 sm:p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Music className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-bold tracking-wide">DAMON MUSIC ACADEMY</h1>
              <p className="text-xs sm:text-sm opacity-90 font-medium">WHERE WORDS FAIL, MUSIC SPEAKS</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold tracking-wide">DAMON</h1>
              <p className="text-xs opacity-90 font-medium">MUSIC ACADEMY</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <button 
              onClick={handleHomeClick} 
              className="hover:text-secondary transition-colors duration-200 font-medium"
            >
              Home
            </button>
            <button 
              onClick={() => navigateToPage('/about')} 
              className="hover:text-secondary transition-colors duration-200 font-medium"
            >
              About
            </button>
            <button 
              onClick={() => navigateToPage('/courses')} 
              className="hover:text-secondary transition-colors duration-200 font-medium"
            >
              Courses
            </button>
            <button 
              onClick={() => navigateToPage('/services')} 
              className="hover:text-secondary transition-colors duration-200 font-medium"
            >
              Services
            </button>
            <button 
              onClick={() => navigateToPage('/fees')} 
              className="hover:text-secondary transition-colors duration-200 font-medium"
            >
              Fees
            </button>
            <button 
              onClick={() => navigateToPage('/gallery')} 
              className="hover:text-secondary transition-colors duration-200 font-medium"
            >
              Gallery
            </button>
            <button 
              onClick={() => scrollToSection('contact')} 
              className="hover:text-secondary transition-colors duration-200 font-medium"
            >
              Contact
            </button>
            <Button 
              variant="secondary" 
              className="ml-4 font-semibold shadow-lg hover:scale-105 transition-transform duration-200"
              onClick={() => scrollToSection('registration')}
            >
              Register Now
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              className="ml-2 bg-white/20 border-white/30 hover:bg-white/30"
              onClick={handleAuthAction}
              disabled={loading}
              title={getAuthButtonText()}
            >
              {getAuthButtonIcon()}
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span className="text-sm font-medium">0701 195 460</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:bg-white/20"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 space-y-2">
            <button 
              onClick={handleHomeClick} 
              className="block w-full text-left py-2 px-4 hover:bg-white/20 rounded transition-colors duration-200"
            >
              Home
            </button>
            <button 
              onClick={() => navigateToPage('/about')} 
              className="block w-full text-left py-2 px-4 hover:bg-white/20 rounded transition-colors duration-200"
            >
              About
            </button>
            <button 
              onClick={() => navigateToPage('/courses')} 
              className="block w-full text-left py-2 px-4 hover:bg-white/20 rounded transition-colors duration-200"
            >
              Courses
            </button>
            <button 
              onClick={() => navigateToPage('/services')} 
              className="block w-full text-left py-2 px-4 hover:bg-white/20 rounded transition-colors duration-200"
            >
              Services
            </button>
            <button 
              onClick={() => navigateToPage('/fees')} 
              className="block w-full text-left py-2 px-4 hover:bg-white/20 rounded transition-colors duration-200"
            >
              Fees
            </button>
            <button 
              onClick={() => navigateToPage('/gallery')} 
              className="block w-full text-left py-2 px-4 hover:bg-white/20 rounded transition-colors duration-200"
            >
              Gallery
            </button>
            <button 
              onClick={() => scrollToSection('contact')} 
              className="block w-full text-left py-2 px-4 hover:bg-white/20 rounded transition-colors duration-200"
            >
              Contact
            </button>
            <Button 
              variant="secondary" 
              className="w-full mt-2 font-semibold"
              onClick={() => scrollToSection('registration')}
            >
              Register Now
            </Button>
            <Button 
              variant="outline" 
              className="w-full mt-2 bg-white/20 border-white/30 hover:bg-white/30 flex items-center justify-center gap-2"
              onClick={handleAuthAction}
              disabled={loading}
            >
              {getAuthButtonIcon()}
              {getAuthButtonText()}
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
