
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import QuoteForm from "@/components/QuoteForm";
import { Quote } from "lucide-react";
import WhatsAppChat from "@/components/WhatsAppChat";

const services = [
  {
    title: "Live Sound & Lighting",
    image: "/lovable-uploads/livesound.webp",
    description: "High-quality sound reinforcement and dynamic lighting for events. Clear, powerful audio and atmospheric lighting for concerts, church services, conferences, and weddings.",
    color: "from-primary to-accent",
    category: "live-sound-lighting"
  },
  {
    title: "Livestreaming Services",
    image: "/lovable-uploads/livestreaming.jpg",
    description: "Broadcast events live globally with multi-camera setup and clear audio.",
    color: "from-accent to-secondary",
    category: "livestreaming"
  },
  {
    title: "Event Coverage",
    image: "/lovable-uploads/eventcoverage.jpg",
    description: "Comprehensive photo and video coverage for weddings, birthdays, graduations, church, and corporate events.",
    color: "from-secondary to-primary",
    category: "event-coverage"
  },
  {
    title: "Photography Services",
    image: "/lovable-uploads/photography.webp",
    description: "Professional photography for events, portraits, branding, schools, and product marketing.",
    color: "from-pink-400 to-yellow-400",
    category: "photography"
  },
  {
    title: "Songwriting",
    image: "/lovable-uploads/songwriting.webp",
    description: "Professional songwriting services for artists, bands, and commercial projects. From concept to finished song.",
    color: "from-orange-400 to-red-400",
    category: "songwriting"
  },
  {
    title: "Studio Recording & Production",
    image: "/lovable-uploads/studiorecording.jpg",
    description: "Record vocals, instruments, podcasts, choirs, and voice-overs in a professional studio with expert support.",
    color: "from-green-400 to-blue-400",
    category: "studio-recording"
  },
  {
    title: "Audio Mixing & Mastering",
    image: "/lovable-uploads/mixingmastering.webp",
    description: "Polish recordings with industry-standard mixing and mastering for a clean, balanced, and commercial sound.",
    color: "from-yellow-500 to-red-500",
    category: "audio-mixing"
  },
  {
    title: "Voice-over Production",
    image: "/lovable-uploads/voiceover.jpg",
    description: "Voice-over services for commercials, documentaries, audiobooks, and YouTube content, recorded and edited.",
    color: "from-pink-500 to-purple-500",
    category: "voice-over"
  },
  {
    title: "Podcast Production",
    image: "/lovable-uploads/podcast.jpg",
    description: "End-to-end podcast creation: recording, editing, sound design, and publishing.",
    color: "from-green-500 to-blue-500",
    category: "podcast"
  },
  {
    title: "Live Feed Services",
    image: "/lovable-uploads/livefeed.png",
    description: "Real-time video feed for projecting visuals to large screens at weddings, church services, and conferences.",
    color: "from-blue-400 to-green-400",
    category: "live-feed"
  },
  {
    title: "Stage Lighting Setup",
    image: "/lovable-uploads/stageandlighting.png",
    description: "Dynamic stage lighting to match event atmosphere for performances, worship, and ceremonies.",
    color: "from-yellow-400 to-pink-400",
    category: "stage-lighting"
  },
  {
    title: "LED Screen Rental",
    image: "/lovable-uploads/ledscreen.jpg",
    description: "High-resolution LED display screens for lyrics, visuals, presentations, and advertisements.",
    color: "from-purple-400 to-blue-400",
    category: "led-screen"
  },
  {
    title: "Rehearsal Space Rental",
    image: "/lovable-uploads/piano.jpg",
    description: "Spacious, acoustically treated rooms for choirs, bands, solo artists, or production prep.",
    color: "from-green-400 to-yellow-400",
    category: "rehearsal-space"
  },
  {
    title: "Music Production for Artists",
    image: "/lovable-uploads/29861c9f-1df3-42f1-982f-ef38574fb617.png",
    description: "From beat creation to full track arrangement and mastering, bringing artists' sound to life.",
    color: "from-pink-500 to-blue-500",
    category: "music-production"
  },
  {
    title: "DJ & MC Services",
    image: "/lovable-uploads/Dj.webp",
    description: "Professional DJ and MC services to energize weddings, parties, or corporate events.",
    color: "from-yellow-500 to-red-500",
    category: "dj-mc"
  },
  {
    title: "Music Arrangement & Transcription",
    image: "/lovable-uploads/musicarrangement.webp",
    description: "Custom arrangements and accurate transcription for choirs, instrumentalists, or original songs.",
    color: "from-blue-400 to-green-400",
    category: "music-arrangement"
  },
  {
    title: "Music Composition Services",
    image: "/lovable-uploads/musiccomposition.jpg",
    description: "Original music composition for film, theatre, choirs, adverts, or personal projects.",
    color: "from-purple-400 to-yellow-400",
    category: "music-composition"
  },
  {
    title: "Session & Event Musicians",
    image: "/lovable-uploads/guitar.jpg",
    description: "Skilled musicians for recordings or live performances, from soloists to full bands, for weddings, worship, studio sessions, and special events.",
    color: "from-green-500 to-blue-500",
    category: "session-musicians"
  }
];

const ServicesPage = () => {
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("");

  const handleGetQuote = (serviceCategory: string) => {
    setSelectedService(serviceCategory);
    setIsQuoteFormOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-24 sm:pt-28 lg:pt-32 py-16 sm:py-20 bg-gradient-to-br from-secondary/5 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Our Services
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Complete Production and Creative Solutions for Every Vision and Event.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-xl overflow-hidden bg-gray-50 hover:-translate-y-2 flex flex-col">
                <div className="relative overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className={`absolute top-4 right-4 p-2 bg-gradient-to-r ${service.color} rounded-lg shadow-lg`}>
                  </div>
                </div>
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{service.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                  </div>
                  <div className="mt-6">
                    <Button 
                      onClick={() => handleGetQuote(service.category)}
                      className="w-full bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
                    >
                      <Quote className="w-4 h-4" />
                      Get Quote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <QuoteForm 
        isOpen={isQuoteFormOpen}
        onClose={() => setIsQuoteFormOpen(false)}
        selectedService={selectedService}
      />
      <WhatsAppChat />
      <Footer />
    </div>
  );
};

export default ServicesPage;
