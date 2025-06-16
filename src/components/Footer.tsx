
import { Music, Phone, Mail, MapPin } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const scrollToSection = (sectionId: string) => {
    // If not on home page, navigate to home first
    if (location.pathname !== '/') {
      navigate('/', {
        replace: true
      });
      // Small delay to ensure page loads before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={handleHomeClick}>
              <div className="p-2 bg-secondary rounded-full">
                <Music className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base">DAMON MUSIC ACADEMY</h3>
                <p className="text-xs opacity-90">WHERE WORDS FAIL, MUSIC SPEAKS</p>
              </div>
            </div>
            <p className="text-sm opacity-80">
              Nurturing musical talent in Nakuru, Kenya. Join us to discover your musical potential.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-sm sm:text-base">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={handleHomeClick} className="hover:text-secondary transition-colors text-left">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('courses')} className="hover:text-secondary transition-colors text-left">
                  Courses
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('about')} className="hover:text-secondary transition-colors text-left">
                  About
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('contact')} className="hover:text-secondary transition-colors text-left">
                  Contact
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-sm sm:text-base">Courses</h4>
            <ul className="space-y-2 text-sm">
              <li>Piano & Keyboard</li>
              <li>Guitar Lessons</li>
              <li>Voice Training</li>
              <li>Violin</li>
              <li>Saxophone</li>
              <li>Music Theory</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-sm sm:text-base">Contact Info</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>0701 195 460</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="break-all">damonmusicacademy@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>Nakuru, Kenya</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-sm opacity-80">
          <p>© 2025 Damon Music Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
