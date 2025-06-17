
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const GalleryCarousel = () => {
  const galleryImages = [
    {
      src: "/lovable-uploads/29861c9f-1df3-42f1-982f-ef38574fb617.png",
      alt: "Young student singing with professional microphone",
      title: "Vocal Training Excellence",
      description: "Professional vocal coaching in our state-of-the-art studios"
    },
    {
      src: "/lovable-uploads/cc2f7a6b-1ce1-4921-a0b6-b29db99b5d4a.png",
      alt: "Students learning violin in class",
      title: "String Instruments Mastery",
      description: "Expert instruction in violin, guitar, and other string instruments"
    },
    {
      src: "/lovable-uploads/31a53eab-3aed-45c3-b91e-339ed5bb7893.png",
      alt: "Professional recording studio setup",
      title: "Professional Recording Studio",
      description: "Industry-standard equipment for recording and music production"
    },
    {
      src: "/lovable-uploads/70f23f35-6eb2-49a1-8bf6-677fe0c49746.png",
      alt: "Damon Music Academy promotional poster",
      title: "Comprehensive Programs",
      description: "Music, art, and production courses for all skill levels"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [galleryImages.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === galleryImages.length - 1 ? 0 : currentIndex + 1);
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-accent/5 via-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Our Musical Journey
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the vibrant atmosphere of Damon Music Academy through moments captured in our studios and classrooms
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <Card className="overflow-hidden shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-0 relative">
              <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden">
                <img
                  src={galleryImages[currentIndex].src}
                  alt={galleryImages[currentIndex].alt}
                  className="w-full h-full object-cover transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 text-white">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">{galleryImages[currentIndex].title}</h3>
                  <p className="text-lg sm:text-xl md:text-2xl text-white/90">{galleryImages[currentIndex].description}</p>
                </div>

                {/* Navigation buttons */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-0"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-0"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dots indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {galleryImages.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-primary' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>

        <div className="text-center mt-12 sm:mt-16">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-muted-foreground">Live at Damon Music Academy</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GalleryCarousel;
