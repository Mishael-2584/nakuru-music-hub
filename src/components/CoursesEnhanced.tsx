import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Piano, Guitar, Mic, Drum, Music, Brain, Wind, Volume2, Camera, Video, MonitorPlay, Code, Palette, Search, Filter, Headphones, BookOpen, Users, Award, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const CoursesEnhanced = () => {
  const [openDialog, setOpenDialog] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const courses = [
    {
      icon: Guitar,
      title: "Guitar Lessons",
      description: "Learn acoustic and electric guitar from beginner to advanced.",
      category: "Music",
      color: "primary",
      details: {
        availability: "Available online and in-person (Nakuru & Nairobi)",
        duration: "Choice of individual 30 or 60-minute sessions, tailored to your progress.",
        levels: "Open to all, from complete beginners to advanced players.",
        features: [
          "Our instructors create a custom lesson plan based on your personal goals and musical interests, allowing you to learn at your own pace.",
          "Core Fundamentals: Acoustic & electric guitar instruction",
          "Stylistic Exploration: Rock, pop, jazz, and classical styles",
          "Musicianship: Chord progressions, music theory, and lead guitar",
          "Practical Skills: Basic recording techniques and instrument care",
          "Internationally Recognized Exams: ABRSM, Trinity College London, LCM, Rockschool (RSL)"
        ],
        instruments: "All necessary guitars, amplifiers, and equipment are provided for use during lessons.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: Piano,
      title: "Piano",
      description: "Master the keys with our comprehensive piano and keyboard lessons.",
      category: "Music",
      color: "primary",
      details: {
        availability: "Available online and in-person (Nakuru & Nairobi)",
        duration: "Choice of individual 30 or 60-minute sessions, tailored to your progress.",
        levels: "Open to all, from complete beginners to advanced players.",
        features: [
          "Our instructors create a custom lesson plan based on your personal goals and musical interests, allowing you to learn at your own pace.",
          "Core Fundamentals: Piano technique, posture, reading sheet music, and developing hand independence.",
          "Stylistic Exploration: Classical, jazz, pop, gospel, and contemporary styles.",
          "Musicianship: Music theory, chord voicings, improvisation, and ear training.",
          "Practical Skills: Accompaniment techniques, using digital keyboards, and performance skills.",
          "Internationally Recognized Exams: ABRSM, Trinity College London, LCM, Rockschool (RSL)"
        ],
        instruments: "Acoustic pianos and professional-grade digital keyboards are provided for all lessons.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: Volume2,
      title: "Drum & Percussion Lessons",
      description: "Develop rhythm and technique with expert drum instruction.",
      category: "Music",
      color: "primary",
      details: {
        availability: "Available online and in-person (Nakuru & Nairobi)",
        duration: "Choice of individual 30 or 60-minute sessions, tailored to your progress.",
        levels: "Open to all, from complete beginners to advanced players.",
        features: [
          "Our instructors create a custom lesson plan based on your personal goals and musical interests, allowing you to learn at your own pace.",
          "Core Fundamentals: Grip, posture, coordination, drum rudiments, and reading rhythms.",
          "Stylistic Exploration: Rock, funk, jazz, Latin, and African rhythmic styles.",
          "Musicianship: Developing solid time-keeping, playing with a band, and understanding dynamics.",
          "Practical Skills: Drum kit tuning, maintenance, and basic microphone setup for recording.",
          "Internationally Recognized Exams: ABRSM, Trinity College London, LCM, Rockschool (RSL)"
        ],
        instruments: "Fully-equipped acoustic drum kits and practice pads are provided for use during lessons.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: Mic,
      title: "Vocal (Singing) Lessons",
      description: "Develop your voice with professional vocal coaching.",
      category: "Music",
      color: "primary",
      details: {
        availability: "Available online and in-person (Nakuru & Nairobi)",
        duration: "Choice of individual 30 or 60-minute sessions, tailored to your progress.",
        levels: "Open to all, from complete beginners to advanced players.",
        features: [
          "Our instructors create a custom lesson plan based on your personal goals and musical interests, allowing you to learn at your own pace.",
          "Core Fundamentals: Healthy breath control, pitch accuracy, tone production, and vocal health.",
          "Stylistic Exploration: Pop, R&B, gospel, jazz, musical theatre, and classical styles.",
          "Musicianship: Ear training, sight-singing, understanding harmony, and microphone technique.",
          "Practical Skills: Building performance confidence, stage presence, and lyric interpretation.",
          "Internationally Recognized Exams: ABRSM, Trinity College London, LCM, Rockschool (RSL)"
        ],
        instruments: "Our vocal studios are equipped with professional sound systems, microphones, and pianos for accompaniment.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: Volume2,
      title: "Violin Lessons",
      description: "Classical and contemporary violin instruction.",
      category: "Music",
      color: "primary",
      details: {
        availability: "Available online and in-person (Nakuru & Nairobi)",
        duration: "Choice of individual 30 or 60-minute sessions, tailored to your progress.",
        levels: "Open to all, from complete beginners to advanced players.",
        features: [
          "Our instructors create a custom lesson plan based on your personal goals and musical interests, allowing you to learn at your own pace.",
          "Core Fundamentals: Proper posture, bow hold, intonation, and producing a clear tone.",
          "Stylistic Exploration: Classical, folk, pop, and orchestral music.",
          "Musicianship: Reading sheet music, music theory, scales, and ear training.",
          "Practical Skills: Instrument care, tuning, playing in ensembles, and performance techniques.",
          "Internationally Recognized Exams: ABRSM, Trinity College London, LCM, Rockschool (RSL)"
        ],
        instruments: "High-quality violins in various sizes are available for use during lessons.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: Headphones,
      title: "Saxophone Lessons",
      description: "Jazz, classical, and contemporary saxophone lessons.",
      category: "Music",
      color: "primary",
      details: {
        availability: "Available online and in-person (Nakuru & Nairobi)",
        duration: "Choice of individual 30 or 60-minute sessions, tailored to your progress.",
        levels: "Open to all, from complete beginners to advanced players.",
        features: [
          "Our instructors create a custom lesson plan based on your personal goals and musical interests, allowing you to learn at your own pace.",
          "Core Fundamentals: Embouchure, breath control, tone production, and fingerings.",
          "Stylistic Exploration: Jazz, blues, pop, funk, and classical saxophone.",
          "Musicianship: Improvisation, reading charts, music theory, and understanding harmony.",
          "Practical Skills: Reed selection and care, instrument maintenance, and playing in a band setting.",
          "Internationally Recognized Exams: ABRSM, Trinity College London, LCM, Rockschool (RSL)"
        ],
        instruments: "For practice and hygiene purposes, students are required to have their own instrument. Our team is happy to provide guidance on selecting and purchasing a suitable instrument for beginners.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: Wind,
      title: "Trumpet & Brass Lessons",
      description: "Brass and wind instrument instruction.",
      category: "Music",
      color: "primary",
      details: {
        availability: "Available online and in-person (Nakuru & Nairobi)",
        duration: "Choice of individual 30 or 60-minute sessions, tailored to your progress.",
        levels: "Open to all, from complete beginners to advanced players.",
        features: [
          "Our instructors create a custom lesson plan based on your personal goals and musical interests, allowing you to learn at your own pace.",
          "Core Fundamentals: Proper embouchure, breath support, tone quality, and articulation.",
          "Stylistic Exploration: Classical, jazz, marching band, funk, and big band styles.",
          "Musicianship: Reading music, scales, music theory, and playing in horn sections.",
          "Practical Skills: Instrument maintenance, valve oiling, mouthpiece selection, and performance skills.",
          "Internationally Recognized Exams: ABRSM, Trinity College London, LCM, Rockschool (RSL)"
        ],
        instruments: "For practice and hygiene purposes, students are required to have their own instrument. Our team is happy to provide guidance on selecting and purchasing a suitable instrument for beginners.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: BookOpen,
      title: "Music Theory & Musicianship",
      description: "Comprehensive music theory and composition.",
      category: "Music",
      color: "primary",
      details: {
        availability: "Available online and in-person (Nakuru & Nairobi)",
        duration: "Choice of individual 30 or 60-minute sessions, tailored to your progress.",
        levels: "Open to all, from complete beginners to advanced musicians seeking to deepen their knowledge.",
        features: [
          "A strong theoretical foundation enhances every musical journey. Our instructors create a custom lesson plan based on your current knowledge and goals, allowing you to learn at your own pace.",
          "Core Fundamentals: Mastering music notation, rhythm, scales, key signatures, and intervals.",
          "Harmony & Composition: Understanding chord construction, progressions, song form, and basic songwriting techniques.",
          "Aural Skills (Ear Training): Developing the ability to recognize notes, chords, and rhythms by ear.",
          "Advanced Studies: Exploring counterpoint, musical form and analysis, and advanced harmonic concepts.",
          "Internationally Recognized Exams: ABRSM, Trinity College London, LCM, Rockschool (RSL)"
        ],
        instruments: "No specific instrument required. Our studio utilizes a piano for demonstrations, and students will need manuscript paper and writing materials.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    // Videography, Art, Live Sound (in-person only)
    {
      icon: Camera,
      title: "Videography & Photography",
      description: "Learn to tell powerful stories through images and film.",
      category: "Production",
      color: "accent",
      details: {
        availability: "In-person only (Nakuru & Nairobi campuses)",
        duration: "3 sessions/week · 1 hour each",
        levels: "Open to all, from complete beginners to advanced students.",
        features: [
          "Camera techniques, composition skills, editing software, and portfolio building.",
          "Advanced techniques, professional editing, business skills, and industry networking."
        ],
        instruments: "All necessary cameras and equipment are provided for use during lessons.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: Palette,
      title: "Art Classes",
      description: "Creative art and design instruction for all ages.",
      category: "Art",
      color: "secondary",
      details: {
        availability: "In-person only (Nakuru & Nairobi campuses)",
        duration: "1 session/week · 2–3 hours per session",
        levels: "All Levels",
        features: [
          "Extended sessions, various mediums, creative expression, and exhibition opportunities."
        ],
        instruments: "All art materials provided during lessons.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: Music,
      title: "Live Sound",
      description: "Hands-on training with live sound gear and event production.",
      category: "Production",
      color: "accent",
      details: {
        availability: "In-person only (Nakuru & Nairobi campuses)",
        duration: "3 sessions/week · 1 hour each",
        levels: "Open to all, from complete beginners to advanced students.",
        features: [
          "Hands-on training with live sound gear, microphone techniques & placement, understanding mixers & signal flow, FOH & monitor speaker setup, practical soundcheck procedures."
        ],
        instruments: "All necessary live sound equipment provided during lessons.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: MonitorPlay,
      title: "Music Production",
      description: "Learn digital music production, recording, and mixing with professional software.",
      category: "Production",
      color: "accent",
      details: {
        availability: "In-person only (Nakuru & Nairobi campuses)",
        duration: "3 sessions/week · 1 hour each",
        levels: "Open to all, from complete beginners to advanced students.",
        features: [
          "Comprehensive digital music production course covering recording, mixing, and mastering",
          "DAW operation (Logic Pro, Ableton Live, Pro Tools)",
          "Recording techniques, microphone placement, and signal flow",
          "Mixing and mastering, sound design, and music arrangement",
          "Project-based learning with portfolio development",
          "Professional studio access with industry-standard equipment"
        ],
        instruments: "Professional studio equipment and software provided (Logic Pro, Ableton Live, Pro Tools).",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: Users,
      title: "Kids Band",
      description: "Collaborative group learning for young musicians.",
      category: "Music",
      color: "primary",
      details: {
        availability: "In-person only (Nakuru & Nairobi campuses)",
        duration: "10 sessions per term (3 months)",
        levels: "Open to young musicians of all skill levels.",
        features: [
          "A collaborative space for all young players",
          "Team-based learning with experienced instructors",
          "Fun and creative sessions designed to build confidence",
          "Exciting performance opportunities at showcases",
          "10 sessions per term (3 months)",
          "Save KSh 3,000 with termly payment!"
        ],
        instruments: "All instruments provided for group sessions.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: Award,
      title: "Live Sound Engineering",
      description: "Comprehensive live sound engineering course with hands-on training.",
      category: "Production",
      color: "accent",
      details: {
        availability: "In-person only (Nakuru & Nairobi campuses)",
        duration: "2 sessions/week - 2 hours each",
        levels: "Open to all, from complete beginners to advanced students.",
        features: [
          "Sound physics & fundamentals",
          "Advanced mixing techniques",
          "Microphone types & placement",
          "In-depth signal processing (FX)",
          "Analog & digital mixing consoles",
          "Front of House (FOH) & monitor mixing",
          "Signal flow & gain staging",
          "System setup & troubleshooting",
          "Intro to EQ, compression & gates",
          "Final project: Mix a live band"
        ],
        instruments: "Professional live sound equipment and mixing consoles provided.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: Music,
      title: "Music Production (RSL Awards)",
      description: "RSL Awards Curriculum for Music Production (Grades 1-8).",
      category: "Production",
      color: "accent",
      details: {
        availability: "Available online and in-person (Nakuru & Nairobi)",
        duration: "Individual: 1 session/week - 1 hour each | Group: 1 session/week - 2 hours each",
        levels: "RSL Awards Curriculum (Grades 1-8).",
        features: [
          "RSL Awards Curriculum (Grades 1-8)",
          "One-on-one personalized instruction OR collaborative learning (Max 5 students)",
          "Hybrid lessons (Online & In-person)",
          "Practical DAW skills & techniques",
          "Preparation for RSL grade examinations",
          "Portfolio development support",
          "Peer-to-peer feedback and projects (Group sessions)"
        ],
        instruments: "Professional studio equipment and software provided (Logic Pro, Ableton Live, Pro Tools).",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: Code,
      title: "Web Design",
      description: "Learn modern web design and development with HTML5, CSS3, and JavaScript.",
      category: "Technology",
      color: "secondary",
      details: {
        availability: "Available online and in-person (Nakuru & Nairobi)",
        duration: "2 sessions/week - 1.5 hours each",
        levels: "Open to all, from complete beginners to advanced students.",
        features: [
          "HTML5 & CSS3 fundamentals",
          "Responsive web design",
          "JavaScript basics",
          "UI/UX design principles",
          "Portfolio development",
          "Modern frameworks (React/Vue)",
          "Project-based learning",
          "Industry best practices"
        ],
        instruments: "All necessary software and development tools provided.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    },
    {
      icon: Smartphone,
      title: "App Development",
      description: "Mobile app development for iOS and Android platforms.",
      category: "Technology",
      color: "secondary",
      details: {
        availability: "Available online and in-person (Nakuru & Nairobi)",
        duration: "2 sessions/week - 1.5 hours each",
        levels: "Open to all, from complete beginners to advanced students.",
        features: [
          "Mobile app development",
          "React Native & Flutter",
          "iOS & Android platforms",
          "Backend integration",
          "App store deployment",
          "Real-world projects",
          "Cross-platform development",
          "Industry certification preparation"
        ],
        instruments: "All necessary development tools and software provided.",
        schedule: "Mon-Fri: 7am-8pm, Sun: 8am-6pm. Proceed to the enrollment form to view all up-to-date times and book your spot."
      }
    }
  ];

  const categories = [
    { id: "all", name: "All Courses", count: courses.length },
    { id: "Music", name: "Music", count: courses.filter(c => c.category === "Music").length },
    { id: "Art", name: "Art", count: courses.filter(c => c.category === "Art").length },
    { id: "Production", name: "Production", count: courses.filter(c => c.category === "Production").length },
    { id: "Technology", name: "Technology", count: courses.filter(c => c.category === "Technology").length }
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
      case 'Technology':
        return 'bg-orange-100 text-orange-800 border-orange-200';
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
                            <h4 className="font-semibold text-lg mb-2">Availability</h4>
                            <p className="text-muted-foreground">{course.details.availability}</p>
                          </div>
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