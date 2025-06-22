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
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const handleTestEmail = async () => {
    console.log('🧪 Testing hosted email service...');
    console.log('🧪 Current URL:', window.location.href);
    console.log('🧪 Current origin:', window.location.origin);
    
    try {
      // Test 1: Check Supabase connection
      console.log('🧪 Test 1: Checking Supabase connection...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🧪 Auth result:', { user: !!user, error: authError });
      
      // Test 2: Test function invocation directly
      console.log('🧪 Test 2: Testing function invocation...');
      const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          to: 'test@example.com',
          subject: 'Hosted Test Email',
          html: '<h1>Test Email from Hosted Environment</h1><p>This is a test email to verify the function works when hosted.</p>',
          registration: {
            id: 'test-hosted-123',
            receipt_number: 'HOSTED-TEST-001',
            student_name: 'Hosted Test Student'
          }
        }
      });
      
      console.log('🧪 Function response:', { data, error });
      
      if (error) {
        console.error('❌ Function error:', error);
        alert(`Email test failed: ${error.message}\n\nCheck console for details.`);
      } else if (data && data.success) {
        console.log('✅ Function success:', data);
        alert('Email test successful! Check your email.');
      } else {
        console.error('❌ Function failed:', data);
        alert(`Email test failed: ${data?.message || 'Unknown error'}\n\nCheck console for details.`);
      }
      
    } catch (error) {
      console.error('❌ Test error:', error);
      alert(`Test error: ${error.message}\n\nCheck console for details.`);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <CoursesTeaser />
        <ServicesCarousel />
        <ExamBodies />
        <Testimonials />
        <NewsList />
        <Registration />
        <SocialMedia />
        
        {/* Temporary test button for hosted debugging - remove after testing */}
        <div className="fixed bottom-20 right-4 z-50">
          <Button 
            onClick={handleTestEmail}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Test Hosted Email
          </Button>
        </div>
      </main>
      <Footer />
      <WhatsAppChat />
    </div>
  );
};

export default Index;
