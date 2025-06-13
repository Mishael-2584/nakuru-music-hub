
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, Music } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Kimani",
    age: 16,
    instrument: "Piano",
    quote: "Damon Music Academy transformed my musical journey. The instructors are amazing and patient, helping me achieve my dream of playing classical pieces beautifully.",
    rating: 5,
    image: "🎹"
  },
  {
    name: "David Mwangi",
    age: 28,
    instrument: "Guitar",
    quote: "As an adult learner, I was nervous about starting guitar lessons. The flexible schedule and encouraging environment made all the difference. I'm now playing in a local band!",
    rating: 5,
    image: "🎸"
  },
  {
    name: "Grace Wanjiku",
    age: 12,
    instrument: "Voice",
    quote: "I love singing here! My voice coach helped me find my confidence and now I perform in school concerts. The academy feels like a second home to me.",
    rating: 5,
    image: "🎤"
  },
  {
    name: "John Ochieng",
    age: 35,
    instrument: "Saxophone",
    quote: "The jazz saxophone lessons here are incredible. The instructor's expertise and passion for music is infectious. I've learned more in 6 months than I thought possible.",
    rating: 5,
    image: "🎷"
  },
  {
    name: "Mary Akinyi",
    age: 14,
    instrument: "Violin",
    quote: "Learning violin seemed impossible until I joined Damon Music Academy. The step-by-step approach and supportive community helped me master this beautiful instrument.",
    rating: 5,
    image: "🎻"
  },
  {
    name: "Peter Kiprotich",
    age: 22,
    instrument: "Music Theory",
    quote: "The music theory classes opened up a whole new world for me. Now I understand the 'why' behind the music, not just the 'how'. It's made me a better musician overall.",
    rating: 5,
    image: "📚"
  }
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-secondary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-20 w-40 h-40 bg-secondary/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-10 right-10 w-56 h-56 bg-accent/5 rounded-full blur-3xl animate-float delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-float delay-500"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center shadow-2xl">
              <Quote className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium text-secondary uppercase tracking-wider">Student Stories</span>
          </div>
          
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
            Harmonious Testimonials
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Hear the inspiring stories from our musical family and discover how Damon Music Academy has transformed their musical journeys
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="group hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 border-0 bg-white/90 backdrop-blur-sm relative overflow-hidden">
              {/* Musical note decoration */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Music className="h-4 w-4 text-primary" />
              </div>
              
              <CardContent className="p-6 space-y-4">
                {/* Rating stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                  ))}
                </div>
                
                {/* Quote */}
                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 h-8 w-8 text-accent/20" />
                  <p className="text-muted-foreground leading-relaxed italic pl-6">
                    "{testimonial.quote}"
                  </p>
                </div>
                
                {/* Student info */}
                <div className="flex items-center gap-4 pt-4 border-t border-primary/10">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Age {testimonial.age} • {testimonial.instrument} Student
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Call to action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-3xl p-8 max-w-2xl mx-auto backdrop-blur-sm border border-primary/20 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-accent rounded-full animate-pulse delay-100"></div>
                <div className="w-3 h-3 bg-secondary rounded-full animate-pulse delay-200"></div>
              </div>
              
              <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Ready to Write Your Musical Story?
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Join hundreds of satisfied students who have discovered their musical passion at Damon Music Academy. 
                Your journey to musical excellence starts here!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Happy Students</div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-primary/20 to-accent/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">15+</div>
                  <div className="text-sm text-muted-foreground">Expert Instructors</div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-accent/20 to-secondary/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">10+</div>
                  <div className="text-sm text-muted-foreground">Instruments Taught</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
