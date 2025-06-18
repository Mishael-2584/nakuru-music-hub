
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EventRegistrationForm from "@/components/EventRegistrationForm";

interface Event {
  id: string;
  title: string;
  description: string;
  content: string;
  event_date: string;
  event_time: string;
  location: string;
  image_url: string;
  max_attendees: number;
  current_attendees: number;
  registration_required: boolean;
}

const EventDetail = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        toast({
          title: "Error",
          description: "Event not found",
          variant: "destructive",
        });
        return;
      }

      setEvent(data);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Loading event...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <Button asChild>
              <Link to="/events">Back to Events</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Button variant="outline" asChild className="mb-6">
            <Link to="/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </Button>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {event.image_url && (
                <div className="h-64 md:h-96 bg-cover bg-center rounded-lg mb-6" 
                     style={{ backgroundImage: `url(${event.image_url})` }}>
                </div>
              )}
              
              <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
              
              <div className="prose max-w-none mb-8">
                <p className="text-lg text-muted-foreground mb-4">{event.description}</p>
                {event.content && (
                  <div className="whitespace-pre-wrap">{event.content}</div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Event Details</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    </div>
                    
                    {event.event_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{event.event_time}</span>
                      </div>
                    )}
                    
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    {event.max_attendees && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span>{event.current_attendees || 0}/{event.max_attendees} attendees</span>
                      </div>
                    )}
                  </div>
                  
                  {event.registration_required && (
                    <Button 
                      onClick={() => setShowRegistration(true)}
                      className="w-full"
                      disabled={event.max_attendees && (event.current_attendees || 0) >= event.max_attendees}
                    >
                      {event.max_attendees && (event.current_attendees || 0) >= event.max_attendees 
                        ? "Event Full" 
                        : "Register Now"
                      }
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
      
      {showRegistration && (
        <EventRegistrationForm 
          event={event} 
          onClose={() => setShowRegistration(false)}
          onSuccess={() => {
            setShowRegistration(false);
            fetchEvent(); // Refresh event data
          }}
        />
      )}
    </div>
  );
};

export default EventDetail;
