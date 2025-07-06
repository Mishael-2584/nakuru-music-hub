
import { Card, CardContent } from "@/components/ui/card";

const Gallery = () => {
  const galleryImages = [
    {
      src: "/lovable-uploads/29861c9f-1df3-42f1-982f-ef38574fb617.png",
      alt: "Young student singing with professional microphone",
      title: "Vocal Training"
    },
    {
      src: "/lovable-uploads/cc2f7a6b-1ce1-4921-a0b6-b29db99b5d4a.png",
      alt: "Students learning violin in class",
      title: "String Instruments"
    },
    {
      src: "/lovable-uploads/31a53eab-3aed-45c3-b91e-339ed5bb7893.png",
      alt: "Professional recording studio setup",
      title: "Recording Studio"
    }
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {galleryImages.map((image, index) => (
            <Card 
              key={index} 
              className="group overflow-hidden shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:scale-105"
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-64 sm:h-72 lg:h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-bold text-lg sm:text-xl mb-2">{image.title}</h3>
                    <p className="text-white/90 text-sm sm:text-base">{image.alt}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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

export default Gallery;
