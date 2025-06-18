
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string;
  created_at: string;
}

const NewsDetail = () => {
  const { slug } = useParams();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchNewsItem();
    }
  }, [slug]);

  const fetchNewsItem = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Error fetching news item:', error);
        toast({
          title: "Error",
          description: "News article not found",
          variant: "destructive",
        });
        return;
      }

      setNewsItem(data);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Loading article...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <Button asChild>
              <Link to="/news">Back to News</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Button variant="outline" asChild className="mb-6">
            <Link to="/news">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Link>
          </Button>
          
          <article className="max-w-4xl mx-auto">
            {newsItem.image_url && (
              <div className="h-64 md:h-96 bg-cover bg-center rounded-lg mb-6" 
                   style={{ backgroundImage: `url(${newsItem.image_url})` }}>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Calendar className="h-4 w-4" />
              <span>{new Date(newsItem.created_at).toLocaleDateString()}</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-6">{newsItem.title}</h1>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-lg leading-relaxed">
                {newsItem.content}
              </div>
            </div>
          </article>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default NewsDetail;
