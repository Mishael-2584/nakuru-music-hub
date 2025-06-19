
import { useState, useEffect } from "react";
import { Menu, X, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Courses", href: "/courses" },
    { name: "Services", href: "/services" },
    { name: "Events", href: "/events" },
    { name: "News", href: "/news" },
    { name: "Gallery", href: "/gallery" },
    { name: "Fees", href: "/fees" },
  ];

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? "bg-white/95 backdrop-blur-md shadow-lg" 
        : "bg-white/90 backdrop-blur-sm"
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Updated with new logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <img 
                src="/lovable-uploads/bda126b8-9e86-4564-9832-173ce818d676.png" 
                alt="Damon Music Academy Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Damon Music Academy
              </h1>
              <p className="text-xs text-muted-foreground">Excellence in Music Education</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary ${
                  location.pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:text-primary"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Link to="/auth">Login</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-200"
            >
              <Link to="/#registration">Enroll Now</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100 hover:text-primary"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                >
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Login</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-gradient-to-r from-primary to-accent text-white"
                >
                  <Link to="/#registration" onClick={() => setIsMenuOpen(false)}>Enroll Now</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
