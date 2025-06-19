
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Star, Users, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      image: "/lovable-uploads/cc2f7a6b-1ce1-4921-a0b6-b29db99b5d4a.png",
      title: "NAKURU'S PREMIER",
      subtitle: "MUSIC & CREATIVE ARTS HUB",
      description: "Whether you're picking up your first instrument, exploring the strokes of a paintbrush, or diving into professional audio-visual production, Damon Music Academy in Nakuru provides expert guidance and a vibrant community to help your creative talent truly soar.",
      isMain: true
    },
    {
      id: 2,
      image: "/lovable-uploads/SMC02260.png",
      title: "MASTER MUSICAL",
      subtitle: "INSTRUMENTS",
      description: "From piano to guitar, violin to drums - learn from expert instructors who are passionate about sharing their craft.",
      isMain: false
    },
    {
      id: 3,
      image: "/lovable-uploads/31a53eab-3aed-45c3-b91e-339ed5bb7893.png",
      title: "UNLEASH YOUR",
      subtitle: "CREATIVE POTENTIAL",
      description: "Explore music production, digital arts, and creative expression in our modern studios equipped with professional-grade equipment.",
      isMain: false
    },
    {
      id: 4,
      image: "/lovable-uploads/40fee785-03dc-4548-8e48-b09291ee8f42.png",
      title: "JOIN OUR MUSICAL",
      subtitle: "COMMUNITY",
      description: "Connect with fellow musicians, participate in recitals, and be part of Nakuru's most vibrant creative community.",
      isMain: false
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background carousel */}
      <div className="absolute inset-0">
        <div 
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            currentSlide === 0 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${slides[0].image}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        </div>
        
        {slides.slice(1).map((slide, index) => (
          <div 
            key={slide.id}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              currentSlide === index + 1 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Slide indicators */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              currentSlide === index ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl">
          {currentSlideData.isMain && (
            <div className="mb-6 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-white/90 text-sm font-medium">Rated 5.0 by 500+ students</span>
            </div>
          )}
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">{currentSlideData.title}</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              {currentSlideData.subtitle}
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl leading-relaxed">
            {currentSlideData.description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Link to="/courses">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" className="border-2 border-white text-black hover:bg-white hover:text-black font-semibold px-8 py-4 text-lg rounded-full backdrop-blur-sm transition-all duration-300">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          
          {currentSlideData.isMain && (
            <div className="grid grid-cols-3 gap-8 max-w-2xl">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-white/80 text-sm">Active Students</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div className="text-2xl font-bold text-white">15+</div>
                <div className="text-white/80 text-sm">Expert Instructors</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <div className="text-2xl font-bold text-white">10+</div>
                <div className="text-white/80 text-sm">Years of Excellence</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
