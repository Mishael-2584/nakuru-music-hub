import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, Music, Calendar, Heart, Star, Globe, Target, Sparkles, GraduationCap, Mic, Camera, Video, MonitorPlay, ChevronRight, Music2, Radio, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ProgramsCarousel } from "./ProgramsCarousel";
import { motion } from "framer-motion";

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
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
      {/* Floating Musical Notes Background - Removed for better readability */}

      {/* Hero Section - Enhanced */}
      <div className="relative pt-20 pb-32 overflow-hidden">
        {/* Static gradient background - removed animation for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"></div>
        
        {/* Decorative elements - static */}
        <div className="absolute top-20 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-50"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm text-primary font-semibold py-2 px-5 rounded-full text-sm mb-6 border border-primary/20 shadow-lg"
          >
            <Music className="w-4 h-4" />
            About Damon Music Academy
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-8"
          >
            <span className="text-blue-600">
              Where Creativity
            </span>
            <br />
            <span className="text-purple-600">
              Finds Its Voice
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-3xl mx-auto text-lg md:text-xl text-gray-700 leading-relaxed"
          >
            Welcome to <span className="font-semibold text-primary">Damon Music Academy</span>, Nakuru's premier destination for music, creative arts, and digital technology. Since <span className="font-semibold text-accent">2016</span>, our academy has been a vibrant hub where passion meets purpose, and where the unique potential of every student is celebrated and nurtured.
          </motion.p>
          
          {/* Decorative music wave - static after entrance */}
          <div className="mt-12 flex justify-center gap-1">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-gradient-to-t from-primary to-accent rounded-full"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${35 + (i % 3) * 15}px`, opacity: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.6 + i * 0.03,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Global Online Campus & Nairobi Section - Enhanced */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary/10 p-8 md:p-12 hover:shadow-primary/20 transition-all duration-500"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full blur-xl opacity-30"></div>
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary via-purple-500 to-accent shadow-2xl">
                  <Globe className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-primary">
                  Learn With Us, From Anywhere in the World
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  To make our unique creative education more accessible, we are proud to offer new ways to join the Damon Music Academy community.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg group">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="font-bold text-primary text-lg">Our Global Online Campus</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      Join our global classroom. Our online program connects students from anywhere in the world with our expert instructors in Kenya. Through live, interactive sessions, you can access our unique curriculum in music, arts, and tech, no matter your location.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg group">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                      <span className="font-bold text-accent text-lg">Now in Nairobi</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      We are thrilled to announce that we are now offering in-person classes in Nairobi. Led by our top faculty, we're bringing the same passion and vibrant creative community that defines our Nakuru campus to students in the city.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Damon is Different Section - Enhanced */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-50/30 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Your Search Ends Here: Why Damon is Different
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-2xl border-l-4 border-primary shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Our philosophy is simple yet profound: <strong className="text-primary font-bold">No one should leave the same way they came.</strong> We believe everyone has a deep well of creativity waiting to be unlocked. That's why we've built an encouraging, growth-focused environment where you will feel supported and inspired every step of your journey.
                  </p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-accent/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <p className="text-gray-700 leading-relaxed">
                    What truly sets us apart are our <span className="font-semibold text-accent">tutors</span>. They are more than just teachers; they are passionate mentors dedicated to igniting the creative spark in every student. Whether in a music lesson, a design session, or a coding class, their mission is to guide and empower. The skills and confidence our students build here will profoundly shape the world they lead tomorrow.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4 md:gap-6"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-50"></div>
                <img
                  src="/about-art-class.jpg"
                  alt="A teacher and students in an art class at Damon Music Academy"
                  className="relative rounded-2xl object-cover w-full h-full shadow-2xl border-4 border-white transition-transform duration-300 hover:scale-[1.02]"
                />
              </div>
              <div className="relative group mt-8">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-2xl blur-xl opacity-50"></div>
                <img
                  src="/about-happy-kids.jpg"
                  alt="Happy students of Damon Music Academy"
                  className="relative rounded-2xl object-cover w-full h-full shadow-2xl border-4 border-white transition-transform duration-300 hover:scale-[1.02]"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Programs Section - Enhanced */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/30 to-white"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-xl">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-primary">
                Your Creative Path Awaits: Our Programs
              </h2>
            </div>
            <div className="max-w-4xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-gradient-to-r from-primary/10 via-purple-50 to-accent/10 border-l-4 border-primary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300"
              >
                <h3 className="text-2xl font-bold text-primary mb-3 flex items-center justify-center gap-2">
                  <Music className="w-6 h-6" />
                  What We Do
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  From preparing students for prestigious international exams (ABRSM, Trinity, etc.) to producing compelling audio commercials, recording studio sessions, captivating event coverage, and seamless live streams, we cover the full spectrum of music and media.
                </p>
              </motion.div>
            </div>
          </motion.div>
          {/* Carousel for Programs */}
          <ProgramsCarousel />
        </div>
      </section>

      {/* Professional AV Services Section - Enhanced */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-2xl opacity-20"></div>
            <div className="relative bg-gradient-to-r from-primary via-purple-600 to-accent p-10 md:p-16 rounded-3xl shadow-2xl grid md:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Award className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white">Your Vision, Amplified.</h2>
                </div>
                <p className="text-xl text-white/95 leading-relaxed">
                  Our professional AV division offers expert production services for events, brands, and creators. We combine a skilled creative team with high-quality gear to bring your vision to life.
                </p>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <p className="text-white font-semibold mb-4 text-lg">Our services include:</p>
                  <ul className="space-y-3 text-white/90">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span>Live Sound & Event Production</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span>Professional Livestreaming Services</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span>Event Videography & Photography</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span>Podcast & Voice-Over Recording</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span>Commercial Audio Production</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="text-center md:text-right">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" variant="outline" className="text-primary bg-white hover:bg-white/90 text-lg px-8 py-6 shadow-xl" asChild>
                    <Link to="/services">
                      Learn More About AV Services
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-50"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-primary leading-tight">
              Ready to unleash your creative potential or elevate your event?
            </h2>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" className="text-lg px-10 py-7 shadow-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90" asChild>
                <Link to="/services">
                  Explore Our Services Today!
                  <ChevronRight className="w-6 h-6 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
