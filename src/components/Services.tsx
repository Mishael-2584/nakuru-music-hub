import { Card, CardContent } from "@/components/ui/card";
import { Music, Video, Speaker, Mic, Film } from "lucide-react";

const services = [
  {
    icon: Music,
    title: "Live Sound & PA System",
    description: "High-quality sound reinforcement for events of all sizes. Crystal clear audio for concerts, conferences, and weddings.",
    color: "from-primary to-accent"
  },
  {
    icon: Video,
    title: "Livestreaming Services",
    description: "Broadcast your event to a global audience with our professional multi-camera livestreaming setup.",
    color: "from-accent to-secondary"
  },
  {
    icon: Speaker,
    title: "Event Coverage",
    description: "Comprehensive photo and video coverage to capture every important moment of your event.",
    color: "from-secondary to-primary"
  },
  {
    icon: Mic,
    title: "Podcast & Voice-Over Recording",
    description: "Professional recording and production services for podcasts, audiobooks, and commercials.",
    color: "from-primary to-secondary"
  },
  {
    icon: Film,
    title: "Commercials & Adverts",
    description: "Creative and compelling video commercials to promote your brand, product, or service.",
    color: "from-accent to-primary"
  }
];

const Services = () => {
  return (
    <section id="services" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Our Professional Services
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Beyond education, we offer a suite of professional creative services to bring your vision to life.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-xl overflow-hidden bg-gray-50 hover:-translate-y-2">
              <CardContent className="p-8">
                <div className={`mb-6 p-4 inline-block bg-gradient-to-r ${service.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                  <service.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{service.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
