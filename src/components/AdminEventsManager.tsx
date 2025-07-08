import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Users, ImageIcon, Calendar, MapPin } from "lucide-react";
import ImageUpload from "@/components/ui/image-upload";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface Event {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  image_url: string | null;
  max_attendees: number | null;
  current_attendees: number | null;
  registration_required: boolean | null;
  status: string;
  is_featured: boolean | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

const AdminEventsManager = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    event_date: "",
    event_time: "",
    location: "",
    max_attendees: "",
    registration_required: false,
    status: "draft",
    is_featured: false,
    image_url: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          content,
          event_date,
          event_time,
          location,
          image_url,
          max_attendees,
          current_attendees,
          registration_required,
          status,
          is_featured,
          slug,
          created_at,
          updated_at
        `)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Error",
          description: "Failed to fetch events",
          variant: "destructive",
        });
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const eventData = {
        title: formData.title,
        description: formData.description || null,
        content: formData.content || null,
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        location: formData.location || null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        registration_required: formData.registration_required,
        status: formData.status,
        is_featured: formData.is_featured,
        image_url: formData.image_url || null,
        slug: slug,
      };

      let error;

      if (editingEvent) {
        const { error: updateError } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('events')
          .insert([eventData]);
        error = insertError;
      }

      if (error) {
        console.error('Error saving event:', error);
        toast({
          title: "Error",
          description: "Failed to save event",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: editingEvent ? "Event updated successfully" : "Event created successfully",
      });

      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      content: event.content || "",
      event_date: event.event_date,
      event_time: event.event_time || "",
      location: event.location || "",
      max_attendees: event.max_attendees ? event.max_attendees.toString() : "",
      registration_required: event.registration_required || false,
      status: event.status,
      is_featured: event.is_featured || false,
      image_url: event.image_url || ""
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        toast({
          title: "Error",
          description: "Failed to delete event",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });

      fetchEvents();
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      event_date: "",
      event_time: "",
      location: "",
      max_attendees: "",
      registration_required: false,
      status: "draft",
      is_featured: false,
      image_url: ""
    });
    setEditingEvent(null);
    setIsEditing(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Events Management</h2>
        <Button 
          onClick={() => setIsEditing(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <RichTextEditor
                  value={formData.content}
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  label="Full Content"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="event_date">Event Date *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="event_time">Event Time</Label>
                  <Input
                    id="event_time"
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_attendees">Max Attendees</Label>
                  <Input
                    id="max_attendees"
                    type="number"
                    value={formData.max_attendees}
                    onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image_url">Event Image</Label>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  label="Event Image"
                  placeholder="Upload an image for this event"
                  maxSize={5}
                  aspectRatio={16/9}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="registration_required"
                    checked={formData.registration_required}
                    onChange={(e) => setFormData({ ...formData, registration_required: e.target.checked })}
                  />
                  <Label htmlFor="registration_required">Registration Required</Label>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  />
                  <Label htmlFor="is_featured">Featured Event</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                      {event.status}
                    </Badge>
                    {event.is_featured && (
                      <Badge className="bg-yellow-500">Featured</Badge>
                    )}
                    {event.registration_required && (
                      <Badge variant="outline">Registration Required</Badge>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-2 line-clamp-2">
                    {event.description || event.content?.substring(0, 150) + '...'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    </div>
                    {event.event_time && (
                      <span>{event.event_time}</span>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.max_attendees && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{event.current_attendees || 0}/{event.max_attendees}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {event.image_url && (
                    <ImageIcon className="h-4 w-4 text-green-500" />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(event)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No events found. Create your first event to get started.
        </div>
      )}
    </div>
  );
};

export default AdminEventsManager;