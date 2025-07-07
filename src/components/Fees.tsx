import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Star, Clock, Users, Award, Globe, Home } from "lucide-react";
import { Link } from "react-router-dom";

const Fees = () => {
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
          monthly: "KSh 5,600",
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
          monthly: "$44/month",
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
    }
  ];

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
    return "from-primary to-accent";
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Damon Music Academy – Fee Structure</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Transparent, affordable pricing for world-class music and creative arts education.
          </p>
        </div>
        
        {feeStructure.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold mb-2 text-primary">{category.category}</h3>
              {category.subtitle && <p className="text-base md:text-lg text-muted-foreground mb-2">{category.subtitle}</p>}
              {category.note && <p className="text-sm text-muted-foreground italic">{category.note}</p>}
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.courses.map((course, courseIndex) => (
                <Card key={courseIndex} className={`relative flex flex-col shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300 ${course.popular ? 'ring-2 ring-blue-500' : ''}`}>
                  {course.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2"><Badge className="bg-blue-500 text-white px-3 py-1 text-sm"><Star className="w-3 h-3 mr-1" />Popular</Badge></div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-3">
                       {course.icon && <div className={`p-2 bg-gradient-to-r ${getIconColor(category.category)} rounded-lg`}><course.icon className="w-5 h-5 text-white" /></div>}
                       <div className="flex-1">
                         <CardTitle className="text-lg">{course.name}</CardTitle>
                         {course.level && (
                           <div className={`inline-block mt-1 mb-2 px-3 py-1 rounded-full text-xs font-semibold ${course.level === '1st Term' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{course.level}</div>
                         )}
                         {course.location && (
                           <p className="text-sm text-muted-foreground mt-1">{course.location}</p>
                         )}
                       </div>
                    </div>
                    {course.duration && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4" /><span>{course.duration}</span></div>}
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col pt-0">
                    <div className="text-center my-4"><div className="text-2xl font-bold text-primary">{course.monthly || course.perClass || course.termly}</div><div className="text-sm text-muted-foreground mt-1">{course.monthly ? "per month" : course.perClass ? "per class" : "per term"}</div></div>
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