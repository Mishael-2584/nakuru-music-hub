
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <img 
                  src="/lovable-uploads/bda126b8-9e86-4564-9832-173ce818d676.png" 
                  alt="Damon Music Academy Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">Damon Music Academy</h3>
                <p className="text-sm text-gray-400">Excellence in Music Education</p>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Nurturing musical talent and creativity in Nakuru since 2010. Join our community of passionate musicians and artists.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/about" className="block text-gray-300 hover:text-primary transition-colors">About Us</Link>
              <Link to="/courses" className="block text-gray-300 hover:text-primary transition-colors">Courses</Link>
              <Link to="/services" className="block text-gray-300 hover:text-primary transition-colors">Services</Link>
              <Link to="/events" className="block text-gray-300 hover:text-primary transition-colors">Events</Link>
              <Link to="/news" className="block text-gray-300 hover:text-primary transition-colors">News</Link>
              <Link to="/gallery" className="block text-gray-300 hover:text-primary transition-colors">Gallery</Link>
              <Link to="/fees" className="block text-gray-300 hover:text-primary transition-colors">Fees</Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">Nakuru Town, Kenya</p>
                  <a 
                    href="https://maps.app.goo.gl/XGZaDXxaEbkdMLGj8" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    View on Google Maps
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <a href="tel:+254701195460" className="text-gray-300 hover:text-primary transition-colors">
                  +254 701 195 460
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <a href="mailto:info@damonmusicacademy.com" className="text-gray-300 hover:text-primary transition-colors">
                  info@damonmusicacademy.com
                </a>
              </div>
            </div>
          </div>

          {/* Business Hours & Social */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Business Hours</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div className="text-gray-300">
                  <p className="text-sm">Mon - Fri: 9:00 AM - 6:00 PM</p>
                  <p className="text-sm">Sat: 9:00 AM - 4:00 PM</p>
                  <p className="text-sm">Sun: Closed</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <h5 className="font-semibold mb-3">Follow Us</h5>
              <div className="flex gap-3">
                <a 
                  href="https://www.facebook.com/DamonMusicAcademy/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.youtube.com/channel/UCBwFLi3WFpddfQRV7S6GFiw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <Youtube className="h-5 w-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 Damon Music Academy. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="#" className="text-gray-400 hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="#" className="text-gray-400 hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="#" className="text-gray-400 hover:text-primary transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
