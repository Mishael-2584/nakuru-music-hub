
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Piano, Guitar, Mic, Music, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CoursesTeaser = () => {
  const navigate = useNavigate();

  const featuredCourses = [
    {
      icon: Piano,
      name: "Piano & Keyboard",
      description: "Master the keys with comprehensive lessons",
      color: "from-primary to-accent"
    },
    {
      icon: Guitar,
      name: "Guitar Lessons",
      description: "Acoustic and electric guitar mastery",
      color: "from-accent to-secondary"
    },
    {
      icon: Mic,
      name: "Voice Training",
      description: "Develop your unique vocal style",
      color: "from-secondary to-primary"
    },
    {
      icon: Music,
      name: "Music Production",
      description: "Professional recording and production",
      color: "from-primary to-secondary"
    }
  ];

  return (
    <section id="courses" className="py-20 bg-gradient-to-br from-muted/30 via-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Popular Programs
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Start your musical journey with our most popular courses
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {featuredCourses.map((course, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto p-4 bg-gradient-to-r ${course.color} rounded-full w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg mb-4`}>
                  <course.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">{course.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
            onClick={() => navigate('/courses')}
          >
            View All Courses
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CoursesTeaser;
