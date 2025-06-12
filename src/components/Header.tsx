
import { Music, Phone, Mail, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="bg-gradient-to-r from-primary to-accent text-white sticky top-0 z-50 shadow-2xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Music className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide">DAMON MUSIC ACADEMY</h1>
              <p className="text-sm opacity-90 font-medium">WHERE WORDS FAIL, MUSIC SPEAKS</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('home')} 
              className="hover:text-secondary transition-colors duration-200 font-medium"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('courses')} 
              className="hover:text-secondary transition-colors duration-200 font-medium"
            >
              Courses
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="hover:text-secondary transition-colors duration-200 font-medium"
            >
              About
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
              onClick={() => scrollToSection('contact')}
            >
              Register Now
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span className="text-sm font-medium">0701 195 460</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:bg-white/20"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 space-y-2">
            <button 
              onClick={() => scrollToSection('home')} 
              className="block w-full text-left py-2 px-4 hover:bg-white/20 rounded transition-colors duration-200"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('courses')} 
              className="block w-full text-left py-2 px-4 hover:bg-white/20 rounded transition-colors duration-200"
            >
              Courses
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="block w-full text-left py-2 px-4 hover:bg-white/20 rounded transition-colors duration-200"
            >
              About
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
              onClick={() => scrollToSection('contact')}
            >
              Register Now
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
