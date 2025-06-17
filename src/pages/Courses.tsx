
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CoursesEnhanced from "@/components/CoursesEnhanced";

const Courses = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Our Music Programs
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
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
