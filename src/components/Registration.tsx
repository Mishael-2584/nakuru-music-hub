
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Music, Users, Award, Star } from "lucide-react";

const Registration = () => {
  const [formData, setFormData] = useState({
    student_name: "",
    age: "",
    email: "",
    phone: "",
    parent_name: "",
    parent_phone: "",
    course_category: "",
    instrument: "",
    experience: "",
    goals: "",
    preferred_schedule: "",
    proficiency_level: "beginner",
    learning_mode: "in-person",
    owns_instrument: false,
    location: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('registrations')
        .insert([{
          student_name: formData.student_name,
          age: parseInt(formData.age),
          email: formData.email,
          phone: formData.phone,
          parent_name: formData.parent_name || null,
          parent_phone: formData.parent_phone || null,
          course_category: formData.course_category,
          instrument: formData.instrument,
          experience: formData.experience,
          goals: formData.goals || null,
          preferred_schedule: formData.preferred_schedule || null,
          proficiency_level: formData.proficiency_level,
          learning_mode: formData.learning_mode,
          owns_instrument: formData.owns_instrument,
          location: formData.location || null,
          status: 'pending'
        }]);

      if (error) {
        console.error('Registration error:', error);
        toast({
          title: "Registration Failed",
          description: "There was an error submitting your registration. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Registration Successful!",
        description: "Thank you for registering! We'll contact you soon to confirm your enrollment.",
      });

      // Reset form
      setFormData({
        student_name: "",
        age: "",
        email: "",
        phone: "",
        parent_name: "",
        parent_phone: "",
        course_category: "",
        instrument: "",
        experience: "",
        goals: "",
        preferred_schedule: "",
        proficiency_level: "beginner",
        learning_mode: "in-person",
        owns_instrument: false,
        location: ""
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="registration" className="py-24 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-primary to-accent rounded-full shadow-2xl">
              <Music className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Start Your Musical Journey
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of students who have discovered their musical passion at Damon Music Academy
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-primary/20 rounded-full">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-primary mb-2">500+</h3>
                <p className="text-muted-foreground">Happy Students</p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-accent/20 rounded-full">
                    <Award className="h-8 w-8 text-accent" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-accent mb-2">15+</h3>
                <p className="text-muted-foreground">Expert Instructors</p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-secondary/20 rounded-full">
                    <Star className="h-8 w-8 text-secondary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-secondary mb-2">5.0</h3>
                <p className="text-muted-foreground">Average Rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Registration Form */}
          <Card className="lg:col-span-2 bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Register Now
              </CardTitle>
              <p className="text-muted-foreground">Fill out the form below to secure your spot</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="student_name">Student Name *</Label>
                    <Input
                      id="student_name"
                      value={formData.student_name}
                      onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      min="5"
                      max="80"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Parent Information (for minors) */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parent_name">Parent/Guardian Name</Label>
                    <Input
                      id="parent_name"
                      value={formData.parent_name}
                      onChange={(e) => setFormData({...formData, parent_name: e.target.value})}
                      placeholder="Required for students under 18"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parent_phone">Parent/Guardian Phone</Label>
                    <Input
                      id="parent_phone"
                      type="tel"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({...formData, parent_phone: e.target.value})}
                      placeholder="Required for students under 18"
                    />
                  </div>
                </div>

                {/* Course Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course_category">Course Category *</Label>
                    <Select value={formData.course_category} onValueChange={(value) => setFormData({...formData, course_category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Music">Music</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Art">Art</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="instrument">Instrument/Subject *</Label>
                    <Input
                      id="instrument"
                      value={formData.instrument}
                      onChange={(e) => setFormData({...formData, instrument: e.target.value})}
                      placeholder="e.g., Piano, Guitar, Vocals, etc."
                      required
                    />
                  </div>
                </div>

                {/* Experience and Goals */}
                <div>
                  <Label htmlFor="experience">Current Experience Level *</Label>
                  <RadioGroup 
                    value={formData.experience} 
                    onValueChange={(value) => setFormData({...formData, experience: value})}
                    className="flex flex-wrap gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Beginner" id="beginner" />
                      <Label htmlFor="beginner">Beginner</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Intermediate" id="intermediate" />
                      <Label htmlFor="intermediate">Intermediate</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Advanced" id="advanced" />
                      <Label htmlFor="advanced">Advanced</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="goals">Learning Goals</Label>
                  <Textarea
                    id="goals"
                    value={formData.goals}
                    onChange={(e) => setFormData({...formData, goals: e.target.value})}
                    placeholder="What would you like to achieve? (e.g., learn specific songs, prepare for exams, performance goals)"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="preferred_schedule">Preferred Schedule</Label>
                  <Input
                    id="preferred_schedule"
                    value={formData.preferred_schedule}
                    onChange={(e) => setFormData({...formData, preferred_schedule: e.target.value})}
                    placeholder="e.g., Weekday evenings, Saturday mornings"
                  />
                </div>

                {/* Learning Preferences */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Learning Mode</Label>
                    <RadioGroup 
                      value={formData.learning_mode} 
                      onValueChange={(value) => setFormData({...formData, learning_mode: value})}
                      className="flex gap-6 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in-person" id="in-person" />
                        <Label htmlFor="in-person">In-Person</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online">Online</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="owns_instrument"
                      checked={formData.owns_instrument}
                      onCheckedChange={(checked) => setFormData({...formData, owns_instrument: checked as boolean})}
                    />
                    <Label htmlFor="owns_instrument">I own the instrument I want to learn</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location (if different from main campus)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Optional: Specify if you prefer a different location"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Register Now"}
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
