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
  // Category-specific information
  categoryInfo: {
    leadership?: {
      role: string;
      bio: string;
      specialties: string[];
      achievements: string[];
    };
    teaching?: {
      role: string;
      bio: string;
      specialties: string[];
      achievements: string[];
    };
    support?: {
      role: string;
      bio: string;
      specialties: string[];
      achievements: string[];
    };
    admin?: {
      role: string;
      bio: string;
      specialties: string[];
      achievements: string[];
    };
  };
}

const Team = () => {
  const [activeTab, setActiveTab] = useState("all");

  const teamMembers: TeamMember[] = [
    {
      id: "1",
      name: "Musumba Collince",
      role: "Founder & Director of Music & Media Production",
      image: "/lovable-uploads/founder2.jpg",
      bio: "Passionate music educator and entrepreneur with extensive experience in music education. Founded Damon Music Academy with the vision of making quality music education accessible to all. Specializes in piano, guitar, and music theory instruction.",
      specialties: ["Piano", "Guitar", "Music Theory", "Composition", "Academy Management", "Vocal Training"],
      experience: "Senior music educator and academy director",
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
        "Founded Damon Music Academy in 2016",
        "Trained over 500 students in music",
        "Recipient of Music Education Excellence Award 2022",
        "Published composer with 3 original compositions",
        "Certified ABRSM Examiner",
        "Specialist in classical and contemporary music"
      ],
      categories: ["leadership", "teaching"],
      categoryInfo: {
        leadership: {
          role: "Founder & Director of Music & Media Production",
          bio: "Passionate music educator and entrepreneur with extensive experience in music education. Founded Damon Music Academy with the vision of making quality music education accessible to all. Specializes in piano, guitar, and music theory instruction.",
          specialties: ["Piano", "Guitar", "Music Theory", "Composition", "Academy Management", "Vocal Training"],
          achievements: [
            "Founded Damon Music Academy in 2016",
            "Trained over 500 students in music",
            "Recipient of Music Education Excellence Award 2022",
            "Published composer with 3 original compositions",
            "Certified ABRSM Examiner",
            "Specialist in classical and contemporary music"
          ]
        },
        teaching: {
          role: "Founder & Director of Music & Media Production",
          bio: "Passionate music educator and entrepreneur with extensive experience in music education. Founded Damon Music Academy with the vision of making quality music education accessible to all. Specializes in piano, guitar, and music theory instruction.",
          specialties: ["Piano", "Guitar", "Music Theory", "Composition", "Academy Management", "Vocal Training"],
          achievements: [
            "Founded Damon Music Academy in 2016",
            "Trained over 500 students in music",
            "Recipient of Music Education Excellence Award 2022",
            "Published composer with 3 original compositions",
            "Certified ABRSM Examiner",
            "Specialist in classical and contemporary music"
          ]
        }
      }
    },
    {
      id: "4",
      name: "Nahurira Shiphrah",
      role: "Voice & Piano Instructor",
      image: "/lovable-uploads/shiphrah.jpg",
      bio: "Talented vocalist and pianist with a passion for developing musical talent. Specializes in classical and contemporary vocal techniques, piano instruction, and performance coaching. Director of the Children's Choir.",
      specialties: ["Voice Training", "Piano Instruction", "Performance Coaching", "Music Theory", "Vocal Technique", "Choir Direction"],
      experience: "Vocal and piano instructor",
      education: "Bachelor of Music, Vocal Performance & Piano",
      contact: {
        email: "shiphrah@damonmusicacademy.com",
        phone: "+254 700 000 003",
        location: "Nakuru, Kenya"
      },
      social: {
        linkedin: "#",
        instagram: "#",
        facebook: "#"
      },
      achievements: [
        "Specialist in classical and contemporary vocal techniques",
        "Trained 120+ students in voice and piano",
        "Performed at prestigious music festivals",
        "Developed innovative teaching methodologies",
        "Expert in vocal breathing and piano technique",
        "Director of the Children's Choir"
      ],
      categories: ["teaching", "leadership"],
      categoryInfo: {
        leadership: {
          role: "Head of Voice Ensembles",
          bio: "Experienced vocal director and ensemble leader with a passion for developing choral excellence. Specializes in vocal ensemble direction, choir management, and performance coordination. Leads multiple vocal groups and coordinates major performances.",
          specialties: ["Vocal Ensemble Direction", "Choir Management", "Performance Coordination", "Vocal Technique", "Choir Direction", "Ensemble Leadership"],
          achievements: [
            "Director of the Children's Choir",
            "Led 3 major vocal ensembles",
            "Coordinated 15+ choir performances",
            "Developed innovative ensemble training programs",
            "Expert in vocal ensemble dynamics",
            "Head of Voice Ensembles"
          ]
        },
        teaching: {
          role: "Voice & Piano Instructor",
          bio: "Talented vocalist and pianist with a passion for developing musical talent. Specializes in classical and contemporary vocal techniques, piano instruction, and performance coaching. Director of the Children's Choir.",
          specialties: ["Voice Training", "Piano Instruction", "Performance Coaching", "Music Theory", "Vocal Technique", "Choir Direction"],
          achievements: [
            "Specialist in classical and contemporary vocal techniques",
            "Trained 120+ students in voice and piano",
            "Performed at prestigious music festivals",
            "Developed innovative teaching methodologies",
            "Expert in vocal breathing and piano technique",
            "Director of the Children's Choir"
          ]
        }
      }
    },
    {
      id: "5",
      name: "Vincent Kipkoech",
      role: "Brass & Strings Instructor",
      image: "/lovable-uploads/vincent.jpg",
      bio: "Skilled brass and strings instructor with expertise in music production. Specializes in trumpet, violin, and music production techniques. Passionate about teaching both classical and contemporary music styles. Head of Instrument Ensemble.",
      specialties: ["Brass Instruments", "String Instruments", "Music Production", "Trumpet", "Violin", "Studio Recording", "Ensemble Direction"],
      experience: "Senior brass and strings instructor",
      education: "Graduate in Music Production",
      contact: {
        email: "vincent@damonmusicacademy.com",
        phone: "+254 700 000 004",
        location: "Nakuru, Kenya"
      },
      social: {
        linkedin: "#",
        instagram: "#",
        facebook: "#"
      },
      achievements: [
        "Expert in brass and string instrument instruction",
        "Specialist in music production and studio recording",
        "Trained 150+ students in brass and strings",
        "Produced 3 original music compositions",
        "Performed with renowned orchestras and bands",
        "Head of Instrument Ensemble"
      ],
      categories: ["teaching", "leadership"],
      categoryInfo: {
        leadership: {
          role: "Head of Instrument Ensembles",
          bio: "Experienced ensemble director and instrumental leader with expertise in coordinating multiple instrument groups. Specializes in ensemble direction, instrumental coordination, and performance management. Leads the academy's instrumental ensembles and coordinates major performances.",
          specialties: ["Ensemble Direction", "Instrumental Coordination", "Performance Management", "Brass Instruments", "String Instruments", "Ensemble Leadership"],
          achievements: [
            "Head of Instrument Ensemble",
            "Led 4 major instrumental ensembles",
            "Coordinated 20+ ensemble performances",
            "Developed comprehensive ensemble training programs",
            "Expert in instrumental ensemble dynamics",
            "Specialist in brass and string coordination"
          ]
        },
        teaching: {
          role: "Brass & Strings Instructor",
          bio: "Skilled brass and strings instructor with expertise in music production. Specializes in trumpet, violin, and music production techniques. Passionate about teaching both classical and contemporary music styles. Head of Instrument Ensemble.",
          specialties: ["Brass Instruments", "String Instruments", "Music Production", "Trumpet", "Violin", "Studio Recording", "Ensemble Direction"],
          achievements: [
            "Expert in brass and string instrument instruction",
            "Specialist in music production and studio recording",
            "Trained 150+ students in brass and strings",
            "Produced 3 original music compositions",
            "Performed with renowned orchestras and bands",
            "Head of Instrument Ensemble"
          ]
        }
      }
    },
    {
      id: "2",
      name: "Thomas Machache Tsuma",
      role: "Bass Guitarist & Sound Engineer",
      image: "/lovable-uploads/soundengineer.jpg",
      bio: "Experienced bass guitarist and sound engineer with expertise in live sound, studio recording, and music production. Passionate about creating exceptional audio experiences and teaching the next generation of sound professionals.",
      specialties: ["Bass Guitar", "Live Sound Engineering", "Studio Recording", "Music Production", "Audio Mixing"],
      experience: "Sound engineer and bass instructor",
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
      categories: ["teaching", "support"],
      categoryInfo: {
        teaching: {
          role: "Bass Guitarist & Sound Engineer",
          bio: "Experienced bass guitarist and sound engineer with expertise in live sound, studio recording, and music production. Passionate about creating exceptional audio experiences and teaching the next generation of sound professionals.",
          specialties: ["Bass Guitar", "Live Sound Engineering", "Studio Recording", "Music Production", "Audio Mixing"],
          achievements: [
            "Engineered over 200 live performances",
            "Specialist in bass guitar instruction",
            "Produced 5 studio albums",
            "Expert in digital and analog sound systems",
            "Trained 100+ sound engineering students"
          ]
        },
        support: {
          role: "FOH Engineer",
          bio: "Experienced Front of House engineer responsible for live sound mixing and audio system management during performances and events. Specializes in live sound engineering, audio mixing, and ensuring optimal sound quality for all academy events.",
          specialties: ["Live Sound Mixing", "FOH Engineering", "Audio System Management", "Live Performance Audio", "Sound Quality Control", "Event Audio Coordination"],
          achievements: [
            "FOH Engineer for all academy performances",
            "Manages live sound systems during events",
            "Ensures optimal sound quality for performances",
            "Coordinates audio setup for major events",
            "Expert in live sound mixing and control",
            "FOH Engineer for academy events"
          ]
        }
      }
    },
    {
      id: "3",
      name: "Mishael Gebre",
      role: "Web Designer & Programmer",
      image: "/lovable-uploads/mishael.jpg",
      bio: "Creative web designer and full-stack developer with expertise in modern web technologies. Passionate about creating beautiful, functional, and user-friendly digital experiences.",
      specialties: ["Web Design", "Frontend Development", "Backend Development", "UI/UX Design"],
      experience: "Web developer and designer",
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
      categories: ["teaching", "support"],
      categoryInfo: {
        teaching: {
          role: "Web Designer & Programmer",
          bio: "Creative web designer and full-stack developer with expertise in modern web technologies. Passionate about creating beautiful, functional, and user-friendly digital experiences.",
          specialties: ["Web Design", "Frontend Development", "Backend Development", "UI/UX Design"],
          achievements: [
            "Designed and developed academy website",
            "Expert in React, TypeScript, and modern web technologies",
            "Created multiple successful web applications",
            "Specialist in responsive design and accessibility"
          ]
        },
        support: {
          role: "IT Support & Technical Lead",
          bio: "Technical expert and IT support specialist responsible for maintaining the academy's digital infrastructure. Ensures smooth operation of all technical systems and provides support for digital learning platforms.",
          specialties: ["IT Support", "Technical Infrastructure", "Digital Platform Management", "System Maintenance", "Technical Troubleshooting"],
          achievements: [
            "Maintains academy's digital infrastructure",
            "Provides technical support for all systems",
            "Ensures smooth operation of digital platforms",
            "Expert in technical troubleshooting",
            "Manages IT security and data protection"
          ]
        }
      }
    },
    {
      id: "6",
      name: "Sydney Chitechi",
      role: "Saxophonist & Brass Instructor",
      image: "/lovable-uploads/sydney.jpg",
      bio: "Talented saxophonist and brass instructor with expertise in music production. Specializes in saxophone, brass instruments, and contemporary music styles. Passionate about teaching both classical and jazz techniques.",
      specialties: ["Saxophone", "Brass Instruments", "Music Production", "Jazz Techniques", "Classical Saxophone", "Studio Recording"],
      experience: "Saxophone and brass instructor",
      education: "Graduate in Music Production",
      contact: {
        email: "sydney@damonmusicacademy.com",
        phone: "+254 700 000 005",
        location: "Nakuru, Kenya"
      },
      social: {
        linkedin: "#",
        instagram: "#",
        facebook: "#"
      },
      achievements: [
        "Expert in saxophone and brass instrument instruction",
        "Specialist in jazz and contemporary music styles",
        "Trained 100+ students in saxophone and brass",
        "Produced 2 original jazz compositions",
        "Performed with renowned jazz ensembles",
        "Graduate in Music Production"
      ],
      categories: ["teaching"],
      categoryInfo: {
        teaching: {
          role: "Saxophonist & Brass Instructor",
          bio: "Talented saxophonist and brass instructor with expertise in music production. Specializes in saxophone, brass instruments, and contemporary music styles. Passionate about teaching both classical and jazz techniques.",
          specialties: ["Saxophone", "Brass Instruments", "Music Production", "Jazz Techniques", "Classical Saxophone", "Studio Recording"],
          achievements: [
            "Expert in saxophone and brass instrument instruction",
            "Specialist in jazz and contemporary music styles",
            "Trained 100+ students in saxophone and brass",
            "Produced 2 original jazz compositions",
            "Performed with renowned jazz ensembles",
            "Graduate in Music Production"
          ]
        }
      }
    },
    {
      id: "7",
      name: "Newton Egesa",
      role: "Drums & Percussions Instructor",
      image: "/lovable-uploads/newton.jpg",
      bio: "Skilled drummer and percussionist with expertise in various drumming styles and percussion techniques. Specializes in teaching rhythm, timing, and coordination. Passionate about developing students' musical foundation through percussion education.",
      specialties: ["Drum Kit", "Percussion Instruments", "Rhythm Training", "Timing Development", "Coordination Skills", "Drumming Styles"],
      experience: "Drummer and percussion instructor",
      education: "Diploma in Music Performance, Percussion",
      contact: {
        email: "newton@damonmusicacademy.com",
        phone: "+254 700 000 006",
        location: "Nakuru, Kenya"
      },
      social: {
        linkedin: "#",
        instagram: "#",
        facebook: "#"
      },
      achievements: [
        "Expert in drum kit and percussion instruction",
        "Trained 80+ students in drums and percussion",
        "Performed with renowned bands and ensembles",
        "Specialist in rhythm and timing development",
        "Developed innovative percussion teaching methods",
        "Expert in various drumming styles and techniques"
      ],
      categories: ["teaching"],
      categoryInfo: {
        teaching: {
          role: "Drums & Percussions Instructor",
          bio: "Skilled drummer and percussionist with expertise in various drumming styles and percussion techniques. Specializes in teaching rhythm, timing, and coordination. Passionate about developing students' musical foundation through percussion education.",
          specialties: ["Drum Kit", "Percussion Instruments", "Rhythm Training", "Timing Development", "Coordination Skills", "Drumming Styles"],
          achievements: [
            "Expert in drum kit and percussion instruction",
            "Trained 80+ students in drums and percussion",
            "Performed with renowned bands and ensembles",
            "Specialist in rhythm and timing development",
            "Developed innovative percussion teaching methods",
            "Expert in various drumming styles and techniques"
          ]
        }
      }
    },
    {
      id: "8",
      name: "Deejay Brixx",
      role: "Technical Support & Audio Specialist",
      image: "/lovable-uploads/brix.jpg",
      bio: "Experienced technical support specialist and audio equipment expert. Provides comprehensive technical support for all academy audio systems, equipment maintenance, and technical troubleshooting. Ensures smooth operation of all technical infrastructure.",
      specialties: ["Technical Support", "Audio Equipment", "System Maintenance", "Technical Troubleshooting", "Equipment Setup", "Audio Systems"],
      experience: "Technical support specialist and audio equipment expert",
      education: "Diploma in Audio Technology",
      contact: {
        email: "brixx@damonmusicacademy.com",
        phone: "+254 700 000 007",
        location: "Nakuru, Kenya"
      },
      social: {
        linkedin: "#",
        instagram: "#",
        facebook: "#"
      },
      achievements: [
        "Provides technical support for all academy systems",
        "Maintains audio equipment and technical infrastructure",
        "Expert in audio system troubleshooting",
        "Ensures smooth operation of technical systems",
        "Specialist in equipment setup and maintenance",
        "Technical support for all academy events"
      ],
      categories: ["support"],
      categoryInfo: {
        support: {
          role: "Technical Support & Audio Specialist",
          bio: "Experienced technical support specialist and audio equipment expert. Provides comprehensive technical support for all academy audio systems, equipment maintenance, and technical troubleshooting. Ensures smooth operation of all technical infrastructure.",
          specialties: ["Technical Support", "Audio Equipment", "System Maintenance", "Technical Troubleshooting", "Equipment Setup", "Audio Systems"],
          achievements: [
            "Provides technical support for all academy systems",
            "Maintains audio equipment and technical infrastructure",
            "Expert in audio system troubleshooting",
            "Ensures smooth operation of technical systems",
            "Specialist in equipment setup and maintenance",
            "Technical support for all academy events"
          ]
        }
      }
    },
    {
      id: "9",
      name: "Moses Ogoti",
      role: "Spoken Word Poet & Performance Artist",
      image: "/lovable-uploads/ogoti.jpg",
      bio: "Ogoti the Boychild is a spoken word poet, performer, Corporate MC and event curator who uses his voice to spark conversations on youth empowerment, mental health, and social change. He is the founder and CEO of Bleeding Rhymes Creatives, a platform that embraces creatives and pushes the boundaries of poetry and performance.",
      specialties: ["Spoken Word Poetry", "Performance Art", "Corporate MC", "Event Curation", "Youth Empowerment", "Creative Writing"],
      experience: "Spoken word poet and performance artist",
      education: "Bachelor of Pharmacy, Creative Arts",
      contact: {
        email: "ogoti@damonmusicacademy.com",
        phone: "+254 700 000 008",
        location: "Nakuru, Kenya"
      },
      social: {
        linkedin: "#",
        instagram: "#",
        facebook: "#"
      },
      achievements: [
        "Founder and CEO of Bleeding Rhymes Creatives",
        "Released debut album 'The First Chronicles of Ogoti the Boychild'",
        "Performed 4 successful concept shows",
        "Available on all digital streaming platforms",
        "Strong stage presence and storytelling gift",
        "Professional Pharmacist and Creative Artist"
      ],
      categories: ["teaching", "leadership"],
      categoryInfo: {
        leadership: {
          role: "Creative Arts Director",
          bio: "Experienced creative arts director and performance leader with expertise in spoken word poetry and event curation. Specializes in creative arts programming, performance coordination, and youth empowerment initiatives. Leads creative arts programs and coordinates performance events.",
          specialties: ["Creative Arts Direction", "Performance Coordination", "Event Curation", "Spoken Word Poetry", "Youth Empowerment", "Creative Programming"],
          achievements: [
            "Creative Arts Director",
            "Founder and CEO of Bleeding Rhymes Creatives",
            "Led 4 successful concept shows",
            "Developed youth empowerment programs",
            "Expert in creative arts coordination",
            "Specialist in performance event management"
          ]
        },
        teaching: {
          role: "Spoken Word Poet & Performance Artist",
          bio: "Ogoti the Boychild is a spoken word poet, performer, Corporate MC and event curator who uses his voice to spark conversations on youth empowerment, mental health, and social change. He is the founder and CEO of Bleeding Rhymes Creatives, a platform that embraces creatives and pushes the boundaries of poetry and performance.",
          specialties: ["Spoken Word Poetry", "Performance Art", "Corporate MC", "Event Curation", "Youth Empowerment", "Creative Writing"],
          achievements: [
            "Founder and CEO of Bleeding Rhymes Creatives",
            "Released debut album 'The First Chronicles of Ogoti the Boychild'",
            "Performed 4 successful concept shows",
            "Available on all digital streaming platforms",
            "Strong stage presence and storytelling gift",
            "Professional Pharmacist and Creative Artist"
          ]
        }
      }
    },
    {
      id: "10",
      name: "Academy Administration",
      role: "Official Administrative Contact",
      image: "/damon-logo.png",
      bio: "This office handles all business operations for the academy, including financial matters, student registration, and institutional records.",
      specialties: ["Finance & Accounting", "Enrollment", "Student Records", "Institutional Policy"],
      experience: "Official administrative contact for all business operations",
      education: "Academy Administration",
      contact: {
        email: "admin@damonmusicacademy.co.ke",
        phone: "+254 701 195 460",
        location: "Nakuru, Kenya"
      },
      social: {
        linkedin: "#",
        instagram: "#",
        facebook: "#"
      },
      achievements: [
        "Areas of Responsibility: Finance & Accounting, Enrollment, Student Records, Institutional Policy",
        "Contact: Please direct all administrative inquiries to our official email or phone number for prompt assistance",
        "Email: admin@damonmusicacademy.co.ke",
        "Phone: +254 701 195 460",
        "This office handles all business operations for the academy",
        "Official Administrative Contact"
      ],
      categories: ["admin"],
      categoryInfo: {
        admin: {
          role: "Official Administrative Contact",
          bio: "This office handles all business operations for the academy, including financial matters, student registration, and institutional records.",
          specialties: ["Finance & Accounting", "Enrollment", "Student Records", "Institutional Policy"],
          achievements: [
            "Areas of Responsibility: Finance & Accounting, Enrollment, Student Records, Institutional Policy",
            "Contact: Please direct all administrative inquiries to our official email or phone number for prompt assistance",
            "Email: admin@damonmusicacademy.co.ke",
            "Phone: +254 701 195 460",
            "This office handles all business operations for the academy",
            "Official Administrative Contact"
          ]
        }
      }
    }
  ];

  const filteredMembers = activeTab === "all" 
    ? teamMembers 
    : teamMembers.filter(member => member.categories.includes(activeTab as 'leadership' | 'teaching' | 'support' | 'admin'));

  // Function to get dynamic content based on category
  const getMemberContent = (member: TeamMember, category: string) => {
    if (category === "all") {
      return {
        role: member.role,
        bio: member.bio,
        specialties: member.specialties,
        achievements: member.achievements
      };
    }

    const categoryData = member.categoryInfo[category as keyof typeof member.categoryInfo];
    if (categoryData) {
      return {
        role: categoryData.role,
        bio: categoryData.bio,
        specialties: categoryData.specialties,
        achievements: categoryData.achievements
      };
    }

    // Fallback to default content
    return {
      role: member.role,
      bio: member.bio,
      specialties: member.specialties,
      achievements: member.achievements
    };
  };

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
            {filteredMembers.map((member) => {
              const content = getMemberContent(member, activeTab);
              return (
                <Card key={member.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/95 overflow-hidden">
                  <div className="relative">
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                          member.id === "1" || member.id === "2" || member.id === "3" || member.id === "4" || member.id === "5" || member.id === "6" || member.id === "7" || member.id === "8" || member.id === "9" || member.id === "10"
                            ? "object-top" 
                            : ""
                        }`}
                      />
                    </div>
                    <div className={`absolute top-4 right-4 ${getCategoryColor(activeTab === "all" ? member.categories[0] : activeTab)} text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                      {getCategoryIcon(activeTab === "all" ? member.categories[0] : activeTab)}
                      {(activeTab === "all" ? member.categories[0] : activeTab).charAt(0).toUpperCase() + (activeTab === "all" ? member.categories[0] : activeTab).slice(1)}
                    </div>
                    {activeTab === "all" && member.categories.length > 1 && (
                      <div className="absolute top-4 right-4 flex flex-col gap-1 mt-8">
                        {member.categories.slice(1).map((category, index) => (
                          <div key={index} className={`${getCategoryColor(category)} text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                            {getCategoryIcon(category)}
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold text-gray-900">{member.name}</CardTitle>
                    <CardDescription className="text-primary font-semibold">{content.role}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-3">{content.bio}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 mb-2">Specialties</h4>
                        <div className="flex flex-wrap gap-1">
                          {content.specialties.map((specialty, index) => (
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
                          {content.achievements.slice(0, 2).map((achievement, index) => (
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
              );
            })}
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-0">
              <CardContent className="py-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Team</h2>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                  Our team is a diverse blend of passionate educators and professionals dedicated to excellence in the creative arts and technology. 
                  If you are driven to inspire creativity and want to contribute to a vibrant learning community, we invite you to connect with us.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    <Mail className="w-5 h-5 mr-2" />
                    <a href="mailto:info@damonmusicacademy.com" className="text-white">Send Application</a>
                  </Button>
                  <Button size="lg" variant="outline">
                    <Phone className="w-5 h-5 mr-2" />
                    <a href="tel:+254701195460" className="text-gray-700">Contact Us</a>
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