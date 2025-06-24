import { Card, CardContent } from "@/components/ui/card";
import { Music, Video, Speaker, Mic, Film } from "lucide-react";
import { useState, useEffect } from "react";

const services = [
  {
    // icon: Music,
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80", // Live Sound
    title: "Live Sound & PA System",
    description: "High-quality sound reinforcement for events of all sizes. Crystal clear audio for concerts, conferences, and weddings.",
    color: "from-primary to-accent"
  },
  {
    // icon: Video,
    image: "/lovable-uploads/livestreaming.jpg", // Livestreaming
    title: "Livestreaming Services",
    description: "Broadcast your event to a global audience with our professional multi-camera livestreaming setup.",
    color: "from-accent to-secondary"
  },
  {
    // icon: Speaker,
    image: "/lovable-uploads/eventcoverage.jpg", // Event Coverage
    title: "Event Coverage",
    description: "Comprehensive photo and video coverage to capture every important moment of your event.",
    color: "from-secondary to-primary"
  },
  {
    // icon: Mic,
    image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80", // Podcast
    title: "Podcast & Voice-Over Recording",
    description: "Professional recording and production services for podcasts, audiobooks, and commercials.",
    color: "from-primary to-secondary"
  },
  {
    // icon: Film,
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80", // Commercials
    title: "Commercials & Adverts",
    description: "Creative and compelling video commercials to promote your brand, product, or service.",
    color: "from-accent to-primary"
  }
];

const Services = () => {
  return (
    <section id="services" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-xl overflow-hidden bg-gray-50 hover:-translate-y-2">
              <div className="relative overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" 
                />
                <div className={`absolute top-4 right-4 p-2 bg-gradient-to-r ${service.color} rounded-lg shadow-lg`}>
                  {/* <service.icon className="h-6 w-6 text-white" /> */}
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3 text-gray-900">{service.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <a 
            href="/services" 
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            View All Services
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export const ServicesCarousel = () => {
  const [index, setIndex] = useState(0);
  const total = services.length;
  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);
  const service = services[index];

  // Auto-advance every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, 5000);
    return () => clearInterval(interval);
  }, [total]);

  return (
    <section id="services-carousel" className="py-16 md:py-24 bg-white mt-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Our Professional Services
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Beyond education, we offer a suite of professional creative services to bring your vision to life.
          </p>
        </div>
        <div className="relative bg-gray-50 rounded-xl shadow-lg p-8 flex flex-col items-center">
          <img 
            src={service.image} 
            alt={service.title} 
            className="w-full h-64 object-cover rounded-lg shadow-md mb-6 transition-all duration-500 ease-in-out hover:scale-105" 
          />
          <h3 className="text-2xl font-bold mb-2 text-gray-900">{service.title}</h3>
          <p className="text-muted-foreground mb-4 text-center">{service.description}</p>
          <div className="flex justify-between w-full mt-4">
            <button 
              onClick={prev} 
              className="px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary/90 transition-colors duration-200"
            >
              Previous
            </button>
            <span className="text-muted-foreground flex items-center">{index + 1} / {total}</span>
            <button 
              onClick={next} 
              className="px-4 py-2 bg-accent text-white rounded-lg shadow hover:bg-accent/90 transition-colors duration-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
