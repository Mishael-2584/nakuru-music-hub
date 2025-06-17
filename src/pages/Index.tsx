
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CoursesTeaser from "@/components/CoursesTeaser";
import Testimonials from "@/components/Testimonials";
import Registration from "@/components/Registration";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <CoursesTeaser />
      <Testimonials />
      <Registration />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
