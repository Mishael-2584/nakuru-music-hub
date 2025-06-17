
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

const Gallery = () => {
  const galleryImages = [
    {
      src: "/lovable-uploads/29861c9f-1df3-42f1-982f-ef38574fb617.png",
      alt: "Young student singing with professional microphone",
      title: "Vocal Training Excellence",
      category: "Vocal Training"
    },
    {
      src: "/lovable-uploads/cc2f7a6b-1ce1-4921-a0b6-b29db99b5d4a.png",
      alt: "Students learning violin in class",
      title: "String Instruments Mastery",
      category: "Instruments"
    },
    {
      src: "/lovable-uploads/31a53eab-3aed-45c3-b91e-339ed5bb7893.png",
      alt: "Professional recording studio setup",
      title: "Professional Recording Studio",
      category: "Production"
    },
    {
      src: "/lovable-uploads/70f23f35-6eb2-49a1-8bf6-677fe0c49746.png",
      alt: "Damon Music Academy promotional poster",
      title: "Academy Programs",
      category: "General"
    }
  ];

  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", "Vocal Training", "Instruments", "Production", "General"];

  const filteredImages = selectedCategory === "All" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Academy Gallery
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Glimpses of musical excellence and creative moments at Damon Music Academy
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                    : 'bg-white/80 text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredImages.map((image, index) => (
              <Card key={index} className="group overflow-hidden shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <CardContent className="p-0">
                  <div className="relative overflow-hidden aspect-[4/3]">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-xl font-bold mb-2">{image.title}</h3>
                      <span className="text-sm bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        {image.category}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No images found for this category.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Gallery;
