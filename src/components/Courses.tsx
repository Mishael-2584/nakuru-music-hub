
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Guitar, Headphones, Mic, Piano, Trumpet, Volume2, BookOpen } from "lucide-react";

const courses = [
  {
    icon: Piano,
    name: "Piano & Keyboard",
    description: "Master the keys with our comprehensive piano and keyboard lessons",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-primary to-accent",
    popular: true
  },
  {
    icon: Guitar,
    name: "Guitar",
    description: "Learn acoustic and electric guitar from beginner to advanced",
    level: "All Levels", 
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-accent to-secondary"
  },
  {
    icon: Mic,
    name: "Voice Training",
    description: "Develop your vocal skills with professional voice coaching",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-secondary to-primary"
  },
  {
    icon: Volume2,
    name: "Violin",
    description: "Classical and contemporary violin instruction",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-primary to-secondary"
  },
  {
    icon: Headphones,
    name: "Saxophone",
    description: "Jazz, classical, and contemporary saxophone lessons",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-accent to-primary"
  },
  {
    icon: Trumpet,
    name: "Trumpet & Recorder",
    description: "Brass and wind instrument instruction",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-secondary to-accent"
  },
  {
    icon: BookOpen,
    name: "Music Theory",
    description: "Comprehensive music theory and composition",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-primary to-accent"
  },
  {
    icon: Music,
    name: "Weekend Classes",
    description: "Special weekend sessions for busy schedules",
    level: "All Levels",
    duration: "Sun: From Noon",
    color: "from-accent to-secondary",
    special: true
  }
];

const Courses = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="courses" className="py-20 bg-gradient-to-br from-muted/30 via-background to-primary/5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-accent/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
              <Music className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Our Courses</span>
          </div>
          
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            We Offer Courses In:
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Comprehensive music education for students aged 3 years and above with expert instruction and modern facilities
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {courses.map((course, index) => (
            <Card key={index} className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm relative overflow-hidden">
              {course.popular && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-accent text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                  Popular
                </div>
              )}
              {course.special && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-secondary to-accent text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                  Flexible
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto p-4 bg-gradient-to-r ${course.color} rounded-full w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg mb-4`}>
                  <course.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {course.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="text-center space-y-4 pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {course.level}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{course.duration}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full group-hover:bg-primary group-hover:text-white transition-all duration-300 border-primary/20"
                  onClick={() => scrollToSection('registration')}
                >
                  Enroll Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-3xl p-8 max-w-md mx-auto backdrop-blur-sm border border-primary/20 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-accent rounded-full animate-pulse delay-100"></div>
                <div className="w-3 h-3 bg-secondary rounded-full animate-pulse delay-200"></div>
              </div>
              
              <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                INTAKE
              </h3>
              <p className="text-xl font-semibold text-foreground">IN PROGRESS</p>
              <p className="text-sm text-muted-foreground">Join our musical family today and start your journey</p>
              
              <Button 
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                onClick={() => scrollToSection('registration')}
              >
                <Music className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                Register Today
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Courses;
