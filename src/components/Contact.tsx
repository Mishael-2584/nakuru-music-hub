import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
          }
        ]);

      if (error) {
        console.error("Contact form error:", error);
        toast({
          title: "Message Failed",
          description: "There was an error sending your message. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Message Sent!",
        description: "Thank you for your message. We'll get back to you soon!",
      });
      
      // Reset form
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const scrollToRegistration = () => {
    // If not on home page, navigate to home first
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
      // Small delay to ensure page loads before scrolling
      setTimeout(() => {
        const element = document.getElementById('registration');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById('registration');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section id="contact" className="py-24 bg-gradient-to-br from-muted/20 to-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Get In Touch
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ready to start your musical journey? Contact us today and let's create beautiful music together!
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-8">
                <CardTitle className="text-2xl font-bold">Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input 
                      name="name"
                      placeholder="Your Name" 
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="h-12"
                    />
                    <Input 
                      name="email"
                      type="email"
                      placeholder="Your Email" 
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="h-12"
                    />
                  </div>
                  <Input 
                    name="subject"
                    placeholder="Subject" 
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="h-12"
                  />
                  <Textarea 
                    name="message"
                    placeholder="Your Message" 
                    rows={5} 
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    className="resize-none"
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 shadow-lg"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-2">Phone Numbers</p>
                    <p className="text-muted-foreground">0701 195 460</p>
                    <p className="text-muted-foreground">0735 211 627</p>
                    <p className="text-muted-foreground">0721 952 647</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-2">Email</p>
                    <p className="text-muted-foreground break-all">damonmusicacademy@gmail.com</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-2">Location</p>
                    <p className="text-muted-foreground">Nakuru, Kenya</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-primary to-accent text-white shadow-xl border-0">
              <CardContent className="p-8 text-center space-y-6">
                <h3 className="text-2xl font-bold">Class Schedule</h3>
                <div className="space-y-3 text-sm">
                  <p><strong>Weekdays:</strong> Mon - Fri, 7AM - 7PM</p>
                  <p><strong>Weekends:</strong> Sun - From Noon</p>
                  <p><strong>Age Requirement:</strong> 3 years and above</p>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={scrollToRegistration}
                  className="w-full h-12 text-lg font-semibold shadow-lg hover:scale-105 transition-transform duration-200"
                >
                  Register for Classes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
