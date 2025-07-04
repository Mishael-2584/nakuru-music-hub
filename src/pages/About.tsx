
import Header from "@/components/Header";
import About from "@/components/About";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-24 py-20 bg-gradient-to-br from-blue-900/20 via-indigo-900/20 to-purple-900/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/lovable-uploads/65de1b46-84a6-446b-8225-6359d2d2027d.png')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              About Damon Music Academy
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Nurturing musical excellence and creativity since our founding
            </p>
          </div>
        </div>
      </section>

      <About />
      
      <Footer />
      <WhatsAppChat />
    </div>
  );
};

export default AboutPage;
