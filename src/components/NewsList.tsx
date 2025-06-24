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
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Latest News & Updates
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Stay updated with the latest happenings, events, and announcements from Damon Music Academy
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <Card key={item.id} className="flex flex-col rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group bg-white">
              <CardHeader className="p-0">
                {item.image_url && (
                  <Link to={`/news/${item.slug}`} className="block h-48 overflow-hidden">
                    <div className="h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110" 
                         style={{ backgroundImage: `url(${item.image_url})` }}>
                    </div>
                  </Link>
                )}
              </CardHeader>
              <CardContent className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                   {item.is_featured && (
                    <>
                      <span className="mx-1">·</span>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Featured
                      </Badge>
                    </>
                  )}
                </div>
                
                <h3 className="text-xl font-bold mb-3 flex-grow group-hover:text-primary transition-colors">
                  <Link to={`/news/${item.slug}`}>
                    {item.title}
                  </Link>
                </h3>
                
                <p className="text-muted-foreground line-clamp-3 mb-4">
                  {item.excerpt ? (
                    <span dangerouslySetInnerHTML={{ __html: item.excerpt }} />
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: item.content.substring(0, 150) + '...' }} />
                  )}
                </p>
                
                <Link 
                  to={`/news/${item.slug}`} 
                  className="inline-block mt-auto text-primary font-semibold hover:underline"
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
