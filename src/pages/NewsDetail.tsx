import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SocialShare from "@/components/SocialShare";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import WhatsAppChat from "@/components/WhatsAppChat";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image_url: string;
  created_at: string;
  slug: string;
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

  const currentUrl = window.location.href;
  const shareDescription = newsItem.excerpt || newsItem.content.substring(0, 150) + '...';

  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-32 lg:pt-36 pb-8">
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
            
            <div className="prose max-w-none mb-8">
              <div 
                className="prose prose-lg max-w-none prose-headings:text-foreground prose-headings:font-bold prose-h1:text-3xl prose-h1:mb-6 prose-h2:text-2xl prose-h2:mb-4 prose-h3:text-xl prose-h3:mb-3 prose-p:text-base prose-p:leading-relaxed prose-p:mb-4 prose-p:text-muted-foreground prose-strong:text-foreground prose-strong:font-semibold prose-ul:my-4 prose-ol:my-4 prose-li:mb-2 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-hr:my-8 prose-hr:border-gray-200 prose-a:text-blue-600 prose-a:font-medium prose-a:underline prose-a:decoration-blue-600 prose-a:decoration-2 hover:prose-a:text-blue-800 hover:prose-a:decoration-blue-800"
                dangerouslySetInnerHTML={{ __html: newsItem.content }}
              />
            </div>

            {/* Social Share Section */}
            <div className="border-t pt-8 mt-8">
              <SocialShare
                url={currentUrl}
                title={newsItem.title}
                description={shareDescription}
                imageUrl={newsItem.image_url}
                className="bg-gray-50 p-6 rounded-lg"
              />
            </div>
          </article>

          {/* Floating share button for mobile */}
          <div className="md:hidden">
            <SocialShare
              url={currentUrl}
              title={newsItem.title}
              description={shareDescription}
              imageUrl={newsItem.image_url}
              variant="floating"
            />
          </div>
        </div>
      </section>
      
      <Footer />
      <WhatsAppChat />
    </div>
  );
};

export default NewsDetail;
