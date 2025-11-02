import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TrialBookingForm from "@/components/TrialBookingForm";
import WhatsAppChat from "@/components/WhatsAppChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  Gift, 
  Users, 
  Award, 
  Clock, 
  CheckCircle, 
  Music, 
  BookOpen,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

const TrialClassesPage = () => {
  const testimonials = [
    {
      name: "Sarah M.",
      age: "12 years old",
      instrument: "Piano",
      quote: "The trial class was amazing! I learned so much in just one session and couldn't wait to start regular lessons.",
      rating: 5
    },
    {
      name: "David K.",
      age: "15 years old", 
      instrument: "Guitar",
      quote: "The instructor was patient and really understood what I wanted to learn. The trial helped me choose the right course.",
      rating: 5
    },
    {
      name: "Grace W.",
      age: "8 years old",
      instrument: "Violin", 
      quote: "My daughter loved the trial class! The teacher made it fun and engaging. We signed up immediately after.",
      rating: 5
    }
  ];

  const trialFeatures = [
    {
      icon: Gift,
      title: "100% Free",
      description: "No hidden costs or commitments",
      color: "text-green-600"
    },
    {
      icon: Users,
      title: "1-on-1 Session",
      description: "Personalized attention from expert instructors",
      color: "text-blue-600"
    },
    {
      icon: Award,
      title: "Skill Assessment",
      description: "Professional evaluation of current abilities",
      color: "text-purple-600"
    },
    {
      icon: BookOpen,
      title: "Customized Plan",
      description: "Personalized learning path recommendations",
      color: "text-orange-600"
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      description: "Choose your preferred time and location",
      color: "text-indigo-600"
    },
    {
      icon: CheckCircle,
      title: "No Pressure",
      description: "Learn about our programs without any obligation",
      color: "text-teal-600"
    }
  ];

  const subjects = [
    "Piano", "Guitar", "Violin", "Drums", "Bass Guitar", 
    "Saxophone", "Trumpet", "Flute", "Vocals", "Music Theory", "Music Production",
    "Coding & Programming"
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 lg:pt-36 py-20 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/lovable-uploads/65de1b46-84a6-446b-8225-6359d2d2027d.png')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              Free Trial Classes
              </h1>
              <Sparkles className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Experience world-class education with our complimentary trial session. 
              No commitment, no pressure - just pure discovery.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm">
                <Gift className="w-4 h-4 mr-1" />
                100% Free
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm">
                <Users className="w-4 h-4 mr-1" />
                1-on-1 Session
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 px-4 py-2 text-sm">
                <Award className="w-4 h-4 mr-1" />
                Expert Instructors
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Try Our Trial Classes?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the Damon Music Academy difference before you commit
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {trialFeatures.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <feature.icon className={`w-12 h-12 mx-auto mb-4 ${feature.color}`} />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Available Instruments */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Available Subjects & Instruments</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose from our comprehensive range of music and coding subjects
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
            {subjects.map((subject, index) => (
              <Card key={index} className="text-center p-4 hover:shadow-md transition-shadow cursor-pointer group">
                <Music className="w-8 h-8 mx-auto mb-2 text-primary group-hover:text-accent transition-colors" />
                <h3 className="text-sm font-medium">{subject}</h3>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Students Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear from students who started their musical journey with our trial classes
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-muted-foreground mb-4 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="border-t pt-4">
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.age} • {testimonial.instrument}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trial Booking Form */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <TrialBookingForm />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our trial classes
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">How long is the trial class?</h3>
              <p className="text-muted-foreground">
                Our trial classes are typically 30-45 minutes long, giving you enough time to experience our teaching style and get a feel for the instrument.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">What should I bring to the trial class?</h3>
              <p className="text-muted-foreground">
                Just bring yourself and a positive attitude! We provide all instruments and materials. If you have your own instrument, feel free to bring it.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Is there any obligation after the trial?</h3>
              <p className="text-muted-foreground">
                Absolutely not! The trial class is completely free with no strings attached. We want you to make an informed decision about your musical education.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Can I try multiple instruments?</h3>
              <p className="text-muted-foreground">
                Yes! If you're unsure about which instrument to choose, we can arrange trial classes for multiple instruments to help you decide.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">How soon can I schedule my trial class?</h3>
              <p className="text-muted-foreground">
                We typically contact you within 24 hours to schedule your trial class. We'll work with your schedule to find the best time.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Musical Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Book your free trial class today and discover the joy of music with expert guidance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100">
              <Link to="#trial-form">
                <Gift className="w-5 h-5 mr-2" />
                Book Free Trial
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
              <Link to="/fees">
                <ArrowRight className="w-5 h-5 mr-2" />
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
      <WhatsAppChat />
    </div>
  );
};

export default TrialClassesPage;


