
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "Piano Student",
      initials: "SC",
      content: "The instructors at Damon Music Academy are absolutely incredible! My piano skills have improved dramatically in just 6 months. The personalized approach and supportive environment make all the difference.",
      rating: 5,
      location: "Nakuru"
    },
    {
      id: 2,
      name: "Michael Ochieng",
      role: "Guitar Student",
      initials: "MO",
      content: "I've been learning guitar here for over a year now, and I can't recommend this place enough. The teachers are patient, knowledgeable, and truly care about your progress. Best music school in Nakuru!",
      rating: 5,
      location: "Nakuru"
    },
    {
      id: 3,
      name: "Grace Wanjiku",
      role: "Voice Training Student",
      initials: "GW",
      content: "My daughter has been taking voice lessons here and her confidence has soared! The vocal coaches are professional and create such a positive learning environment. She looks forward to every lesson.",
      rating: 5,
      location: "Nakuru"
    },
    {
      id: 4,
      name: "David Kimani",
      role: "Music Production Student",
      initials: "DK",
      content: "The music production course exceeded my expectations. Modern equipment, experienced instructors, and hands-on learning. I'm now producing my own tracks professionally. Thank you Damon Music Academy!",
      rating: 5,
      location: "Nakuru"
    },
    {
      id: 5,
      name: "Mary Njeri",
      role: "Art Student",
      initials: "MN",
      content: "The art program here is fantastic! I've learned so much about different techniques and styles. The instructors are encouraging and help you find your unique artistic voice. Highly recommend!",
      rating: 5,
      location: "Nakuru"
    },
    {
      id: 6,
      name: "John Mwangi",
      role: "Photography Student",
      initials: "JM",
      content: "Learning photography at Damon has been life-changing. From basics to advanced techniques, the course is comprehensive. Now I'm working as a freelance photographer. Best investment I've made!",
      rating: 5,
      location: "Nakuru"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            What Our Students Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real testimonials from our amazing students who are excelling in their musical and creative journeys
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <div className="relative mb-6">
                  <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20" />
                  <p className="text-gray-700 leading-relaxed pl-6">
                    "{testimonial.content}"
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-xs text-primary font-medium">{testimonial.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
