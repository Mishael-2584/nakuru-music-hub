import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
const Footer = () => {
  return <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="group">
              <div className="bg-white rounded-md p-2 inline-block transition-transform duration-300 group-hover:scale-105 cursor-pointer">
                <img src="/damon-logo.png" alt="Damon Music Academy Logo" className="h-12 object-contain" />
              </div>
            </Link>
            <p className="text-gray-300 leading-relaxed">
              Since 2016, we've been nurturing musical talent and creativity in Nakuru. Join our community of passionate musicians and artists where no one leaves the same way they came.
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
                  <a href="https://maps.app.goo.gl/XGZaDXxaEbkdMLGj8" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
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
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-1" />
                <div className="text-gray-300">
                  <p className="text-sm font-medium">Academy Hours:</p>
                  <p className="text-sm">Sun: 8am-6pm | Mon-Fri: 7am-6pm</p>
                  <p className="text-sm mt-2 font-medium">Home Lessons:</p>
                  <p className="text-sm">Mon-Fri: 9am-6pm</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <h5 className="font-semibold mb-3">Follow Us</h5>
              <div className="flex gap-3">
                <a href="https://www.facebook.com/DamonMusicAcademy/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://www.youtube.com/channel/UCBwFLi3WFpddfQRV7S6GFiw" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors">
                  <Youtube className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 Damon Music Academy. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="#" className="text-gray-400 hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="#" className="text-gray-400 hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="#" className="text-gray-400 hover:text-primary transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;