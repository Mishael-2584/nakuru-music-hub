import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CoursesEnhanced from "@/components/CoursesEnhanced";

const Courses = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-24 md:pt-32 pb-20 bg-gradient-to-br from-orange-900/20 via-red-900/20 to-pink-900/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/lovable-uploads/cc2f7a6b-1ce1-4921-a0b6-b29db99b5d4a.png')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Our Music Programs
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive music education designed for all skill levels and ages
            </p>
          </div>
        </div>
      </section>

      <CoursesEnhanced />
      
      <Footer />
    </div>
  );
};

export default Courses;
