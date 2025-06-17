
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Headphones, Speaker, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Service {
  id: string;
  name: string;
  description: string;
  price_range: string | null;
  category: string;
  features: string[] | null;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category');

      if (error) {
        console.error('Error fetching services:', error);
      } else {
        setServices(data || []);
      }
      setIsLoading(false);
    };

    fetchServices();
  }, []);

  const getServiceIcon = (category: string) => {
    switch (category) {
      case 'production':
        return Headphones;
      case 'photography':
        return Camera;
      case 'rental':
        return Speaker;
      case 'instruments':
        return ShoppingCart;
      default:
        return Headphones;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'production':
        return 'from-purple-500 to-purple-600';
      case 'photography':
        return 'from-blue-500 to-blue-600';
      case 'rental':
        return 'from-green-500 to-green-600';
      case 'instruments':
        return 'from-orange-500 to-orange-600';
      default:
        return 'from-primary to-accent';
    }
  };

  if (isLoading) {
    return (
      <section className="py-24 bg-gradient-to-br from-secondary/5 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-lg text-muted-foreground">Loading our services...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-24 bg-gradient-to-br from-secondary/5 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Additional Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Beyond music education, we offer comprehensive creative services to support your artistic journey
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => {
            const IconComponent = getServiceIcon(service.category);
            return (
              <Card key={service.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 bg-gradient-to-r ${getCategoryColor(service.category)} rounded-full shadow-lg`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold">{service.name}</CardTitle>
                  {service.price_range && (
                    <p className="text-sm font-medium text-accent">{service.price_range}</p>
                  )}
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  
                  {service.features && (
                    <div className="mb-6">
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {service.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Button 
                    className={`w-full bg-gradient-to-r ${getCategoryColor(service.category)} hover:opacity-90`}
                    onClick={() => {
                      const element = document.getElementById('contact');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    Get Quote
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
