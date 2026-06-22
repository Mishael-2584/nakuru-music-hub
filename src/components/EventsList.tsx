import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  formatEventDate,
  formatEventTime,
  getLocalDateString,
} from "@/lib/eventUtils";

interface Event {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  image_url: string | null;
  slug: string;
  max_attendees: number | null;
  current_attendees: number | null;
  registration_required: boolean | null;
  is_featured: boolean | null;
}

const getEventSummary = (event: Event) => {
  if (event.description?.trim()) return event.description.trim();
  if (!event.content) return "Join us for this upcoming academy event.";

  return event.content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
};

const EventsList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const today = getLocalDateString();
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .gte("event_date", today)
        .order("is_featured", { ascending: false })
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true, nullsFirst: false });

      if (error) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        });
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading events...</div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">No Upcoming Events</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Check back soon for exciting musical events! Published events only appear here when
              their event date is today or in the future — update the date in admin if an event is
              missing.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const featuredEvents = events.filter((event) => event.is_featured);
  const regularEvents = events.filter((event) => !event.is_featured);

  const renderEventCard = (event: Event) => (
    <Card
      key={event.id}
      className="flex flex-col rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group bg-white"
    >
      <CardHeader className="p-0">
        <Link to={`/events/${event.slug}`} className="block h-48 overflow-hidden">
          {event.image_url ? (
            <div
              className="h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${event.image_url})` }}
            />
          ) : (
            <div className="h-full bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 flex items-center justify-center">
              <Music2 className="h-12 w-12 text-purple-400" />
            </div>
          )}
        </Link>
      </CardHeader>
      <CardContent className="p-6 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-3 mb-3">
          <CardTitle className="text-xl flex-grow group-hover:text-primary transition-colors">
            <Link to={`/events/${event.slug}`}>{event.title}</Link>
          </CardTitle>
          {event.is_featured && (
            <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">
              Featured
            </Badge>
          )}
        </div>

        <p className="text-muted-foreground mb-4 line-clamp-3">
          {getEventSummary(event)}
        </p>

        <div className="space-y-3 text-sm text-muted-foreground border-t pt-4 mt-auto">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{formatEventDate(event.event_date)}</span>
          </div>

          {event.event_time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{formatEventTime(event.event_time)}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{event.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 space-y-12">
        {featuredEvents.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Featured Events</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map(renderEventCard)}
            </div>
          </div>
        )}

        {regularEvents.length > 0 && (
          <div>
            {featuredEvents.length > 0 && (
              <h2 className="text-2xl font-bold mb-6">More Upcoming Events</h2>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularEvents.map(renderEventCard)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsList;
