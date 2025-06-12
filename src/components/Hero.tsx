
import { Button } from "@/components/ui/button";
import { Music, Users, Award } from "lucide-react";

const Hero = () => {
  return (
    <section id="home" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 gradient-primary opacity-10"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight">
              Where Words Fail,
              <span className="text-primary block">Music Speaks</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Discover your musical potential at Damon Music Academy. We offer comprehensive 
              music education for students aged 3 years and above in Nakuru, Kenya.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start Your Journey
              </Button>
              <Button size="lg" variant="outline">
                View Courses
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">500+ Students</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Expert Instructors</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">10+ Instruments</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-square relative">
              <img 
                src="/lovable-uploads/40fee785-03dc-4548-8e48-b09291ee8f42.png"
                alt="Damon Music Academy Students"
                className="w-full h-full object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
