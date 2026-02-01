import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Star, Clock, Users, Award, Globe, Home, Music, Code, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";

const Fees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const feeStructure = [
    {
      category: "🎶 Instrumental & Music Theory Lessons",
      subtitle: "Monthly Plan (1-on-1, 4 weeks – 1 session/week)",
      note: "Students may choose more than one class per week — total adjusts accordingly.",
      courses: [
        {
          name: "At the Academy",
          location: "",
          duration: "1 hour",
          monthly: "KSh 4,800",
          icon: Home,
          features: ["One-on-one instruction", "Professional facilities", "All instruments available", "Flexible scheduling"],
          popular: true
        },
        {
          name: "Home Lesson",
          location: "Nakuru CBD & Environs",
          duration: "30 minutes", 
          monthly: "KSh 6,000",
          icon: Home,
          features: ["One-on-one instruction", "Professional facilities", "Perfect for beginners", "Focused sessions"]
        },
        {
          name: "Home Lesson",
          location: "Nakuru CBD & Environs",
          duration: "1 hour",
          monthly: "KSh 10,000",
          icon: Users,
          features: ["Convenient home lessons", "Personal attention", "Comfortable environment", "Travel included"]
        },
        {
          name: "Online",
          location: "Global",
          duration: "1 hour",
          monthly: "$65/month",
          icon: Globe,
          features: ["Global accessibility", "Flexible timing", "Digital resources", "Interactive sessions"],
          special: true
        }
      ]
    },
    {
      category: "Pay Per Class",
      subtitle: "Flexible payment option for individual sessions",
      courses: [
        {
          name: "At the Academy",
          location: "",
          duration: "1 hour",
          perClass: "KSh 1,500",
          icon: Home,
          features: ["No commitment required", "Pay as you go", "Professional facilities", "Trial friendly"]
        },
        {
          name: "Home Lesson", 
          location: "Nakuru CBD & Environs",
          duration: "30 minutes",
          perClass: "KSh 1,600",
          icon: Home,
          features: ["Short focused sessions", "Perfect for busy schedules", "No commitment", "Quality instruction"]
        },
        {
          name: "Home Lesson",
          location: "Nakuru CBD & Environs",
          duration: "1 hour", 
          perClass: "KSh 2,700",
          icon: Users,
          features: ["Home convenience", "Personal attention", "No travel needed", "Comfortable learning"]
        },
        {
          name: "Online",
          location: "Global",
          duration: "1 hour",
          perClass: "$11/class", 
          icon: Globe,
          features: ["Global reach", "Flexible scheduling", "Digital tools", "Cost effective"],
          special: true
        }
      ]
    },
    {
      category: "🎸 Kids Band",
      subtitle: "Collaborative group learning for young musicians",
      courses: [
        {
          name: "Kids Band",
          duration: "10 sessions per term (3 months)",
          termly: "KSh 5,000",
          perSession: "KSh 800",
          icon: Users,
          features: [
            "A collaborative space for all young players",
            "Team-based learning with experienced instructors", 
            "Fun and creative sessions designed to build confidence",
            "Exciting performance opportunities at showcases",
            "10 sessions per term (3 months)"
          ],
          popular: true,
          savings: "Save KSh 3,000!"
        }
      ]
    },
    {
      category: "🎧 Music Production & Sound Engineering",
      subtitle: "3 sessions/week · 1 hour each",
      courses: [
        // Live Sound (Short Course)
        {
          name: "Live Sound (Short Course)",
          duration: "3 sessions/week - 1 hour each",
          monthly: "KSh 18,000",
          features: [
            "Hands-on training with live sound gear",
            "Microphone techniques & placement",
            "Understanding mixers & signal flow",
            "FOH & monitor speaker setup",
            "Practical soundcheck procedures"
          ],
          icon: Award,
        },
        // Live Sound Engineering 1st Term
        {
          name: "Live Sound Engineering",
          duration: "2 sessions/week - 2 hours each",
          termly: "KSh 28,000",
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
            "Final project: Mix a live band",
            "1st Term: Foundation & core skills"
          ],
          icon: Users,
          level: "1st Term",
        },
        // Live Sound Engineering Final Term
        {
          name: "Live Sound Engineering",
          duration: "2 sessions/week - 2 hours each",
          termly: "KSh 26,000",
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
            "Final project: Mix a live band",
            "Final Term: Advanced topics for returning students"
          ],
          icon: Users,
          level: "Final Term",
        },
        // Music Production 1st Term (add label)
        {
          name: "Music Production",
          duration: "3 sessions/week · 1 hour each",
          termly: "KSh 45,500",
          features: [
            "Professional software training",
            "Studio access",
            "Industry techniques",
            "Portfolio development"
          ],
          icon: Award,
          level: "1st Term",
          premium: true
        },
        // Music Production Final Term (add label)
        {
          name: "Music Production",
          duration: "3 sessions/week · 1 hour each",
          termly: "KSh 42,500",
          features: [
            "Advanced production",
            "Mixing & mastering",
            "Industry certification",
            "Career guidance"
          ],
          icon: Award,
          level: "Final Term",
        },
      ]
    },
    {
      category: "🎵 Music Production (RSL Awards)",
      subtitle: "RSL Awards Curriculum (Grades 1-8)",
      courses: [
        {
          name: "Individual Lessons",
          duration: "1 session/week - 1 hour each",
          monthly: "KSh 6,000",
          icon: Music,
          features: [
            "RSL Awards Curriculum (Grades 1-8)",
            "One-on-one personalized instruction",
            "Hybrid lessons (Online & In-person)",
            "Practical DAW skills & techniques",
            "Preparation for RSL grade examinations",
            "Portfolio development support"
          ]
        },
        {
          name: "Group Sessions",
          duration: "1 session/week - 2 hours each",
          monthly: "KSh 4,000",
          icon: Music,
          features: [
            "RSL Awards Curriculum (Grades 1-8)",
            "Collaborative learning (Max 5 students)",
            "Hybrid lessons (Online & In-person)",
            "Practical DAW skills & techniques",
            "Preparation for RSL grade examinations",
            "Peer-to-peer feedback and projects"
          ]
        }
      ]
    },
    {
      category: "📸 Photography & Videography", 
      subtitle: "3 sessions/week · 1 hour each",
      courses: [
        {
          name: "1st Term",
          level: "Foundation Level", 
          termly: "KSh 45,500",
          features: ["Camera techniques", "Composition skills", "Editing software", "Portfolio building"],
          premium: true
        },
        {
          name: "Final Term",
          level: "Advanced Level",
          termly: "KSh 42,500", 
          features: ["Advanced techniques", "Professional editing", "Business skills", "Industry networking"]
        }
      ]
    },
    {
      category: "🎨 Art Classes",
      subtitle: "1 session/week · 2–3 hours per session",
      courses: [
        {
          name: "Art Classes",
          level: "All Levels",
          monthly: "KSh 4,000",
          features: ["Extended sessions", "Various mediums", "Creative expression", "Exhibition opportunities"],
          duration: "2-3 hours/week"
        }
      ]
    },
    {
      category: "💻 Web Design & Programming",
      subtitle: "Flexible class sizes with competitive pricing",
      courses: [
        {
          name: "1-on-1 Classes",
          duration: "1 hour per session",
          perClass: "KSh 2,200",
          icon: Code,
          features: [
            "Personalized instruction",
            "Individual attention",
            "Customized learning pace",
            "Direct feedback and support",
            "Flexible scheduling"
          ],
          popular: true
        },
        {
          name: "2 Students",
          duration: "1 hour per session",
          perClass: "KSh 1,500",
          icon: Users,
          features: [
            "Small group learning",
            "Peer collaboration",
            "Cost-effective option",
            "Interactive sessions",
            "Shared resources"
          ]
        },
        {
          name: "3-5 Students",
          duration: "1 hour per session",
          perClass: "KSh 1,200",
          icon: Users,
          features: [
            "Group dynamics",
            "Team projects",
            "Affordable pricing",
            "Diverse perspectives",
            "Collaborative learning"
          ]
        },
        {
          name: "6-10 Students",
          duration: "1 hour per session",
          perClass: "KSh 1,000",
          icon: Users,
          features: [
            "Large group sessions",
            "Most economical option",
            "Classroom environment",
            "Structured curriculum",
            "Peer learning opportunities"
          ]
        }
      ]
    }
  ];

  // Create category options for filter
  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "instrumental", label: "🎶 Instrumental & Music Theory" },
    { value: "pay-per-class", label: "Pay Per Class" },
    { value: "kids-band", label: "🎸 Kids Band" },
    { value: "music-production", label: "🎧 Music Production & Sound Engineering" },
    { value: "rsl-awards", label: "🎵 Music Production (RSL Awards)" },
    { value: "photography", label: "📸 Photography & Videography" },
    { value: "art", label: "🎨 Art Classes" },
    { value: "programming", label: "💻 Web Design & Programming" }
  ];

  // Filter and search logic
  const filteredFeeStructure = useMemo(() => {
    return feeStructure.filter(category => {
      // Category filter
      const categoryMatch = selectedCategory === "all" || 
        (selectedCategory === "instrumental" && category.category.includes("Instrumental")) ||
        (selectedCategory === "pay-per-class" && category.category.includes("Pay Per Class")) ||
        (selectedCategory === "kids-band" && category.category.includes("Kids Band")) ||
        (selectedCategory === "music-production" && category.category.includes("Music Production & Sound Engineering")) ||
        (selectedCategory === "rsl-awards" && category.category.includes("RSL Awards")) ||
        (selectedCategory === "photography" && category.category.includes("Photography")) ||
        (selectedCategory === "art" && category.category.includes("Art Classes")) ||
        (selectedCategory === "programming" && category.category.includes("Web Design"));

      if (!categoryMatch) return false;

      // Search filter
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      const categoryMatches = category.category.toLowerCase().includes(searchLower) ||
                            category.subtitle?.toLowerCase().includes(searchLower) ||
                            category.note?.toLowerCase().includes(searchLower);

      const courseMatches = category.courses.some(course => 
        course.name.toLowerCase().includes(searchLower) ||
        ((course as any).location && (course as any).location.toLowerCase().includes(searchLower)) ||
        ((course as any).duration && (course as any).duration.toLowerCase().includes(searchLower)) ||
        ((course as any).level && (course as any).level.toLowerCase().includes(searchLower)) ||
        course.features.some(feature => feature.toLowerCase().includes(searchLower))
      );

      return categoryMatches || courseMatches;
    }).map(category => ({
      ...category,
      courses: category.courses.filter(course => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return course.name.toLowerCase().includes(searchLower) ||
               ((course as any).location && (course as any).location.toLowerCase().includes(searchLower)) ||
               ((course as any).duration && (course as any).duration.toLowerCase().includes(searchLower)) ||
               ((course as any).level && (course as any).level.toLowerCase().includes(searchLower)) ||
               course.features.some(feature => feature.toLowerCase().includes(searchLower));
      })
    }));
  }, [searchTerm, selectedCategory]);

  const additionalInfo = [
    "All classes are one-on-one unless otherwise indicated",
    "Term and monthly payments are made upfront", 
    "Students may choose multiple classes per week",
    "Flexible scheduling available",
    "Professional equipment provided",
    "Qualified instructors with industry experience"
  ];

  const getIconColor = (category: string) => {
    if (category.includes("Production") || category.includes("Photography")) return "from-purple-500 to-pink-500";
    if (category.includes("Web Design") || category.includes("Programming")) return "from-blue-500 to-cyan-500";
    return "from-primary to-accent";
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-700">
            All lessons and enrollments are subject to our{' '}
            <Link to="/cancellation-policy" className="text-primary underline" target="_blank">Cancellation Policy</Link>.
          </p>
        </div>
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Damon Music Academy – Fee Structure</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Transparent, affordable pricing for world-class music and creative arts education.
          </p>
          
          {/* Search and Filter Section */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search courses, instruments, or features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Results Counter */}
            {filteredFeeStructure.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredFeeStructure.reduce((total, category) => total + category.courses.length, 0)} courses
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedCategory !== "all" && ` in ${categoryOptions.find(opt => opt.value === selectedCategory)?.label}`}
              </div>
            )}
            
            {/* No Results Message */}
            {filteredFeeStructure.length === 0 && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-center">
                  No courses found matching your search criteria.
                  <br />
                  <button 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                    }}
                    className="text-primary hover:underline mt-2"
                  >
                    Clear filters to see all courses
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
        
        {filteredFeeStructure.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold mb-2 text-primary">{category.category}</h3>
              {category.subtitle && <p className="text-base md:text-lg text-muted-foreground mb-2">{category.subtitle}</p>}
              {category.note && <p className="text-sm text-muted-foreground italic">{category.note}</p>}
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.courses.map((course, courseIndex) => (
                <Card key={courseIndex} className={`relative flex flex-col shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300 ${(course as any).popular ? 'ring-2 ring-blue-500' : ''}`}>
                  {(course as any).popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2"><Badge className="bg-blue-500 text-white px-3 py-1 text-sm"><Star className="w-3 h-3 mr-1" />Popular</Badge></div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-3">
                       {(course as any).icon && <div className={`p-2 bg-gradient-to-r ${getIconColor(category.category)} rounded-lg`}>{(course as any).icon && React.createElement((course as any).icon, { className: "w-5 h-5 text-white" })}</div>}
                       <div className="flex-1">
                         <CardTitle className="text-lg">{course.name}</CardTitle>
                         {(course as any).level && (
                           <div className={`inline-block mt-1 mb-2 px-3 py-1 rounded-full text-xs font-semibold ${(course as any).level === '1st Term' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{(course as any).level}</div>
                         )}
                         {(course as any).location && (
                           <p className="text-sm text-muted-foreground mt-1">{(course as any).location}</p>
                         )}
                       </div>
                    </div>
                    {(course as any).duration && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4" /><span>{(course as any).duration}</span></div>}
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col pt-0">
                    <div className="text-center my-4">
                      {(course as any).perSession && (course as any).termly ? (
                        // Special display for Kids Band with both prices
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-primary">{(course as any).termly}</div>
                          <div className="text-sm text-muted-foreground">per term</div>
                          <div className="text-lg font-semibold text-gray-700">{(course as any).perSession}</div>
                          <div className="text-sm text-muted-foreground">per session</div>
                          {(course as any).savings && (
                            <div className="text-sm text-green-600 font-semibold mt-1 bg-green-50 px-2 py-1 rounded-full">{(course as any).savings}</div>
                          )}
                        </div>
                      ) : (
                        // Standard display for other courses
                        <div>
                          <div className="text-2xl font-bold text-primary">{(course as any).monthly || (course as any).perClass || (course as any).perSession || (course as any).termly}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {(course as any).monthly ? "per month" : 
                             (course as any).perClass ? "per class" : 
                             (course as any).perSession ? "per session" : 
                             "per term"}
                          </div>
                          {(course as any).savings && (
                            <div className="text-sm text-green-600 font-semibold mt-1">{(course as any).savings}</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 flex-grow">
                      {course.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500 flex-shrink-0" /><span>{feature}</span></div>
                      ))}
                    </div>
                    <Button asChild className="w-full mt-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold"><Link to="/registration">Enroll Now</Link></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Fees;