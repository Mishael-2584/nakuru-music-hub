import { useState, useEffect } from "react";
import { Menu, X, Music, Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleNavigation = (href: string) => {
    setIsMenuOpen(false);
    navigate(href);
  };

  const navigation = [{
    name: "Home",
    href: "/"
  }, {
    name: "About",
    href: "/about"
  }, {
    name: "Courses",
    href: "/courses"
  }, {
    name: "Fees",
    href: "/fees"
  }, {
    name: "Services",
    href: "/services"
  }, {
    name: "Events",
    href: "/events"
  }, {
    name: "Blog",
    href: "/news"
  }, {
    name: "Gallery",
    href: "/gallery"
  }, {
    name: "FAQ",
    href: "/faq"
  }, {
    name: "Team",
    href: "/team"
  }, {
    name: "Shop",
    href: "/shop"
  }];

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white/90 backdrop-blur-sm"}`}>
      {/* Contact Navigation Bar */}
      <div className="bg-gradient-to-r from-primary/95 to-accent/95 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between py-1 sm:py-2 text-white text-xs sm:text-sm gap-2 sm:gap-0">
            {/* Contact Info */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-center sm:justify-start">
              <a 
                href="tel:+254701195460" 
                className="flex items-center gap-1 hover:text-primary-200 transition-colors whitespace-nowrap"
              >
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">+254 701 195 460</span>
              </a>
              <a 
                href="tel:+254713490535" 
                className="hidden sm:flex items-center gap-1 hover:text-primary-200 transition-colors whitespace-nowrap"
              >
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">+254 713 490 535</span>
              </a>
              <a 
                href="mailto:info@damonmusicacademy.co.ke" 
                className="flex items-center gap-1 hover:text-primary-200 transition-colors whitespace-nowrap"
              >
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden md:inline text-sm">info@damonmusicacademy.co.ke</span>
                <span className="md:hidden text-xs">Email Us</span>
              </a>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Login/Enroll Buttons */}
              <div className="flex items-center gap-1 lg:hidden">
                <Link 
                  to="/auth"
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/20 hover:bg-white/30 transition-colors text-white whitespace-nowrap"
                >
                  Login
                </Link>
                <Link 
                  to="/registration"
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-500 hover:bg-orange-600 transition-colors text-white whitespace-nowrap"
                >
                  Enroll
                </Link>
              </div>
              
              {/* Desktop Quick Actions */}
              <div className="hidden lg:flex items-center gap-2 sm:gap-3">
                <a 
                  href="https://wa.me/254701195460" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="h-3 w-3 flex-shrink-0" />
                  <span>WhatsApp</span>
                </a>
                <a 
                  href="https://maps.app.goo.gl/XGZaDXxaEbkdMLGj8" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary-200 transition-colors text-xs whitespace-nowrap"
                >
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span>Olive Inn, Nakuru</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          {/* Logo - Updated with new logo */}
          <Link to="/" className="flex items-center group flex-shrink-0">
            <img alt="Damon Music Academy Logo" src="/damon-logo.png" className="h-8 sm:h-10 md:h-14 object-contain transition-transform duration-300 group-hover:scale-105 cursor-pointer" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map(item => (
              <Link 
                key={item.name} 
                to={item.href} 
                className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary ${location.pathname === item.href ? "bg-primary/10 text-primary" : "text-gray-700 hover:text-primary"}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary hover:text-white text-xs">
              <Link to="/auth">Login</Link>
            </Button>
            <Button size="sm" asChild className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-200 text-xs">
              <Link to="/registration">Enroll Now</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors ml-2 flex-shrink-0" aria-label="Toggle menu">
            {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && <div className="lg:hidden py-3 sm:py-4 border-t border-gray-200 bg-white/95 backdrop-blur-md max-h-[calc(100vh-180px)] overflow-y-auto">
            <nav className="flex flex-col space-y-1">
              {navigation.map(item => (
                <Link 
                  key={item.name} 
                  to={item.href} 
                  onClick={() => setIsMenuOpen(false)} 
                  className={`px-4 py-2 sm:py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.href ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-100 hover:text-primary"}`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-3 sm:pt-4 border-t border-gray-200">
                <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary hover:text-white text-sm w-full justify-center">
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Login</Link>
                </Button>
                <Button size="sm" asChild className="bg-orange-500 hover:bg-orange-600 text-white text-sm w-full justify-center">
                  <Link to="/registration" onClick={() => setIsMenuOpen(false)}>Enroll Now</Link>
                </Button>
              </div>
            </nav>
          </div>}
      </div>
    </header>
  );
};

export default Header;