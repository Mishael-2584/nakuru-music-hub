
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Star, Clock, Users, Award } from "lucide-react";
import { Link } from "react-router-dom";

const Fees = () => {
  const feeStructure = [
    {
      category: "Individual Music Lessons",
      courses: [
        {
          name: "Piano (Individual)",
          level: "All Levels",
          duration: "1 hour/week",
          monthly: "KSh 12,000",
          termly: "KSh 35,000",
          registrationFee: "KSh 2,000",
          materialFee: "KSh 1,500",
          examFee: "KSh 3,000",
          features: ["One-on-one instruction", "Personalized curriculum", "Performance opportunities", "ABRSM preparation"],
          popular: true
        },
        {
          name: "Guitar (Individual)",
          level: "All Levels",
          duration: "1 hour/week",
          monthly: "KSh 10,000",
          termly: "KSh 28,000",
          registrationFee: "KSh 2,000",
          materialFee: "KSh 1,200",
          examFee: "KSh 3,000",
          features: ["Acoustic & Electric", "Multiple styles", "Song composition", "Recording techniques"]
        },
        {
          name: "Voice Training (Individual)",
          level: "All Levels",
          duration: "1 hour/week",
          monthly: "KSh 11,000",
          termly: "KSh 32,000",
          registrationFee: "KSh 2,000",
          materialFee: "KSh 1,000",
          examFee: "KSh 3,500",
          features: ["Breath control", "Vocal range expansion", "Performance coaching", "Recording sessions"]
        },
        {
          name: "Violin (Individual)",
          level: "All Levels",
          duration: "1 hour/week",
          monthly: "KSh 12,000",
          termly: "KSh 35,000",
          registrationFee: "KSh 2,000",
          materialFee: "KSh 2,000",
          examFee: "KSh 3,000",
          features: ["Classical & contemporary", "Ensemble playing", "Music theory", "Performance skills"]
        }
      ]
    },
    {
      category: "Group Music Lessons",
      courses: [
        {
          name: "Piano (Group)",
          level: "Beginner to Intermediate",
          duration: "1 hour/week",
          monthly: "KSh 8,000",
          termly: "KSh 22,000",
          registrationFee: "KSh 1,500",
          materialFee: "KSh 1,200",
          examFee: "KSh 2,500",
          features: ["Small group setting (max 4)", "Peer learning", "Group performances", "Affordable option"],
          classSize: "2-4 students"
        },
        {
          name: "Guitar (Group)",
          level: "Beginner to Intermediate",
          duration: "1 hour/week",
          monthly: "KSh 7,000",
          termly: "KSh 19,000",
          registrationFee: "KSh 1,500",
          materialFee: "KSh 1,000",
          examFee: "KSh 2,500",
          features: ["Interactive learning", "Band formation", "Jam sessions", "Music theory basics"],
          classSize: "3-5 students"
        }
      ]
    },
    {
      category: "Music Production",
      courses: [
        {
          name: "Music Production & Audio Engineering",
          level: "Beginner to Advanced",
          duration: "2 hours/week",
          monthly: "KSh 15,000",
          termly: "KSh 42,000",
          registrationFee: "KSh 3,000",
          materialFee: "KSh 2,500",
          examFee: "KSh 4,000",
          features: ["Professional software training", "Studio access", "Mixing & mastering", "Industry certification"],
          premium: true
        },
        {
          name: "Beat Making & Composition",
          level: "All Levels",
          duration: "1.5 hours/week",
          monthly: "KSh 12,000",
          termly: "KSh 34,000",
          registrationFee: "KSh 2,500",
          materialFee: "KSh 2,000",
          examFee: "KSh 3,500",
          features: ["Digital music creation", "Genre exploration", "Collaboration projects", "Portfolio development"]
        }
      ]
    },
    {
      category: "Art & Photography",
      courses: [
        {
          name: "Digital Photography",
          level: "All Levels",
          duration: "2 hours/week",
          monthly: "KSh 10,000",
          termly: "KSh 28,000",
          registrationFee: "KSh 2,000",
          materialFee: "KSh 1,800",
          examFee: "KSh 3,000",
          features: ["Professional equipment", "Photo editing", "Portfolio development", "Exhibition opportunities"]
        },
        {
          name: "Art & Design",
          level: "All Levels",
          duration: "2 hours/week",
          monthly: "KSh 8,500",
          termly: "KSh 24,000",
          registrationFee: "KSh 1,800",
          materialFee: "KSh 2,200",
          examFee: "KSh 2,800",
          features: ["Traditional & digital art", "Design principles", "Creative projects", "Gallery exhibitions"]
        }
      ]
    }
  ];

  const paymentOptions = [
    "Monthly payments accepted",
    "Termly discounts available",
    "Family discounts for multiple students",
    "Flexible payment plans",
    "Mobile money payments (M-Pesa, Airtel Money)",
    "Bank transfers accepted"
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Course Fees & Pricing</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transparent, affordable pricing for world-class music and creative arts education. 
            Choose from individual or group lessons to fit your budget and learning style.
          </p>
        </div>

        {/* Fee Structure */}
        {feeStructure.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center text-primary">
              {category.category}
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.courses.map((course, courseIndex) => (
                <Card key={courseIndex} className={`relative shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105 ${
                  course.popular ? 'ring-2 ring-primary' : course.premium ? 'ring-2 ring-accent' : ''
                }`}>
                  {course.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-white px-4 py-1">
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
                  
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">{course.name}</CardTitle>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{course.level}</Badge>
                        <span>•</span>
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      {course.classSize && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{course.classSize}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Pricing */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Monthly:</span>
                        <span className="text-2xl font-bold text-primary">{course.monthly}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Per Term:</span>
                        <span className="text-lg font-semibold">{course.termly}</span>
                      </div>
                    </div>

                    {/* Additional Fees */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Registration Fee:</span>
                        <span className="font-medium">{course.registrationFee}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Material Fee:</span>
                        <span className="font-medium">{course.materialFee}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Exam Fee (optional):</span>
                        <span className="font-medium">{course.examFee}</span>
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

        {/* Payment Information */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Payment Information</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Payment Options</h4>
              <div className="space-y-2">
                {paymentOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{option}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Additional Information</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>• All fees are quoted in Kenyan Shillings (KSh)</p>
                <p>• Registration fee is one-time payment</p>
                <p>• Material fees cover books, sheet music, and basic supplies</p>
                <p>• Exam fees are optional and for certification purposes</p>
                <p>• Family discounts available for 2+ students</p>
                <p>• Instruments available for rent at additional cost</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Your Musical Journey?</h3>
          <p className="text-muted-foreground mb-6">
            Contact us for more information or to schedule a trial lesson
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
