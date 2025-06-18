
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  slug: string;
  is_featured: boolean;
  created_at: string;
}

const NewsList = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching news:', error);
        toast({
          title: "Error",
          description: "Failed to load news",
          variant: "destructive",
        });
        return;
      }

      setNews(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading news...</div>
        </div>
      </section>
    );
  }

  if (news.length === 0) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">No News Available</h3>
            <p className="text-muted-foreground">Check back soon for the latest updates!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <Card key={item.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
              <CardHeader className="p-0">
                {item.image_url && (
                  <div className="h-48 bg-cover bg-center rounded-t-lg" 
                       style={{ backgroundImage: `url(${item.image_url})` }}>
                    <div className="h-full bg-gradient-to-t from-black/60 to-transparent rounded-t-lg flex items-end p-4">
                      {item.is_featured && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  <Link to={`/news/${item.slug}`}>
                    {item.title}
                  </Link>
                </h3>
                
                <p className="text-muted-foreground line-clamp-3">
                  {item.excerpt || item.content.substring(0, 150) + '...'}
                </p>
                
                <Link 
                  to={`/news/${item.slug}`} 
                  className="inline-block mt-4 text-primary font-medium hover:underline"
                >
                  Read More →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsList;
