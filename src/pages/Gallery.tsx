import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Camera, Facebook, Instagram, Youtube, ExternalLink } from "lucide-react";
import WhatsAppChat from "@/components/WhatsAppChat";
import DynamicGallery from "@/components/Gallery";

const GalleryPage = () => {
  return (
    <div className="bg-gray-50">
      <Header />
      
      <main className="pt-32 lg:pt-36 pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-2 px-4 rounded-full text-sm mb-4">
              <Camera className="w-5 h-5" />
              Our Gallery
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
              Moments from Our Creative Journey
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600">
              Explore the vibrant life at Damon Music Academy. A collection of our students' performances, classes, and special moments.
            </p>
          </div>

          {/* Dynamic Gallery Component */}
          <DynamicGallery />

          <div className="text-center mt-16">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Follow Our Journey</h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Stay connected with Damon Music Academy on social media for daily updates, behind-the-scenes content, and student highlights.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                <a 
                  href="https://www.facebook.com/damonmusicacademy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-colors duration-200"
                >
                  <Facebook className="w-5 h-5" />
                  <span>Facebook</span>
                </a>
                
                <a 
                  href="https://www.instagram.com/damonmusicacademy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full transition-colors duration-200"
                >
                  <Instagram className="w-5 h-5" />
                  <span>Instagram</span>
                </a>
                
                <a 
                  href="https://www.youtube.com/@damonmusicacademy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full transition-colors duration-200"
                >
                  <Youtube className="w-5 h-5" />
                  <span>YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <WhatsAppChat />
    </div>
  );
};

export default GalleryPage;
