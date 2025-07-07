import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CoursesTeaser from "@/components/CoursesTeaser";
import Testimonials from "@/components/Testimonials";
import Registration from "@/components/Registration";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import SocialMedia from "@/components/SocialMedia";
import WhatsAppChat from "@/components/WhatsAppChat";
import NewsList from "@/components/NewsList";
import { ServicesCarousel } from "@/components/Services";
import ExamBodies from "@/components/ExamBodies";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <div className="w-full flex justify-center bg-blue-50 border-b border-primary/10 py-3">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-primary font-semibold text-base">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3C7.03 3 3 7.03 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-4.97-4.03-9-9-9zm0 0v18m0-18C7.03 3 3 7.03 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-4.97-4.03-9-9-9z" /></svg>
            Now enrolling students worldwide! Join us online or in-person in Nakuru & Nairobi.
          </span>
        </div>
        <CoursesTeaser />
        <ServicesCarousel />
        <ExamBodies />
        <Testimonials />
        <NewsList />
        <Registration />
        <SocialMedia />
      </main>
      <Footer />
      <WhatsAppChat />
    </div>
  );
};

export default Index;
