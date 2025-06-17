
import { Card, CardContent } from "@/components/ui/card";
import { Award, Star, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ExamBody {
  id: string;
  name: string;
  abbreviation: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
}

const ExamBodies = () => {
  const [examBodies, setExamBodies] = useState<ExamBody[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExamBodies = async () => {
      const { data, error } = await supabase
        .from('exam_bodies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching exam bodies:', error);
      } else {
        setExamBodies(data || []);
      }
      setIsLoading(false);
    };

    fetchExamBodies();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-lg text-muted-foreground">Loading certifications...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-primary to-accent rounded-full shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Internationally Recognized Certifications
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Damon Music Academy is authorized to prepare students for internationally recognized music examinations
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {examBodies.map((examBody) => (
            <Card key={examBody.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105 text-center">
              <CardContent className="p-8">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gradient-to-r from-accent to-secondary rounded-full shadow-lg">
                    <Award className="h-10 w-10 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-primary mb-2">{examBody.abbreviation}</h3>
                <h4 className="text-lg font-semibold text-muted-foreground mb-4">{examBody.name}</h4>
                
                {examBody.description && (
                  <p className="text-sm text-muted-foreground mb-4">{examBody.description}</p>
                )}
                
                <div className="flex justify-center items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">Globally Recognized</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg">
            <Award className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Preparing students for excellence since 2014
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExamBodies;
