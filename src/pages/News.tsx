import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsList from "@/components/NewsList";
import WhatsAppChat from "@/components/WhatsAppChat";

const News = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-24 md:pt-32 pb-20 bg-gradient-to-br from-emerald-900/20 via-teal-900/20 to-cyan-900/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://cdn.pixabay.com/photo/2016/02/01/00/56/news-1172463_1280.jpg')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Damon Music Academy Blog: Music, Arts & Creative Growth
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore expert articles, insightful tips, and program updates from our campuses in Nakuru and Nairobi, and our online learning platform.
            </p>
          </div>
        </div>
      </section>

      <NewsList />
      
      <Footer />
      <WhatsAppChat />
    </div>
  );
};

export default News;
