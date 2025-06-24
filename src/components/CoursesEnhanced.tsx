import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Piano, Guitar, Mic, Drum, Music, Brain, Wind, Volume2, Camera, Video, MonitorPlay, Code, Palette } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const CoursesEnhanced = () => {
  const [openDialog, setOpenDialog] = useState<number | null>(null);

  const courses = [
    {
      title: "Piano Lessons",
      description: "Master the keys with professional instruction",
      icon: Piano,
      color: "primary",
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
    {
      title: "Music Production",
      description: "From beat making to final mixdown",
      icon: Mic,
      color: "secondary",
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
      title: "Videography",
      description: "Tell stories through moving images",
      icon: Video,
      color: "primary",
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
    {
      title: "Photography",
      description: "Capture moments, create art",
      icon: Camera,
      color: "accent",
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
      title: "Live Sound Engineering",
      description: "Become the master of event audio",
      icon: MonitorPlay,
      color: "primary",
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
      title: "Code Kids: Web Wizards",
      description: "The Art & Science of Web Development",
      icon: Code,
      color: "accent",
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

  return (
    <section id="courses" className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Our Music Programs
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover your musical passion with our comprehensive range of courses designed for all skill levels
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {courses.map((course, index) => {
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
      </div>
    </section>
  );
};

export default CoursesEnhanced;
