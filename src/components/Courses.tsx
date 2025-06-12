
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Guitar, Headphones, Mic } from "lucide-react";

const courses = [
  {
    icon: Music,
    name: "Piano & Keyboard",
    description: "Master the keys with our comprehensive piano and keyboard lessons",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM"
  },
  {
    icon: Guitar,
    name: "Guitar",
    description: "Learn acoustic and electric guitar from beginner to advanced",
    level: "All Levels", 
    duration: "Mon-Fri: 7AM-7PM"
  },
  {
    icon: Mic,
    name: "Voice Training",
    description: "Develop your vocal skills with professional voice coaching",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM"
  },
  {
    icon: Music,
    name: "Violin",
    description: "Classical and contemporary violin instruction",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM"
  },
  {
    icon: Headphones,
    name: "Saxophone",
    description: "Jazz, classical, and contemporary saxophone lessons",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM"
  },
  {
    icon: Music,
    name: "Trumpet & Recorder",
    description: "Brass and wind instrument instruction",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM"
  },
  {
    icon: Music,
    name: "Music Theory",
    description: "Comprehensive music theory and composition",
    level: "All Levels",
    duration: "Mon-Fri: 7AM-7PM"
  },
  {
    icon: Music,
    name: "Weekend Classes",
    description: "Special weekend sessions for busy schedules",
    level: "All Levels",
    duration: "Sun: From Noon"
  }
];

const Courses = () => {
  return (
    <section id="courses" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">We Offer Courses In:</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive music education for students aged 3 years and above
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div className="mx-auto p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <course.icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-lg">{course.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">{course.description}</p>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-primary">{course.level}</p>
                  <p className="text-xs text-muted-foreground">{course.duration}</p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="bg-secondary/10 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-primary mb-2">INTAKE</h3>
            <p className="text-lg font-semibold">IN PROGRESS</p>
            <Button className="mt-4 bg-primary hover:bg-primary/90">
              Register Today
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Courses;
