
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Fee {
  id: string;
  course_type: string;
  course_name: string;
  price: number;
  duration: string | null;
  description: string | null;
}

const Fees = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        return 'bg-primary/10 text-primary';
      case 'production':
        return 'bg-purple-100 text-purple-800';
      case 'art':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedFees = fees.reduce((acc, fee) => {
    if (!acc[fee.course_type]) {
      acc[fee.course_type] = [];
    }
    acc[fee.course_type].push(fee);
    return acc;
  }, {} as Record<string, Fee[]>);

  if (isLoading) {
    return (
      <section className="py-24 bg-gradient-to-br from-accent/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-lg text-muted-foreground">Loading fee structure...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="fees" className="py-24 bg-gradient-to-br from-accent/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Course Fees
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transparent pricing for all our programs. Quality education at affordable rates.
          </p>
        </div>
        
        <div className="space-y-12">
          {Object.entries(groupedFees).map(([courseType, courseFees]) => (
            <div key={courseType}>
              <div className="text-center mb-8">
                <Badge className={`text-lg px-4 py-2 ${getCourseTypeColor(courseType)}`}>
                  {courseType.charAt(0).toUpperCase() + courseType.slice(1)} Courses
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courseFees.map((fee) => (
                  <Card key={fee.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-xl font-bold">{fee.course_name}</CardTitle>
                      <div className="text-3xl font-bold text-primary">
                        KSh {fee.price.toLocaleString()}
                      </div>
                      {fee.duration && (
                        <p className="text-sm text-muted-foreground">{fee.duration}</p>
                      )}
                    </CardHeader>
                    <CardContent className="text-center">
                      {fee.description && (
                        <p className="text-muted-foreground mb-6">{fee.description}</p>
                      )}
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                        onClick={() => {
                          const element = document.getElementById('registration');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
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
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            * Prices include individual instruction and access to practice rooms. Group discounts available.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Fees;
