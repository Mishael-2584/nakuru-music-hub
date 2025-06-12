
import { Music, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary rounded-full">
              <Music className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">DAMON MUSIC ACADEMY</h1>
              <p className="text-sm opacity-90">WHERE WORDS FAIL, MUSIC SPEAKS</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#home" className="hover:text-secondary transition-colors">Home</a>
            <a href="#courses" className="hover:text-secondary transition-colors">Courses</a>
            <a href="#about" className="hover:text-secondary transition-colors">About</a>
            <a href="#contact" className="hover:text-secondary transition-colors">Contact</a>
            <Button variant="secondary" className="ml-4">
              Register Now
            </Button>
          </nav>

          <div className="flex md:hidden items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span className="text-sm">0701 195 460</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
