
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Music, Guitar, Headphones, Mic, Piano, Wind, Volume2, BookOpen, Monitor, Zap } from "lucide-react";
import { useState } from "react";
import React from "react";

const courses = [
  {
    icon: Piano,
    name: "Piano",
    description: "Master the keys with our comprehensive piano and keyboard lessons",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-primary to-accent",
    popular: true,
    category: "Instruments",
    details: {
      overview: "Comprehensive piano instruction covering classical, jazz, and contemporary styles",
      skills: ["Sight reading", "Music theory", "Performance techniques", "Composition basics"],
      requirements: "No prior experience needed",
      equipment: "Pianos available at our facility",
      schedule: "Flexible scheduling available"
    }
  },
  {
    icon: Guitar,
    name: "Guitar",
    description: "Learn acoustic and electric guitar from beginner to advanced",
    level: "All Levels", 
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-accent to-secondary",
    category: "Instruments",
    details: {
      overview: "Learn acoustic and electric guitar with personalized instruction",
      skills: ["Chord progressions", "Fingerpicking", "Strumming techniques", "Music theory"],
      requirements: "No prior experience needed",
      equipment: "Guitars available for practice",
      schedule: "Flexible scheduling available"
    }
  },
  {
    icon: Mic,
    name: "Voice Training",
    description: "Develop your vocal skills with professional voice coaching",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-secondary to-primary",
    category: "Vocal",
    details: {
      overview: "Professional voice training for singers of all levels",
      skills: ["Vocal technique", "Breath control", "Performance skills", "Stage presence"],
      requirements: "No prior experience needed",
      equipment: "Professional recording equipment available",
      schedule: "Flexible scheduling available"
    }
  },
  {
    icon: Volume2,
    name: "Violin",
    description: "Classical and contemporary violin instruction",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-primary to-secondary",
    category: "Instruments",
    details: {
      overview: "Classical and contemporary violin instruction for all ages",
      skills: ["Bow technique", "Finger placement", "Music theory", "Performance skills"],
      requirements: "No prior experience needed",
      equipment: "Violins available for beginners",
      schedule: "Flexible scheduling available"
    }
  },
  {
    icon: Headphones,
    name: "Saxophone",
    description: "Jazz, classical, and contemporary saxophone lessons",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-accent to-primary",
    category: "Instruments",
    details: {
      overview: "Jazz, classical, and contemporary saxophone instruction",
      skills: ["Embouchure technique", "Breath control", "Jazz improvisation", "Music theory"],
      requirements: "No prior experience needed",
      equipment: "Saxophones available for beginners",
      schedule: "Flexible scheduling available"
    }
  },
  {
    icon: Wind,
    name: "Trumpet & Recorder",
    description: "Brass and wind instrument instruction",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-secondary to-accent",
    category: "Instruments",
    details: {
      overview: "Comprehensive brass and wind instrument instruction",
      skills: ["Embouchure technique", "Breath control", "Music theory", "Performance skills"],
      requirements: "No prior experience needed",
      equipment: "Instruments available for beginners",
      schedule: "Flexible scheduling available"
    }
  },
  {
    icon: BookOpen,
    name: "Music Theory",
    description: "Comprehensive music theory and composition",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-primary to-accent",
    category: "Theory",
    details: {
      overview: "Comprehensive music theory and composition instruction",
      skills: ["Reading music", "Harmony and chord progressions", "Composition", "Ear training"],
      requirements: "No prior experience needed",
      equipment: "Theory materials provided",
      schedule: "Flexible scheduling available"
    }
  },
  {
    icon: Monitor,
    name: "Music Production",
    description: "Learn digital music production, recording, and mixing",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM",
    color: "from-secondary to-primary",
    category: "Production",
    popular: true,
    details: {
      overview: "Comprehensive digital music production course covering recording, mixing, and mastering",
      skills: ["DAW operation (Logic Pro, Ableton)", "Recording techniques", "Mixing and mastering", "Sound design", "Music arrangement", "Digital audio workstations"],
      requirements: "Basic computer skills recommended",
      equipment: "Professional studio equipment and software provided",
      schedule: "Flexible scheduling available",
      software: "Logic Pro, Ableton Live, Pro Tools",
      features: ["Professional studio access", "Industry-standard equipment", "Project-based learning", "Portfolio development"]
    }
  },
  {
    icon: Music,
    name: "Weekend Classes",
    description: "Special weekend sessions for busy schedules",
    level: "All Levels",
    duration: "Sun: From Noon",
    color: "from-accent to-secondary",
    special: true,
    category: "Flexible",
    details: {
      overview: "Special weekend sessions designed for busy professionals and students",
      skills: ["Flexible learning", "Weekend scheduling", "All instrument types", "Theory and practice"],
      requirements: "No prior experience needed",
      equipment: "All instruments available",
      schedule: "Weekend scheduling available"
    }
  }
];

const Courses = () => {
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLearnMore = (course: any) => {
    setSelectedCourse(course);
    setShowModal(true);
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-primary font-semibold text-base shadow-sm border border-primary/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3C7.03 3 3 7.03 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-4.97-4.03-9-9-9zm0 0v18m0-18C7.03 3 3 7.03 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-4.97-4.03-9-9-9z" /></svg>
              Now enrolling students worldwide! Join us online or in-person in Nakuru & Nairobi.
            </span>
          </div>
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
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 group-hover:bg-primary group-hover:text-white transition-all duration-300 border-primary/20"
                    onClick={() => scrollToSection('registration')}
                  >
                    Enroll Now
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="group-hover:bg-accent/10 transition-all duration-300"
                    onClick={() => handleLearnMore(course)}
                  >
                    Learn More
                  </Button>
                </div>
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

      {/* Course Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 bg-gradient-to-r ${selectedCourse?.color} rounded-full`}>
                {selectedCourse?.icon && (
                  <selectedCourse.icon className="h-5 w-5 text-white" />
                )}
              </div>
              {selectedCourse?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCourse && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Course Overview</h3>
                <p className="text-muted-foreground">{selectedCourse.details.overview}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Skills You'll Learn</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedCourse.details.skills.map((skill: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCourse.details.software && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Software & Tools</h3>
                  <p className="text-muted-foreground">{selectedCourse.details.software}</p>
                </div>
              )}

              {selectedCourse.details.features && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Course Features</h3>
                  <div className="space-y-2">
                    {selectedCourse.details.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                  <p className="text-sm text-muted-foreground">{selectedCourse.details.requirements}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Equipment</h3>
                  <p className="text-sm text-muted-foreground">{selectedCourse.details.equipment}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Schedule</h3>
                <p className="text-sm text-muted-foreground">{selectedCourse.details.schedule}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1 bg-gradient-to-r from-primary to-accent"
                  onClick={() => {
                    setShowModal(false);
                    scrollToSection('registration');
                  }}
                >
                  Enroll Now
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Courses;
