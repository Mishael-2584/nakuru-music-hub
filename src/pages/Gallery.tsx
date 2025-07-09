import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Camera, Facebook, Instagram, Youtube, ExternalLink } from "lucide-react";
import WhatsAppChat from "@/components/WhatsAppChat";
import DynamicGallery from "@/components/Gallery";

const GalleryPage = () => {
  return (
    <div className="bg-gray-50">
      <Header />
      
      <main className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-2 px-4 rounded-full text-sm mb-4">
              <Camera className="w-5 h-5" />
              Our Gallery
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Moments from Our Creative Journey
            </h1>
            <p className="max-w-3xl mx-auto text-base md:text-lg text-gray-600">
              Explore the vibrant life at Damon Music Academy. A collection of our students' performances, classes, and special moments.
            </p>
          </div>

          {/* Dynamic Gallery Component */}
          <DynamicGallery />

          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Want to see more?</h3>
            <p className="text-gray-600 mb-8">Follow us on social media for the latest updates, photos, and videos!</p>
            
            {/* Social Media Icons */}
            <div className="flex justify-center items-center gap-6">
              {/* Facebook */}
              <a
                href="https://www.facebook.com/DamonMusicAcademy"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow hover:bg-blue-50 transition-colors duration-300"
              >
                <Facebook className="w-6 h-6 text-white" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300">Facebook</span>
              </a>

              {/* YouTube */}
              <a
                href="https://www.youtube.com/@damonmusicacademy5432"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow hover:bg-red-50 transition-colors duration-300"
              >
                <Youtube className="w-6 h-6 text-white" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors duration-300">YouTube</span>
              </a>

              {/* Instagram */}
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors duration-300">Instagram</span>
                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-purple-600 transition-colors duration-300" />
              </a>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              Stay connected for exclusive behind-the-scenes content, student performances, and academy updates!
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
      <WhatsAppChat />
    </div>
  );
};

export default GalleryPage;
