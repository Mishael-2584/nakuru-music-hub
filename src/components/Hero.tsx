
import { Button } from "@/components/ui/button";
import { Music, Star, Users, Trophy, Heart } from "lucide-react";

const Hero = () => {
  const scrollToRegistration = () => {
    const element = document.getElementById('registration');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 md:w-60 md:h-60 bg-primary/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 right-10 w-32 h-32 md:w-48 md:h-48 bg-accent/10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/4 w-24 h-24 md:w-36 md:h-36 bg-secondary/10 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-20 h-20 md:w-28 md:h-28 bg-primary/5 rounded-full animate-pulse delay-3000"></div>
      </div>

      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20 lg:py-24 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Icon with animation */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="relative">
              <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-r from-primary to-accent rounded-full shadow-2xl animate-scale-in">
                <Music className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-white" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Main heading with responsive text sizes */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-fade-in">
              DAMON MUSIC ACADEMY
            </span>
          </h1>

          {/* Improved responsive tagline */}
          <div className="mb-6 sm:mb-8 md:mb-10">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-muted-foreground animate-fade-in delay-200">
              <span className="block sm:inline">WHERE WORDS FAIL,</span>
              <span className="block sm:inline sm:ml-2">MUSIC SPEAKS</span>
            </p>
          </div>

          {/* Description with better tablet spacing */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in delay-400 px-2">
            Discover your musical potential in the heart of Nakuru, Kenya. 
            Join our passionate community of musicians and let your creativity soar.
          </p>

          {/* Enhanced stats section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
              <div className="text-xl md:text-2xl lg:text-3xl font-bold text-primary">500+</div>
              <div className="text-xs md:text-sm text-muted-foreground">Students</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Trophy className="h-6 w-6 md:h-8 md:w-8 text-accent mx-auto mb-2" />
              <div className="text-xl md:text-2xl lg:text-3xl font-bold text-accent">10+</div>
              <div className="text-xs md:text-sm text-muted-foreground">Years</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Music className="h-6 w-6 md:h-8 md:w-8 text-secondary mx-auto mb-2" />
              <div className="text-xl md:text-2xl lg:text-3xl font-bold text-secondary">15+</div>
              <div className="text-xs md:text-sm text-muted-foreground">Instruments</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Heart className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
              <div className="text-xl md:text-2xl lg:text-3xl font-bold text-primary">100%</div>
              <div className="text-xs md:text-sm text-muted-foreground">Passion</div>
            </div>
          </div>

          {/* Enhanced CTA buttons with better responsive spacing */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center animate-fade-in delay-600">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold py-4 px-8 md:px-12 text-base md:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              onClick={scrollToRegistration}
            >
              Start Your Musical Journey
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="w-full sm:w-auto border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold py-4 px-8 md:px-12 text-base md:text-lg transition-all duration-300 hover:scale-105"
              onClick={() => {
                const element = document.getElementById('courses');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Explore Courses
            </Button>
          </div>

          {/* Enhanced trust indicators */}
          <div className="mt-12 sm:mt-16 md:mt-20">
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">Trusted by musicians across Kenya</p>
            <div className="flex justify-center items-center space-x-2 md:space-x-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 md:h-6 md:w-6 text-yellow-400 fill-current animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
              ))}
              <span className="ml-2 md:ml-4 text-sm md:text-base text-muted-foreground font-medium">4.9/5 from 200+ reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating musical notes animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-4xl text-primary/20 animate-bounce" style={{ animationDelay: '1s' }}>♪</div>
        <div className="absolute top-40 right-20 text-3xl text-accent/20 animate-bounce" style={{ animationDelay: '2s' }}>♫</div>
        <div className="absolute bottom-40 left-20 text-2xl text-secondary/20 animate-bounce" style={{ animationDelay: '3s' }}>♪</div>
        <div className="absolute bottom-20 right-10 text-5xl text-primary/20 animate-bounce" style={{ animationDelay: '4s' }}>♫</div>
      </div>
    </section>
  );
};

export default Hero;
