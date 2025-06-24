import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Piano, Guitar, Mic, Drum, Music, Brain, Wind, Volume2, Camera, Video, MonitorPlay, Code, Palette, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const CoursesEnhanced = () => {
  const [openDialog, setOpenDialog] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const courses = [
    // Music Category
    {
      title: "Piano Lessons",
      description: "Master the keys with professional instruction",
      icon: Piano,
      color: "primary",
      category: "Music",
      details: {
        duration: "Individual 45-minute sessions",
        levels: "Beginner to Advanced",
        features: [
          "Classical and contemporary repertoire",
          "Music theory integration",
          "Performance opportunities",
          "Individual practice rooms available",
          "Certified instructors with performance backgrounds"
        ],
        instruments: "Grand pianos, digital pianos, keyboards available",
        schedule: "Monday to Saturday, 9 AM - 6 PM"
      }
    },
    {
      title: "Guitar Lessons",
      description: "Acoustic and electric guitar mastery",
      icon: Guitar,
      color: "accent",
      category: "Music",
      details: {
        duration: "Individual 45-minute sessions",
        levels: "Beginner to Advanced",
        features: [
          "Acoustic and electric guitar instruction",
          "Rock, pop, jazz, and classical styles",
          "Chord progressions and lead guitar",
          "Recording techniques",
          "Guitar maintenance and care"
        ],
        instruments: "Acoustic guitars, electric guitars, amplifiers provided",
        schedule: "Monday to Saturday, 9 AM - 6 PM"
      }
    },
    {
      title: "Voice Training",
      description: "Develop your unique vocal style",
      icon: Mic,
      color: "secondary",
      category: "Music",
      details: {
        duration: "Individual 45-minute sessions",
        levels: "Beginner to Professional",
        features: [
          "Breath control and vocal techniques",
          "Stage presence and performance skills",
          "Microphone techniques",
          "Genre-specific vocal styles",
          "Recording studio sessions included"
        ],
        instruments: "Professional microphones, vocal booths, recording equipment",
        schedule: "Monday to Saturday, 9 AM - 6 PM"
      }
    },
    {
      title: "Drums",
      description: "Keep the rhythm with expert instruction",
      icon: Drum,
      color: "primary",
      category: "Music",
      details: {
        duration: "Individual 45-minute sessions",
        levels: "Beginner to Advanced",
        features: [
          "Complete drum kit instruction",
          "Rock, jazz, Latin rhythms",
          "Hand and foot coordination",
          "Reading drum notation",
          "Play-along with popular songs"
        ],
        instruments: "Acoustic and electronic drum kits available",
        schedule: "Monday to Saturday, 9 AM - 6 PM"
      }
    },
    {
      title: "Violin",
      description: "Classical and contemporary violin techniques",
      icon: Music,
      color: "accent",
      category: "Music",
      details: {
        duration: "Individual 45-minute sessions",
        levels: "Beginner to Advanced",
        features: [
          "Proper bow technique and posture",
          "Classical and modern repertoire",
          "Ensemble playing opportunities",
          "Music theory for strings",
          "Performance preparation"
        ],
        instruments: "Quality violins in various sizes available for rent",
        schedule: "Monday to Saturday, 9 AM - 6 PM"
      }
    },
    {
      title: "Music Theory",
      description: "Understand the language of music",
      icon: Brain,
      color: "secondary",
      category: "Music",
      details: {
        duration: "Group sessions (1 hour) or individual (45 minutes)",
        levels: "Basic to Advanced",
        features: [
          "Note reading and rhythm",
          "Scales, intervals, and chords",
          "Harmonic analysis",
          "Composition techniques",
          "Exam preparation (ABRSM, LCM)"
        ],
        instruments: "Piano, notation software, theory workbooks",
        schedule: "Monday to Friday, 2 PM - 5 PM (Group), Individual times flexible"
      }
    },
    {
      title: "Saxophone",
      description: "Jazz up your musical journey",
      icon: Wind,
      color: "primary",
      category: "Music",
      details: {
        duration: "Individual 45-minute sessions",
        levels: "Beginner to Advanced",
        features: [
          "Alto, tenor, and soprano saxophone",
          "Jazz improvisation techniques",
          "Classical saxophone repertoire",
          "Ensemble playing",
          "Breathing and embouchure techniques"
        ],
        instruments: "Student and professional saxophones available",
        schedule: "Monday to Saturday, 9 AM - 6 PM"
      }
    },
    {
      title: "Trumpet & Brass",
      description: "Master the art of brass instruments",
      icon: Volume2,
      color: "accent",
      category: "Music",
      details: {
        duration: "Individual 45-minute sessions",
        levels: "Beginner to Advanced",
        features: [
          "Trumpet, trombone, and French horn",
          "Classical and jazz techniques",
          "Lip flexibility exercises",
          "Orchestra and band preparation",
          "Mute techniques and effects"
        ],
        instruments: "Student and intermediate brass instruments available",
        schedule: "Monday to Saturday, 9 AM - 6 PM"
      }
    },
    // Production Category
    {
      title: "Music Production",
      description: "From beat making to final mixdown",
      icon: Mic,
      color: "secondary",
      category: "Production",
      details: {
        duration: "Individual (1 hour) or Group (2 hours) sessions",
        levels: "Beginner to Advanced",
        features: [
          "Digital Audio Workstation (DAW) basics",
          "Recording, mixing, and mastering techniques",
          "Beat making and sound design",
          "Vocal production and effects",
          "Access to our fully-equipped studio"
        ],
        instruments: "DAWs (Logic Pro X, Ableton Live), MIDI controllers, studio monitors",
        schedule: "Flexible scheduling, project-based learning"
      }
    },
    {
      title: "Live Sound Engineering",
      description: "Become the master of event audio",
      icon: MonitorPlay,
      color: "primary",
      category: "Production",
      details: {
        duration: "8-week intensive course",
        levels: "Beginner to Intermediate",
        features: [
          "Live sound setup and mixing",
          "Mixer operation (analog and digital)",
          "Microphone placement and techniques",
          "Live broadcasting and streaming",
          "Hands-on experience at real events"
        ],
        instruments: "Digital mixing consoles, PA systems, stage monitors, microphones",
        schedule: "Evening classes and weekend practicals"
      }
    },
    {
      title: "Videography",
      description: "Tell stories through moving images",
      icon: Video,
      color: "primary",
      category: "Production",
      details: {
        duration: "4-week workshops or individual projects",
        levels: "Beginner to Intermediate",
        features: [
          "Camera operation and settings",
          "Cinematic composition and lighting",
          "Video editing with Adobe Premiere Pro",
          "Storyboarding and pre-production",
          "Portfolio development"
        ],
        instruments: "DSLR/Mirrorless cameras, gimbals, lighting kits, editing software",
        schedule: "Weekend workshops and weekday evening classes"
      }
    },
    // Art Category
    {
      title: "Photography",
      description: "Capture moments, create art",
      icon: Camera,
      color: "accent",
      category: "Art",
      details: {
        duration: "Individual sessions and themed workshops",
        levels: "All levels",
        features: [
          "Understanding your camera (manual mode)",
          "Principles of composition and light",
          "Portrait, landscape, and street photography",
          "Editing with Adobe Lightroom and Photoshop",
          "Building a professional portfolio"
        ],
        instruments: "Access to various lenses and lighting equipment",
        schedule: "Flexible one-on-one sessions and monthly workshops"
      }
    },
    {
      title: "Art & Design",
      description: "Unleash your visual creativity",
      icon: Palette,
      color: "secondary",
      category: "Art",
      details: {
        duration: "Weekly classes and holiday camps",
        levels: "Kids, Teens, and Adults",
        features: [
          "Drawing and sketching fundamentals",
          "Painting with acrylics and watercolors",
          "Digital art and illustration",
          "Crafts and mixed media projects",
          "Exhibition opportunities"
        ],
        instruments: "All materials provided (canvases, paints, sketchbooks, digital tablets)",
        schedule: "After-school classes and weekend workshops"
      }
    },
    {
      title: "Code Kids: Web Wizards",
      description: "The Art & Science of Web Development",
      icon: Code,
      color: "accent",
      category: "Art",
      details: {
        duration: "Weekly classes (90 minutes)",
        levels: "Beginner (Ages 10-16)",
        features: [
          "Learn HTML, CSS, and JavaScript",
          "Build and deploy your own websites",
          "Introduction to web design principles",
          "Fun, project-based learning",
          "Develop problem-solving and logic skills"
        ],
        instruments: "Access to online coding platforms",
        schedule: "Saturdays (Morning and Afternoon sessions)"
      }
    }
  ];

  const categories = [
    { id: "all", name: "All Courses", count: courses.length },
    { id: "Music", name: "Music", count: courses.filter(c => c.category === "Music").length },
    { id: "Art", name: "Art", count: courses.filter(c => c.category === "Art").length },
    { id: "Production", name: "Production", count: courses.filter(c => c.category === "Production").length }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return 'from-primary/10 to-primary/5 text-primary border-primary/20';
      case 'accent':
        return 'from-accent/10 to-accent/5 text-accent border-accent/20';
      case 'secondary':
        return 'from-secondary/10 to-secondary/5 text-secondary border-secondary/20';
      default:
        return 'from-primary/10 to-primary/5 text-primary border-primary/20';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Music':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Art':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Production':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <section id="courses" className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        {/* Search and Filter Section */}
        <div className="mb-12 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {category.name}
                <Badge variant="secondary" className="ml-1">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Results Count */}
          <div className="text-center text-muted-foreground">
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
        </div>
        
        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-2xl font-bold mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or category filter
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredCourses.map((course, index) => {
              const IconComponent = course.icon;
              return (
                <Card key={index} className={`shadow-xl border-2 bg-gradient-to-br ${getColorClasses(course.color)} hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className={`p-4 bg-gradient-to-r ${course.color === 'primary' ? 'from-primary to-primary/80' : course.color === 'accent' ? 'from-accent to-accent/80' : 'from-secondary to-secondary/80'} rounded-full shadow-lg`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold">{course.title}</CardTitle>
                    <Badge className={`w-fit mx-auto ${getCategoryColor(course.category)}`}>
                      {course.category}
                    </Badge>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-6">{course.description}</p>
                    
                    <Dialog open={openDialog === index} onOpenChange={(open) => setOpenDialog(open ? index : null)}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                          Learn More
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-3 text-2xl">
                            <IconComponent className={`h-8 w-8 ${course.color === 'primary' ? 'text-primary' : course.color === 'accent' ? 'text-accent' : 'text-secondary'}`} />
                            {course.title}
                          </DialogTitle>
                          <Badge className={`w-fit ${getCategoryColor(course.category)}`}>
                            {course.category}
                          </Badge>
                        </DialogHeader>
                        <div className="space-y-6 pt-4">
                          <div>
                            <h4 className="font-semibold text-lg mb-2">Course Duration</h4>
                            <p className="text-muted-foreground">{course.details.duration}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-lg mb-2">Skill Levels</h4>
                            <p className="text-muted-foreground">{course.details.levels}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-lg mb-2">What You'll Learn</h4>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {course.details.features.map((feature, idx) => (
                                <li key={idx}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-lg mb-2">Instruments & Equipment</h4>
                            <p className="text-muted-foreground">{course.details.instruments}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-lg mb-2">Schedule</h4>
                            <p className="text-muted-foreground">{course.details.schedule}</p>
                          </div>
                          
                          <div className="pt-4">
                            <Button 
                              asChild
                              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                              onClick={() => setOpenDialog(null)}
                            >
                              <Link to="/registration">Enroll Now</Link>
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default CoursesEnhanced;
