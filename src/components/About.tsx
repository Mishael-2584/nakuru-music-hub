import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, Music, Calendar, Heart, Star, Globe, Target, Sparkles, GraduationCap, Mic, Camera, Video, MonitorPlay, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ProgramsCarousel } from "./ProgramsCarousel";

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
            Where Creativity Finds Its Voice
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600">
            Welcome to Damon Music Academy, Nakuru's premier destination for music, creative arts, and digital technology. Since 2016, our academy has been a vibrant hub where passion meets purpose, and where the unique potential of every student is celebrated and nurtured.
          </p>
        </div>
      </div>

      {/* Global Online Campus & Nairobi Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 via-white to-purple-50 border-y border-primary/10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg mb-4 md:mb-0">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Learn With Us, From Anywhere in the World</h2>
            <p className="text-lg text-gray-700 mb-2">
              To make our unique creative education more accessible, we are proud to offer new ways to join the Damon Music Academy community.
            </p>
            <div className="mb-2">
              <span className="font-semibold text-primary">Our Global Online Campus</span>
              <span className="block text-gray-700">Join our global classroom. Our online program connects students from anywhere in the world with our expert instructors in Kenya. Through live, interactive sessions, you can access our unique curriculum in music, arts, and tech, no matter your location.</span>
            </div>
            <div>
              <span className="font-semibold text-primary">Now in Nairobi</span>
              <span className="block text-gray-700">We are thrilled to announce that we are now offering in-person classes in Nairobi. Led by our top faculty, we're bringing the same passion and vibrant creative community that defines our Nakuru campus to students in the city.</span>
            </div>
          </div>
        </div>
      </section>

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
                Our philosophy is simple yet profound: <strong className="text-gray-800">No one should leave the same way they came.</strong> We believe everyone has a deep well of creativity waiting to be unlocked. That's why we’ve built an encouraging, growth-focused environment where you will feel supported and inspired every step of your journey.
              </p>
              <p className="text-gray-600 leading-relaxed">
                What truly sets us apart are our tutors. They are more than just teachers; they are passionate mentors dedicated to igniting the creative spark in every student. Whether in a music lesson, a design session, or a coding class, their mission is to guide and empower. The skills and confidence our students build here will profoundly shape the world they lead tomorrow.
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
          {/* Carousel for Programs */}
          <ProgramsCarousel />
        </div>
      </section>

      {/* Professional AV Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary to-accent p-8 md:p-12 rounded-2xl grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-white" />
                <h2 className="text-3xl font-bold text-white">Your Vision, Amplified.</h2>
              </div>
              <p className="text-lg text-white/90">
                Our professional AV division offers expert production services for events, brands, and creators. We combine a skilled creative team with high-quality gear to bring your vision to life.
              </p>
              <div className="mt-4">
                <p className="text-white/90 font-semibold mb-2">Our services include:</p>
                <ul className="space-y-1 text-white/80">
                  <li>• Live Sound & Event Production</li>
                  <li>• Professional Livestreaming Services</li>
                  <li>• Event Videography & Photography</li>
                  <li>• Podcast & Voice-Over Recording</li>
                  <li>• Commercial Audio Production</li>
                </ul>
              </div>
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
            <Link to="/services">
              Explore Our Services Today!
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default About;
