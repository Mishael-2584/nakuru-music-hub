
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-primary/10 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-primary to-accent rounded-full">
              <Music className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Damon Music Academy</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-gray-700 hover:text-primary transition-colors ${
                isActive('/') ? 'text-primary font-semibold' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`text-gray-700 hover:text-primary transition-colors ${
                isActive('/about') ? 'text-primary font-semibold' : ''
              }`}
            >
              About
            </Link>
            <Link
              to="/courses"
              className={`text-gray-700 hover:text-primary transition-colors ${
                isActive('/courses') ? 'text-primary font-semibold' : ''
              }`}
            >
              Courses
            </Link>
            <Link
              to="/services"
              className={`text-gray-700 hover:text-primary transition-colors ${
                isActive('/services') ? 'text-primary font-semibold' : ''
              }`}
            >
              Services
            </Link>
            <Link
              to="/fees"
              className={`text-gray-700 hover:text-primary transition-colors ${
                isActive('/fees') ? 'text-primary font-semibold' : ''
              }`}
            >
              Fees
            </Link>
            <Link
              to="/events"
              className={`text-gray-700 hover:text-primary transition-colors ${
                isActive('/events') ? 'text-primary font-semibold' : ''
              }`}
            >
              Events
            </Link>
            <Link
              to="/news"
              className={`text-gray-700 hover:text-primary transition-colors ${
                isActive('/news') ? 'text-primary font-semibold' : ''
              }`}
            >
              News
            </Link>
            <Link
              to="/gallery"
              className={`text-gray-700 hover:text-primary transition-colors ${
                isActive('/gallery') ? 'text-primary font-semibold' : ''
              }`}
            >
              Gallery
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-gray-700 hover:text-primary transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-primary/10">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className={`text-gray-700 hover:text-primary transition-colors ${
                  isActive('/') ? 'text-primary font-semibold' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`text-gray-700 hover:text-primary transition-colors ${
                  isActive('/about') ? 'text-primary font-semibold' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/courses"
                className={`text-gray-700 hover:text-primary transition-colors ${
                  isActive('/courses') ? 'text-primary font-semibold' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Courses
              </Link>
              <Link
                to="/services"
                className={`text-gray-700 hover:text-primary transition-colors ${
                  isActive('/services') ? 'text-primary font-semibold' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                to="/fees"
                className={`text-gray-700 hover:text-primary transition-colors ${
                  isActive('/fees') ? 'text-primary font-semibold' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Fees
              </Link>
              <Link
                to="/events"
                className={`text-gray-700 hover:text-primary transition-colors ${
                  isActive('/events') ? 'text-primary font-semibold' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Events
              </Link>
              <Link
                to="/news"
                className={`text-gray-700 hover:text-primary transition-colors ${
                  isActive('/news') ? 'text-primary font-semibold' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                News
              </Link>
              <Link
                to="/gallery"
                className={`text-gray-700 hover:text-primary transition-colors ${
                  isActive('/gallery') ? 'text-primary font-semibold' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Gallery
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
