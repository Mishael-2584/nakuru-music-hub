
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import GalleryCarousel from "@/components/GalleryCarousel";
import CoursesEnhanced from "@/components/CoursesEnhanced";
import Services from "@/components/Services";
import Fees from "@/components/Fees";
import ExamBodies from "@/components/ExamBodies";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import Registration from "@/components/Registration";
import SocialMedia from "@/components/SocialMedia";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <GalleryCarousel />
      <CoursesEnhanced />
      <Services />
      <Fees />
      <ExamBodies />
      <About />
      <Testimonials />
      <Registration />
      <SocialMedia />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
