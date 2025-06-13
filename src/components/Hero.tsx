import { Button } from "@/components/ui/button";
import { Music, Users, Award, Play, ArrowRight } from "lucide-react";
const Hero = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  return <section id="home" className="relative py-20 overflow-hidden min-h-screen flex items-center">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            {/* Musical note decoration */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex gap-2">
                <div className="w-4 h-4 bg-primary rounded-full animate-bounce"></div>
                <div className="w-4 h-4 bg-accent rounded-full animate-bounce delay-100"></div>
                <div className="w-4 h-4 bg-secondary rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Nakuru's Premier Music Academy</span>
            </div>
            
            <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Where Words Fail,
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-gradient">
                Music Speaks
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Discover your musical potential at Damon Music Academy. We offer comprehensive 
              music education for students aged 3 years and above in Nakuru, Kenya.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group" onClick={() => scrollToSection('registration')}>
                <Play className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                Start Your Journey
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 backdrop-blur-sm transition-all duration-300" onClick={() => scrollToSection('courses')}>
                <Music className="h-5 w-5 mr-2" />
                View Courses
              </Button>
            </div>
            
            {/* Stats with enhanced design */}
            <div className="flex items-center gap-8 pt-8">
              <div className="flex items-center gap-3 group">
                <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-primary">100+</span>
                  <p className="text-sm font-medium text-muted-foreground">Students</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 group">
                <div className="p-3 bg-accent/10 rounded-full group-hover:bg-accent/20 transition-colors">
                  <Award className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-accent">15+</span>
                  <p className="text-sm font-medium text-muted-foreground">Expert Instructors</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 group">
                <div className="p-3 bg-secondary/10 rounded-full group-hover:bg-secondary/20 transition-colors">
                  <Music className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-secondary">10+</span>
                  <p className="text-sm font-medium text-muted-foreground">Instruments</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative lg:justify-self-end">
            <div className="relative group">
              {/* Floating elements around the image */}
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center shadow-lg animate-float">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-4 -right-8 w-16 h-16 bg-gradient-to-r from-accent to-secondary rounded-full flex items-center justify-center shadow-lg animate-float delay-1000">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -bottom-6 -left-8 w-14 h-14 bg-gradient-to-r from-secondary to-primary rounded-full flex items-center justify-center shadow-lg animate-float delay-2000">
                <Award className="h-7 w-7 text-white" />
              </div>
              
              {/* Main image with enhanced styling */}
              <div className="aspect-square relative overflow-hidden rounded-3xl shadow-2xl group-hover:shadow-3xl transition-shadow duration-500">
                <img src="/lovable-uploads/40fee785-03dc-4548-8e48-b09291ee8f42.png" alt="Damon Music Academy Students" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-accent/20 group-hover:from-primary/40 group-hover:to-accent/30 transition-all duration-500"></div>
                
                {/* Overlay content */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                    <p className="text-sm font-semibold text-primary mb-1">🎵 Join Our Musical Family</p>
                    <p className="text-xs text-muted-foreground">Experience the joy of learning music in our vibrant community</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Musical wave decoration at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/50 to-transparent"></div>
      <svg className="absolute bottom-0 left-0 right-0" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,60 C300,100 600,20 900,60 C1050,80 1150,40 1200,60 L1200,120 L0,120 Z" fill="white" opacity="0.8" />
      </svg>
    </section>;
};
export default Hero;