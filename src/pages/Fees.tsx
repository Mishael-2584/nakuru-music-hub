
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Fees from "@/components/Fees";
import WhatsAppChat from "@/components/WhatsAppChat";

const FeesPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-24 py-20 bg-gradient-to-br from-green-900/20 via-emerald-900/20 to-teal-900/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/lovable-uploads/65de1b46-84a6-446b-8225-6359d2d2027d.png')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Course Fees & Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Affordable, transparent pricing for world-class music education
            </p>
          </div>
        </div>
      </section>

      <Fees />
      
      <Footer />
      <WhatsAppChat />
    </div>
  );
};

export default FeesPage;
