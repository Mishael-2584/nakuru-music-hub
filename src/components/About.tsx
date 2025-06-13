
import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, Music, Calendar, Heart, Star, Globe, Target } from "lucide-react";

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
    number: "6",
    label: "Days a Week",
    description: "Flexible scheduling options",
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

const About = () => {
  return (
    <section id="about" className="py-20 bg-gradient-to-br from-muted/20 via-background to-muted/10">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-primary uppercase tracking-wider">About Us</span>
              </div>
              
              <h2 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Damon Music Academy
              </h2>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Where musical dreams come to life in the heart of Nakuru, Kenya.
              </p>
            </div>
            
            <div className="space-y-6 text-muted-foreground">
              <p className="text-lg leading-relaxed">
                Located in the heart of Nakuru, Kenya, Damon Music Academy is dedicated to 
                nurturing musical talent and providing exceptional music education to students 
                of all ages and skill levels.
              </p>
              <p className="leading-relaxed">
                Our academy offers a comprehensive range of music courses including piano, 
                guitar, voice training, violin, saxophone, trumpet, recorder, and music theory. 
                We believe that music is a universal language that brings people together and 
                enriches lives.
              </p>
              <p className="leading-relaxed">
                With flexible scheduling options including weekday classes from 7AM to 7PM 
                and weekend sessions starting from noon on Sundays, we make music education 
                accessible to everyone.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2">
                <CardContent className="p-6 space-y-4 text-center">
                  <div className={`mx-auto p-4 bg-gradient-to-r ${stat.color} rounded-full w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {stat.number}
                    </h3>
                    <p className="font-semibold text-foreground">{stat.label}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{stat.description}</p>
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
