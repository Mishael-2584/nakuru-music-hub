
import Header from "@/components/Header";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";

const GalleryPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="py-20 bg-gradient-to-br from-pink-900/20 via-rose-900/20 to-red-900/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/lovable-uploads/29861c9f-1df3-42f1-982f-ef38574fb617.png')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-rose-500 to-red-500 bg-clip-text text-transparent">
              Our Gallery
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Capturing moments of musical excellence and student achievements
            </p>
          </div>
        </div>
      </section>

      <Gallery />
      
      <Footer />
    </div>
  );
};

export default GalleryPage;
