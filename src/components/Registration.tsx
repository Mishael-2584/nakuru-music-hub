
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  instructor_name: string | null;
  max_capacity: number | null;
  current_bookings: number | null;
}

const Registration = () => {
  const [formData, setFormData] = useState({
    studentName: "",
    age: "",
    location: "",
    email: "",
    phone: "",
    parentName: "",
    parentPhone: "",
    courseCategory: "",
    instrument: "",
    ownsInstrument: false,
    learningMode: "",
    proficiencyLevel: "",
    timeSlotId: "",
    experience: "",
    goals: "",
    preferredSchedule: ""
  });
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const fetchTimeSlots = async () => {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('is_available', true)
        .order('day_of_week, start_time');

      if (error) {
        console.error('Error fetching time slots:', error);
      } else {
        setTimeSlots(data || []);
      }
    };

    fetchTimeSlots();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('registrations')
        .insert([
          {
            student_name: formData.studentName,
            age: parseInt(formData.age),
            location: formData.location,
            email: formData.email,
            phone: formData.phone,
            parent_name: formData.parentName || null,
            parent_phone: formData.parentPhone || null,
            course_category: formData.courseCategory,
            instrument: formData.instrument,
            owns_instrument: formData.ownsInstrument,
            learning_mode: formData.learningMode,
            proficiency_level: formData.proficiencyLevel,
            time_slot_id: formData.timeSlotId || null,
            experience: formData.experience,
            goals: formData.goals || null,
            preferred_schedule: formData.preferredSchedule || null,
          }
        ]);

      if (error) {
        console.error("Registration error:", error);
        toast({
          title: "Registration Failed",
          description: "There was an error submitting your registration. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update time slot booking count
      if (formData.timeSlotId) {
        const timeSlot = timeSlots.find(slot => slot.id === formData.timeSlotId);
        if (timeSlot) {
          await supabase
            .from('time_slots')
            .update({ 
              current_bookings: (timeSlot.current_bookings || 0) + 1,
              is_available: (timeSlot.current_bookings || 0) + 1 < (timeSlot.max_capacity || 1)
            })
            .eq('id', formData.timeSlotId);
        }
      }

      toast({
        title: "Registration Submitted!",
        description: "Thank you for registering! We'll contact you within 24 hours to confirm your enrollment.",
      });
      
      // Reset form
      setFormData({
        studentName: "",
        age: "",
        location: "",
        email: "",
        phone: "",
        parentName: "",
        parentPhone: "",
        courseCategory: "",
        instrument: "",
        ownsInstrument: false,
        learningMode: "",
        proficiencyLevel: "",
        timeSlotId: "",
        experience: "",
        goals: "",
        preferredSchedule: ""
      });
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

  const availableTimeSlots = timeSlots.filter(slot => 
    (slot.current_bookings || 0) < (slot.max_capacity || 1)
  );

  return (
    <section id="registration" className="py-24 bg-gradient-to-br from-secondary/10 to-accent/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Register for Classes
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Take the first step towards your creative journey. Fill out the form below and we'll get in touch!
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-8">
              <CardTitle className="text-3xl font-bold text-center">Student Registration Form</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Student Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-primary border-b border-primary/20 pb-2">Student Information</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="studentName">Student Name *</Label>
                      <Input 
                        id="studentName"
                        placeholder="Full name of student"
                        value={formData.studentName}
                        onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age *</Label>
                      <Input 
                        id="age"
                        type="number"
                        min="3"
                        max="100"
                        placeholder="Student's age"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        required
                        className="h-12"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input 
                        id="location"
                        placeholder="City/Area (e.g., Nakuru, Nairobi)"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email"
                        type="email"
                        placeholder="student@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                        className="h-12"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input 
                        id="phone"
                        type="tel"
                        placeholder="0701 234 567"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Parent/Guardian Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-primary border-b border-primary/20 pb-2">Parent/Guardian Information (if under 18)</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="parentName">Parent/Guardian Name</Label>
                      <Input 
                        id="parentName"
                        placeholder="Full name"
                        value={formData.parentName}
                        onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentPhone">Parent/Guardian Phone</Label>
                      <Input 
                        id="parentPhone"
                        type="tel"
                        placeholder="0701 234 567"
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Course Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-primary border-b border-primary/20 pb-2">Course Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="courseCategory">Course Category *</Label>
                    <Select value={formData.courseCategory} onValueChange={(value) => setFormData({...formData, courseCategory: value, instrument: ""})}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select course category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="production">Music Production</SelectItem>
                        <SelectItem value="art">Art & Photography</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.courseCategory === "music" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="instrument">Preferred Instrument *</Label>
                        <Select value={formData.instrument} onValueChange={(value) => setFormData({...formData, instrument: value})}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select an instrument" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="piano">Piano</SelectItem>
                            <SelectItem value="guitar">Guitar</SelectItem>
                            <SelectItem value="violin">Violin</SelectItem>
                            <SelectItem value="drums">Drums</SelectItem>
                            <SelectItem value="voice">Voice Training</SelectItem>
                            <SelectItem value="saxophone">Saxophone</SelectItem>
                            <SelectItem value="flute">Flute</SelectItem>
                            <SelectItem value="trumpet">Trumpet</SelectItem>
                            <SelectItem value="trombone">Trombone</SelectItem>
                            <SelectItem value="theory">Music Theory</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="ownsInstrument"
                            checked={formData.ownsInstrument}
                            onCheckedChange={(checked) => setFormData({...formData, ownsInstrument: checked as boolean})}
                          />
                          <Label htmlFor="ownsInstrument">I own the instrument</Label>
                        </div>
                      </div>
                    </>
                  )}

                  {formData.courseCategory && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="learningMode">Preferred Learning Mode *</Label>
                        <Select value={formData.learningMode} onValueChange={(value) => setFormData({...formData, learningMode: value})}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select learning mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in-person">In Person at the Academy</SelectItem>
                            <SelectItem value="home">Home Lessons</SelectItem>
                            <SelectItem value="online">Online Lessons</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proficiencyLevel">Current Proficiency Level *</Label>
                        <Select value={formData.proficiencyLevel} onValueChange={(value) => setFormData({...formData, proficiencyLevel: value})}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select your level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner - No prior experience / Just starting out</SelectItem>
                            <SelectItem value="intermediate">Intermediate - Can play some pieces and read basic music</SelectItem>
                            <SelectItem value="advanced">Advanced - Can play well and read music effectively</SelectItem>
                            <SelectItem value="assessment">Unsure / Needs Assessment - Please guide me</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.learningMode === "in-person" && (
                        <div className="space-y-2">
                          <Label htmlFor="timeSlot">Preferred Time Slot</Label>
                          <Select value={formData.timeSlotId} onValueChange={(value) => setFormData({...formData, timeSlotId: value})}>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select available time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTimeSlots.map((slot) => (
                                <SelectItem key={slot.id} value={slot.id}>
                                  {dayNames[slot.day_of_week]} {slot.start_time} - {slot.end_time}
                                  {slot.instructor_name && ` (${slot.instructor_name})`}
                                  {slot.max_capacity && ` - ${(slot.max_capacity - (slot.current_bookings || 0))} spots left`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="goals">Learning Goals</Label>
                    <Textarea 
                      id="goals"
                      placeholder="What would you like to achieve with your lessons?"
                      value={formData.goals}
                      onChange={(e) => setFormData({...formData, goals: e.target.value})}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 shadow-lg hover:scale-105"
                >
                  {isSubmitting ? "Submitting..." : "Submit Registration"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Registration;
