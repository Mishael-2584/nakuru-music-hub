
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Mic, Camera, Piano, Guitar, Palette, Clock, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";

const CoursesTeaser = () => {
  const courses = [
    {
      id: 1,
      title: "Piano",
      description: "Master the keys with our comprehensive piano program for all skill levels.",
      icon: Piano,
      category: "Music",
      duration: "3-6 months",
      students: 150,
      rating: 4.9,
      price: "From KSh 8,000/month",
      image: "/lovable-uploads/65de1b46-84a6-446b-8225-6359d2d2027d.png",
      features: ["One-on-one lessons", "Group sessions", "Performance opportunities", "ABRSM certification prep"]
    },
    {
      id: 2,
      title: "Guitar",
      description: "Learn acoustic and electric guitar with modern teaching methods.",
      icon: Guitar,
      category: "Music",
      duration: "3-6 months",
      students: 120,
      rating: 4.8,
      price: "From KSh 7,000/month",
      image: "/lovable-uploads/40fee785-03dc-4548-8e48-b09291ee8f42.png",
      features: ["Beginner to advanced", "Multiple styles", "Song composition", "Recording techniques"]
    },
    {
      id: 3,
      title: "Voice Training",
      description: "Develop your vocal skills with professional voice coaching.",
      icon: Mic,
      category: "Music",
      duration: "4-8 months",
      students: 80,
      rating: 4.9,
      price: "From KSh 9,000/month",
      image: "/lovable-uploads/29861c9f-1df3-42f1-982f-ef38574fb617.png",
      features: ["Breath control", "Vocal range expansion", "Performance coaching", "Recording sessions"]
    },
    {
      id: 4,
      title: "Music Production",
      description: "Learn digital music production and sound engineering.",
      icon: Music,
      category: "Production",
      duration: "6-12 months",
      students: 60,
      rating: 4.7,
      price: "From KSh 12,000/month",
      image: "/lovable-uploads/70f23f35-6eb2-49a1-8bf6-677fe0c49746.png",
      features: ["Studio software", "Mixing & mastering", "Beat making", "Professional equipment"]
    },
    {
      id: 5,
      title: "Photography",
      description: "Capture moments with professional photography techniques.",
      icon: Camera,
      category: "Art",
      duration: "3-6 months",
      students: 45,
      rating: 4.6,
      price: "From KSh 10,000/month",
      image: "/lovable-uploads/31a53eab-3aed-45c3-b91e-339ed5bb7893.png",
      features: ["Digital photography", "Photo editing", "Portfolio development", "Exhibition opportunities"]
    },
    {
      id: 6,
      title: "Art & Design",
      description: "Express creativity through various art forms and design principles.",
      icon: Palette,
      category: "Art",
      duration: "4-8 months",
      students: 70,
      rating: 4.8,
      price: "From KSh 8,500/month",
      image: "/lovable-uploads/cc2f7a6b-1ce1-4921-a0b6-b29db99b5d4a.png",
      features: ["Traditional & digital art", "Design principles", "Portfolio creation", "Gallery exhibitions"]
    }
  ];

  const categoryColors = {
    Music: "bg-blue-100 text-blue-800",
    Production: "bg-purple-100 text-purple-800",
    Art: "bg-pink-100 text-pink-800"
  };

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Popular Programs
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover our most sought-after courses designed to nurture your creative talents and build professional skills
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {courses.map((course) => {
            const IconComponent = course.icon;
            return (
              <Card key={course.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm hover:scale-105">
                <CardHeader className="p-0">
                  <div className="h-48 bg-cover bg-center rounded-t-lg relative overflow-hidden"
                       style={{ backgroundImage: `url(${course.image})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <Badge className={categoryColors[course.category as keyof typeof categoryColors]}>
                        {course.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{course.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">{course.students}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{course.title}</CardTitle>
                  </div>
                  
                  <p className="text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="text-lg font-bold text-primary">{course.price}</div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {course.features.slice(0, 2).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold group-hover:scale-105 transition-all duration-200">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-all duration-200">
            <Link to="/courses">
              View All Courses
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CoursesTeaser;
