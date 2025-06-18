
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventsList from "@/components/EventsList";

const Events = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-24 py-20 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/lovable-uploads/31a53eab-3aed-45c3-b91e-339ed5bb7893.png')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Upcoming Events
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join us for exciting musical events, concerts, workshops, and masterclasses
            </p>
          </div>
        </div>
      </section>

      <EventsList />
      
      <Footer />
    </div>
  );
};

export default Events;
