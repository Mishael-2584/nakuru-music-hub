
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Registration = () => {
  const [formData, setFormData] = useState({
    studentName: "",
    age: "",
    email: "",
    phone: "",
    parentName: "",
    parentPhone: "",
    instrument: "",
    experience: "",
    goals: "",
    preferredSchedule: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate form submission
    console.log("Registration form submitted:", formData);
    
    toast({
      title: "Registration Submitted!",
      description: "Thank you for registering! We'll contact you within 24 hours to schedule your first lesson.",
    });
    
    // Reset form
    setFormData({
      studentName: "",
      age: "",
      email: "",
      phone: "",
      parentName: "",
      parentPhone: "",
      instrument: "",
      experience: "",
      goals: "",
      preferredSchedule: ""
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="registration" className="py-24 bg-gradient-to-br from-secondary/10 to-accent/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Register for Classes
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Take the first step towards your musical journey. Fill out the form below and we'll get in touch!
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-8">
              <CardTitle className="text-3xl font-bold text-center">Class Registration Form</CardTitle>
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
                        name="studentName"
                        placeholder="Full name of student"
                        value={formData.studentName}
                        onChange={handleInputChange}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age *</Label>
                      <Input 
                        id="age"
                        name="age"
                        type="number"
                        min="3"
                        max="100"
                        placeholder="Student's age"
                        value={formData.age}
                        onChange={handleInputChange}
                        required
                        className="h-12"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email"
                        name="email"
                        type="email"
                        placeholder="student@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input 
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="0701 234 567"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Parent/Guardian Information (for minors) */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-primary border-b border-primary/20 pb-2">Parent/Guardian Information</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="parentName">Parent/Guardian Name</Label>
                      <Input 
                        id="parentName"
                        name="parentName"
                        placeholder="Full name (if student is under 18)"
                        value={formData.parentName}
                        onChange={handleInputChange}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentPhone">Parent/Guardian Phone</Label>
                      <Input 
                        id="parentPhone"
                        name="parentPhone"
                        type="tel"
                        placeholder="0701 234 567"
                        value={formData.parentPhone}
                        onChange={handleInputChange}
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Course Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-primary border-b border-primary/20 pb-2">Course Information</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="instrument">Preferred Instrument *</Label>
                      <select 
                        id="instrument"
                        name="instrument"
                        value={formData.instrument}
                        onChange={handleInputChange}
                        required
                        className="h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Select an instrument</option>
                        <option value="piano">Piano</option>
                        <option value="guitar">Guitar</option>
                        <option value="violin">Violin</option>
                        <option value="drums">Drums</option>
                        <option value="voice">Voice Training</option>
                        <option value="saxophone">Saxophone</option>
                        <option value="flute">Flute</option>
                        <option value="trumpet">Trumpet</option>
                        <option value="bass">Bass Guitar</option>
                        <option value="theory">Music Theory</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience Level *</Label>
                      <select 
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        required
                        className="h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Select experience level</option>
                        <option value="beginner">Complete Beginner</option>
                        <option value="some-experience">Some Experience</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goals">Musical Goals</Label>
                    <Textarea 
                      id="goals"
                      name="goals"
                      placeholder="What would you like to achieve with your music lessons?"
                      value={formData.goals}
                      onChange={handleInputChange}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredSchedule">Preferred Schedule</Label>
                    <Textarea 
                      id="preferredSchedule"
                      name="preferredSchedule"
                      placeholder="When would you prefer to have lessons? (e.g., weekday evenings, weekend mornings)"
                      value={formData.preferredSchedule}
                      onChange={handleInputChange}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 shadow-lg hover:scale-105"
                >
                  Submit Registration
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
