import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, Music, Calendar, Heart, Star, Globe, Target, Sparkles, GraduationCap, Mic, Camera, Video, MonitorPlay, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const stats = [
  {
    icon: Users,
    number: "500+",
    label: "Active Students",
    description: "Students of all ages learning music",
    color: "from-primary to-accent"
  },
  {
    icon: Music,
    number: "10+",
    label: "Instruments",
    description: "Wide variety of musical instruments",
    color: "from-accent to-secondary"
  },
  {
    icon: Award,
    number: "15+",
    label: "Expert Instructors",
    description: "Professional and experienced teachers",
    color: "from-secondary to-primary"
  },
  {
    icon: Calendar,
    number: "8",
    label: "Years Strong",
    description: "Since 2016, growing excellence",
    color: "from-primary to-secondary"
  }
];

const features = [
  {
    icon: Heart,
    title: "Passionate Teaching",
    description: "Our instructors bring love and enthusiasm to every lesson"
  },
  {
    icon: Star,
    title: "Proven Excellence",
    description: "Track record of nurturing successful musicians"
  },
  {
    icon: Globe,
    title: "Diverse Community",
    description: "Welcoming students from all backgrounds and cultures"
  },
  {
    icon: Target,
    title: "Goal-Oriented",
    description: "Personalized learning paths for every student"
  }
];

const programs = [
  {
    icon: Music,
    title: "Instrumental Music & Music Theory",
    description: "Personalized one-on-one lessons in piano, violin, guitar, voice, and more. We prepare students for prestigious international exams like ABRSM, LCM, and Rockschool, setting the stage for global recognition."
  },
  {
    icon: Mic,
    title: "Music Production",
    description: "Dive into the exciting world of recording, mixing, mastering, and creative sound design."
  },
  {
    icon: Camera,
    title: "Videography & Photography",
    description: "Learn to tell powerful stories through images and film, from capturing moments to professional editing."
  },
  {
    icon: MonitorPlay,
    title: "Live Sound",
    description: "Get hands-on experience with event sound setup, mixer operation, and live broadcasting."
  }
];

const About = () => {
  return (
    <div className="bg-gray-50 overflow-hidden">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/5 to-transparent pt-20 pb-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-4">
            About Damon Music Academy
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            Are you ready for a creative journey?
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600">
            Welcome to Damon Music Academy, Nakuru's premier destination for music and creative arts. Since our establishment in 2016, we've grown into a vibrant hub where passion meets purpose, and where every individual's unique potential is celebrated and nurtured.
          </p>
        </div>
      </div>

      {/* Why Damon is Different Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold text-gray-900">Your Search Ends Here: Why Damon is Different</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                At Damon, our philosophy is simple yet profound: <strong className="text-gray-800">No one should leave the same way they came.</strong> We firmly believe that everyone possesses an incredible capacity for creativity. That's why we've cultivated an encouraging, growth-focused, and creatively charged environment where you will feel supported and inspired every step of the way.
              </p>
              <p className="text-gray-600 leading-relaxed">
                What sets us apart? It's our deeply passionate and experienced tutors. They don't just teach; they mentor, guide, and ignite the spark within. We are especially devoted to empowering children and youth, knowing that the skills and confidence we instill today will profoundly shape the world they lead tomorrow.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:gap-6 items-center">
              <img
                src="/about-art-class.jpg"
                alt="A teacher and students in an art class at Damon Music Academy"
                className="rounded-2xl object-cover w-full h-full shadow-lg transform transition-transform duration-500 hover:scale-105"
              />
              <img
                src="/about-happy-kids.jpg"
                alt="Happy students of Damon Music Academy"
                className="rounded-2xl object-cover w-full h-full shadow-lg transform transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <GraduationCap className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold text-gray-900">Your Creative Path Awaits: Our Programs</h2>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="bg-primary/10 border-l-4 border-primary rounded-xl p-5 mb-2">
                <h3 className="text-xl font-bold text-primary mb-1">What We Do</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  From preparing students for prestigious international exams (ABRSM, Trinity, etc.) to producing compelling audio commercials, recording studio sessions, captivating event coverage, and seamless live streams, we cover the full spectrum of music and media.
                </p>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {programs.map((program) => (
              <Card key={program.title} className="bg-gray-50 border-0 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent text-white rounded-lg flex items-center justify-center">
                      <program.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{program.title}</h3>
                  <p className="text-gray-600">{program.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Professional AV Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary to-accent p-8 md:p-12 rounded-2xl grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-white" />
                <h2 className="text-3xl font-bold text-white">Beyond the Classroom: Professional Audio-Visual Services</h2>
              </div>
              <p className="text-lg text-white/90">
                Damon Music Academy is also your trusted partner for professional audio-visual services. Our skilled creative team, equipped with high-quality gear, transforms events and ideas into unforgettable experiences. From live sound and livestreaming to event coverage, podcasts, commercials, and voice-overs, we bring your vision to life with exceptional results.
              </p>
            </div>
            <div className="text-center md:text-right">
                <Button size="lg" variant="outline" className="text-primary bg-white hover:bg-white/90" asChild>
                    <Link to="/services">Learn More About AV Services</Link>
                </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to unleash your creative potential or elevate your event?</h2>
          <Button size="lg" asChild>
            <Link to="/#registration">
              Explore Our Programs & Services Today!
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default About;
