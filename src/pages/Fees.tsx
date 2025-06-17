
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Trophy, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Fee {
  id: string;
  course_type: string;
  course_name: string;
  price: number;
  duration: string | null;
  description: string | null;
}

const FeesPage = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFees = async () => {
      const { data, error } = await supabase
        .from('fees')
        .select('*')
        .eq('is_active', true)
        .order('course_type, price');

      if (error) {
        console.error('Error fetching fees:', error);
      } else {
        setFees(data || []);
      }
      setIsLoading(false);
    };

    fetchFees();
  }, []);

  const getCourseTypeColor = (type: string) => {
    switch (type) {
      case 'music':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'production':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'art':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCourseTypeIcon = (type: string) => {
    switch (type) {
      case 'music':
        return <Music className="h-5 w-5" />;
      case 'production':
        return <Star className="h-5 w-5" />;
      case 'art':
        return <Trophy className="h-5 w-5" />;
      default:
        return <Music className="h-5 w-5" />;
    }
  };

  const groupedFees = fees.reduce((acc, fee) => {
    if (!acc[fee.course_type]) {
      acc[fee.course_type] = [];
    }
    acc[fee.course_type].push(fee);
    return acc;
  }, {} as Record<string, Fee[]>);

  const handleEnrollClick = () => {
    navigate('/', { replace: true });
    setTimeout(() => {
      const element = document.getElementById('registration');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <section className="py-24 bg-gradient-to-br from-accent/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="text-lg text-muted-foreground">Loading fee structure...</div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Course Fees & Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transparent, affordable pricing for world-class music education. 
              Invest in your musical journey with flexible payment options.
            </p>
          </div>

          {/* Key Benefits */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Hidden Fees</h3>
              <p className="text-muted-foreground text-sm">All costs included in the quoted price</p>
            </div>
            <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
              <Star className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Flexible Payments</h3>
              <p className="text-muted-foreground text-sm">Monthly, quarterly, or annual options</p>
            </div>
            <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
              <Trophy className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Best Value</h3>
              <p className="text-muted-foreground text-sm">Quality education at competitive rates</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fees Section */}
      <section className="py-16 bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="space-y-16">
            {Object.entries(groupedFees).map(([courseType, courseFees]) => (
              <div key={courseType}>
                <div className="text-center mb-12">
                  <Badge className={`text-lg px-6 py-3 border-2 ${getCourseTypeColor(courseType)} mb-4`}>
                    <span className="flex items-center gap-2">
                      {getCourseTypeIcon(courseType)}
                      {courseType.charAt(0).toUpperCase() + courseType.slice(1)} Courses
                    </span>
                  </Badge>
                  <h2 className="text-3xl font-bold text-foreground">
                    {courseType === 'music' ? 'Musical Instruments & Theory' : 
                     courseType === 'production' ? 'Audio-Visual Production' : 
                     'Creative Arts & Design'}
                  </h2>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {courseFees.map((fee) => (
                    <Card key={fee.id} className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 bg-white/90 backdrop-blur-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent"></div>
                      
                      <CardHeader className="text-center pb-4">
                        <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {fee.course_name}
                        </CardTitle>
                        <div className="text-4xl font-bold text-primary mt-4">
                          KSh {fee.price.toLocaleString()}
                        </div>
                        {fee.duration && (
                          <p className="text-sm text-muted-foreground font-medium bg-primary/5 px-3 py-1 rounded-full">
                            {fee.duration}
                          </p>
                        )}
                      </CardHeader>
                      
                      <CardContent className="text-center space-y-6">
                        {fee.description && (
                          <p className="text-muted-foreground leading-relaxed">{fee.description}</p>
                        )}
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            Professional instruction
                          </div>
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            Practice room access
                          </div>
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            Performance opportunities
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 group-hover:scale-105 transition-all duration-300 shadow-lg"
                          onClick={handleEnrollClick}
                        >
                          Enroll Now
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-16 p-8 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-3xl">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Special Offers & Discounts
            </h3>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto text-sm text-muted-foreground">
              <p>• 10% discount for siblings enrolled together</p>
              <p>• 15% discount for annual payments</p>
              <p>• Group lesson discounts available</p>
              <p>• Early bird registration discounts</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeesPage;
