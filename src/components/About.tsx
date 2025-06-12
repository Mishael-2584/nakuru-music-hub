
import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, Music, Calendar } from "lucide-react";

const stats = [
  {
    icon: Users,
    number: "500+",
    label: "Active Students",
    description: "Students of all ages learning music"
  },
  {
    icon: Music,
    number: "10+",
    label: "Instruments",
    description: "Wide variety of musical instruments"
  },
  {
    icon: Award,
    number: "15+",
    label: "Expert Instructors",
    description: "Professional and experienced teachers"
  },
  {
    icon: Calendar,
    number: "6",
    label: "Days a Week",
    description: "Flexible scheduling options"
  }
];

const About = () => {
  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold">About Damon Music Academy</h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="text-lg leading-relaxed">
                Located in the heart of Nakuru, Kenya, Damon Music Academy is dedicated to 
                nurturing musical talent and providing exceptional music education to students 
                of all ages and skill levels.
              </p>
              <p>
                Our academy offers a comprehensive range of music courses including piano, 
                guitar, voice training, violin, saxophone, trumpet, recorder, and music theory. 
                We believe that music is a universal language that brings people together and 
                enriches lives.
              </p>
              <p>
                With flexible scheduling options including weekday classes from 7AM to 7PM 
                and weekend sessions starting from noon on Sundays, we make music education 
                accessible to everyone.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 space-y-3">
                  <div className="mx-auto p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <stat.icon className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-3xl font-bold text-primary">{stat.number}</h3>
                    <p className="font-semibold">{stat.label}</p>
                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
