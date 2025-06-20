import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Star, Clock, Users, Award, Globe, Home, Monitor } from "lucide-react";
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
          duration: "1 hour",
          monthly: "KSh 4,800",
          icon: Home,
          features: ["One-on-one instruction", "Professional facilities", "All instruments available", "Flexible scheduling"],
          popular: true
        },
        {
          name: "At the Academy",
          duration: "30 minutes", 
          monthly: "KSh 5,600",
          icon: Home,
          features: ["One-on-one instruction", "Professional facilities", "Perfect for beginners", "Focused sessions"]
        },
        {
          name: "Home (Nakuru & Environs)",
          duration: "1 hour",
          monthly: "KSh 10,000",
          icon: Users,
          features: ["Convenient home lessons", "Personal attention", "Comfortable environment", "Travel included"]
        },
        {
          name: "Online (Global)",
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
          duration: "1 hour",
          perClass: "KSh 1,500",
          icon: Home,
          features: ["No commitment required", "Pay as you go", "Professional facilities", "Trial friendly"]
        },
        {
          name: "At the Academy", 
          duration: "30 minutes",
          perClass: "KSh 1,600",
          icon: Home,
          features: ["Short focused sessions", "Perfect for busy schedules", "No commitment", "Quality instruction"]
        },
        {
          name: "Home (Nakuru & Environs)",
          duration: "1 hour", 
          perClass: "KSh 2,700",
          icon: Users,
          features: ["Home convenience", "Personal attention", "No travel needed", "Comfortable learning"]
        },
        {
          name: "Online (Global)",
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
        {
          name: "1st Term",
          level: "Foundation Level",
          termly: "KSh 45,500",
          features: ["Professional software training", "Studio access", "Industry techniques", "Portfolio development"],
          premium: true
        },
        {
          name: "Final Term", 
          level: "Advanced Level",
          termly: "KSh 42,500",
          features: ["Advanced production", "Mixing & mastering", "Industry certification", "Career guidance"]
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
    if (category.includes("Instrumental")) return "from-blue-500 to-blue-600";
    if (category.includes("Pay Per Class")) return "from-green-500 to-green-600";
    if (category.includes("Production")) return "from-purple-500 to-purple-600";
    if (category.includes("Photography")) return "from-orange-500 to-orange-600";
    if (category.includes("Art")) return "from-pink-500 to-pink-600";
    return "from-primary to-accent";
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Damon Music Academy – Fee Structure</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transparent, affordable pricing for world-class music and creative arts education.
          </p>
        </div>

        {/* Fee Structure */}
        {feeStructure.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2 text-primary">
                {category.category}
              </h3>
              {category.subtitle && (
                <p className="text-lg text-muted-foreground mb-2">{category.subtitle}</p>
              )}
              {category.note && (
                <p className="text-sm text-muted-foreground italic">{category.note}</p>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {category.courses.map((course, courseIndex) => (
                <Card key={courseIndex} className={`relative shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105 ${
                  course.popular ? 'ring-2 ring-blue-500' : 
                  course.premium ? 'ring-2 ring-purple-500' : 
                  course.special ? 'ring-2 ring-green-500' : ''
                }`}>
                  {course.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-4 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {course.premium && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                        <Award className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  )}
                  {course.special && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-500 text-white px-4 py-1">
                        <Globe className="w-3 h-3 mr-1" />
                        Global
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      {course.icon && (
                        <div className={`p-2 bg-gradient-to-r ${getIconColor(category.category)} rounded-lg`}>
                          <course.icon className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                        {course.level && (
                          <Badge variant="outline" className="mt-1">{course.level}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {course.duration && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    {/* Pricing */}
                    <div className="text-center">
                      {course.monthly && (
                        <div className="text-2xl font-bold text-primary">{course.monthly}</div>
                      )}
                      {course.perClass && (
                        <div className="text-2xl font-bold text-green-600">{course.perClass}</div>
                      )}
                      {course.termly && (
                        <div className="text-2xl font-bold text-purple-600">{course.termly}</div>
                      )}
                      <div className="text-sm text-muted-foreground mt-1">
                        {course.monthly && "per month"}
                        {course.perClass && "per class"}
                        {course.termly && "per term"}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      {course.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold">
                      Enroll Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Additional Information */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Important Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-4">Payment Terms</h4>
              <div className="space-y-2">
                {additionalInfo.slice(0, 3).map((info, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{info}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">What's Included</h4>
              <div className="space-y-2">
                {additionalInfo.slice(3).map((info, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{info}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Your Creative Journey?</h3>
          <p className="text-muted-foreground mb-6">
            Contact us for more information or to schedule your first lesson
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent text-white">
              <Link to="/#registration">Register Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Fees;