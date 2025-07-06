import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import { 
  Music, 
  Guitar, 
  Piano, 
  Mic, 
  Drum, 
  Code, 
  Palette, 
  Users, 
  Star, 
  Award,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Instagram,
  Facebook,
  Twitter
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  specialties: string[];
  experience: string;
  education: string;
  contact: {
    email: string;
    phone: string;
    location: string;
  };
  social: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    github?: string;
  };
  achievements: string[];
  categories: ('leadership' | 'teaching' | 'support' | 'admin')[];
}

const Team = () => {
  const [activeTab, setActiveTab] = useState("all");

  const teamMembers: TeamMember[] = [
    {
      id: "1",
      name: "Musumba Collince",
      role: "Founder, Director & Senior Music Teacher",
      image: "/lovable-uploads/founder.jpg",
      bio: "Passionate music educator and entrepreneur with over 15 years of experience in music education. Founded Damon Music Academy with the vision of making quality music education accessible to all. Specializes in piano, guitar, and music theory instruction.",
      specialties: ["Piano", "Guitar", "Music Theory", "Composition", "Academy Management", "Vocal Training"],
      experience: "15+ years in music education and academy management",
      education: "Bachelor of Music, Music Education",
      contact: {
        email: "musumba@damonmusicacademy.com",
        phone: "+254 700 000 000",
        location: "Nakuru, Kenya"
      },
      social: {
        linkedin: "#",
        instagram: "#",
        facebook: "#"
      },
      achievements: [
        "Founded Damon Music Academy in 2018",
        "Trained over 500 students in music",
        "Recipient of Music Education Excellence Award 2022",
        "Published composer with 3 original compositions",
        "Certified ABRSM Examiner",
        "Specialist in classical and contemporary music"
      ],
      categories: ["leadership", "teaching", "admin"]
    },
    {
      id: "2",
      name: "Thomas Machache Tsuma",
      role: "Bass Guitarist & Sound Engineer",
      image: "/lovable-uploads/soundengineer.jpg",
      bio: "Experienced bass guitarist and sound engineer with expertise in live sound, studio recording, and music production. Passionate about creating exceptional audio experiences and teaching the next generation of sound professionals.",
      specialties: ["Bass Guitar", "Live Sound Engineering", "Studio Recording", "Music Production", "Audio Mixing"],
      experience: "12+ years in live sound and studio recording",
      education: "Diploma in Sound Engineering, Music Production",
      contact: {
        email: "thomas@damonmusicacademy.com",
        phone: "+254 700 000 001",
        location: "Nakuru, Kenya"
      },
      social: {
        linkedin: "#",
        instagram: "#",
        facebook: "#"
      },
      achievements: [
        "Engineered over 200 live performances",
        "Specialist in bass guitar instruction",
        "Produced 5 studio albums",
        "Expert in digital and analog sound systems",
        "Trained 100+ sound engineering students"
      ],
      categories: ["teaching"]
    },
    {
      id: "3",
      name: "Mishael Gebre",
      role: "Web Designer & Programmer",
      image: "/lovable-uploads/mishael.jpg",
      bio: "Creative web designer and full-stack developer with expertise in modern web technologies. Passionate about creating beautiful, functional, and user-friendly digital experiences.",
      specialties: ["Web Design", "Frontend Development", "Backend Development", "UI/UX Design"],
      experience: "5+ years in web development and design",
      education: "Bachelor of Computer Science, Web Development",
      contact: {
        email: "mishaelgebre@gmail.com",
        phone: "+254 722 161 486",
        location: "Nakuru, Kenya"
      },
      social: {
        linkedin: "https://ng.linkedin.com/in/mishael-worancha-7b0b47207",
        github: "https://github.com/Mishael-2584",
        instagram: "https://www.instagram.com/m1sha3l/"
      },
      achievements: [
        "Designed and developed academy website",
        "Expert in React, TypeScript, and modern web technologies",
        "Created multiple successful web applications",
        "Specialist in responsive design and accessibility"
      ],
      categories: ["teaching", "support"]
    }
  ];

  const filteredMembers = activeTab === "all" 
    ? teamMembers 
    : teamMembers.filter(member => member.categories.includes(activeTab as 'leadership' | 'teaching' | 'support' | 'admin'));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'leadership': return <Star className="w-4 h-4" />;
      case 'teaching': return <Music className="w-4 h-4" />;
      case 'support': return <Users className="w-4 h-4" />;
      case 'admin': return <Award className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'leadership': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'teaching': return 'bg-gradient-to-r from-blue-500 to-purple-500';
      case 'support': return 'bg-gradient-to-r from-green-500 to-teal-500';
      case 'admin': return 'bg-gradient-to-r from-pink-500 to-red-500';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-[#f8f6ff] via-[#f9f7fd] to-[#f6f8ff] py-0 px-0">
        <div className="max-w-7xl mx-auto pt-32 pb-20 px-4 md:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-4">
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent leading-tight">
                Our Team
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Meet the passionate professionals behind Damon Music Academy
              </p>
            </div>
          </div>

          {/* Team Categories */}
          <div className="mb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white/90 shadow rounded-full p-1">
                <TabsTrigger value="all" className="rounded-full font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  All Team
                </TabsTrigger>
                <TabsTrigger value="leadership" className="rounded-full font-semibold data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700">
                  Leadership
                </TabsTrigger>
                <TabsTrigger value="teaching" className="rounded-full font-semibold data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  Teaching
                </TabsTrigger>
                <TabsTrigger value="support" className="rounded-full font-semibold data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                  Support
                </TabsTrigger>
                <TabsTrigger value="admin" className="rounded-full font-semibold data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700">
                  Admin
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/95 overflow-hidden">
                <div className="relative">
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        member.id === "1" || member.id === "2" 
                          ? "object-top" 
                          : ""
                      }`}
                    />
                  </div>
                  <div className={`absolute top-4 right-4 ${getCategoryColor(member.categories[0])} text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                    {getCategoryIcon(member.categories[0])}
                    {member.categories[0].charAt(0).toUpperCase() + member.categories[0].slice(1)}
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold text-gray-900">{member.name}</CardTitle>
                  <CardDescription className="text-primary font-semibold">{member.role}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-3">{member.bio}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-2">Specialties</h4>
                      <div className="flex flex-wrap gap-1">
                        {member.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-2">Experience</h4>
                      <p className="text-xs text-gray-600">{member.experience}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-2">Key Achievements</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {member.achievements.slice(0, 2).map((achievement, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Award className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-600">{member.contact.email}</span>
                      </div>
                      <div className="flex gap-2">
                        {member.social.linkedin && (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Linkedin className="w-4 h-4" />
                          </Button>
                        )}
                        {member.social.instagram && (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Instagram className="w-4 h-4" />
                          </Button>
                        )}
                        {member.social.facebook && (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Facebook className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-0">
              <CardContent className="py-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Team</h2>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                  We're always looking for passionate music educators and professionals to join our growing team. 
                  If you share our vision for quality music education, we'd love to hear from you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    <Mail className="w-5 h-5 mr-2" />
                    Send Application
                  </Button>
                  <Button size="lg" variant="outline">
                    <Phone className="w-5 h-5 mr-2" />
                    Contact Us
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
};

export default Team; 