import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Music, 
  MapPin, 
  Phone, 
  Mail,
  CheckCircle,
  Star,
  Gift,
  Users,
  Award,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TrialBookingFormProps {
  className?: string;
}

interface TrialFormData {
  studentName: string;
  parentName: string;
  email: string;
  phone: string;
  age: string;
  instrument: string;
  skillLevel: string;
  preferredLocation: string;
  preferredTime: string;
  preferredDate: Date | undefined;
  experience: string;
  goals: string;
  specialRequirements: string;
}

const TrialBookingForm = ({ className }: TrialBookingFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [formData, setFormData] = useState<TrialFormData>({
    studentName: '',
    parentName: '',
    email: '',
    phone: '',
    age: '',
    instrument: '',
    skillLevel: '',
    preferredLocation: '',
    preferredTime: '',
    preferredDate: undefined,
    experience: '',
    goals: '',
    specialRequirements: ''
  });

  const instruments = [
    'Piano', 'Guitar', 'Violin', 'Drums', 'Bass Guitar', 'Saxophone', 
    'Trumpet', 'Flute', 'Vocals', 'Music Theory', 'Music Production',
    'Coding & Programming'
  ];

  const skillLevels = [
    'Complete Beginner', 'Beginner (some basics)', 'Intermediate', 'Advanced'
  ];

  const locations = [
    'At the Academy', 'Home Lesson (Nakuru CBD)', 'Online Session'
  ];

  const timeSlots = [
    'Morning (8:00 AM - 12:00 PM)', 
    'Afternoon (12:00 PM - 4:00 PM)', 
    'Evening (4:00 PM - 8:00 PM)',
    'Weekend Morning (8:00 AM - 12:00 PM)',
    'Weekend Afternoon (12:00 PM - 4:00 PM)'
  ];

  const handleInputChange = (field: keyof TrialFormData, value: string | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save trial booking to database using RPC function
      const { data, error } = await supabase.rpc('create_trial_booking', {
        p_student_name: formData.studentName,
        p_parent_name: formData.parentName,
        p_student_age: parseInt(formData.age),
        p_email: formData.email,
        p_phone: formData.phone,
        p_instrument: formData.instrument,
        p_skill_level: formData.skillLevel,
        p_preferred_location: formData.preferredLocation,
        p_preferred_time: formData.preferredTime,
        p_previous_experience: formData.experience || null,
        p_learning_goals: formData.goals || null,
        p_preferred_date: formData.preferredDate ? format(formData.preferredDate, 'yyyy-MM-dd') : null,
        p_special_requirements: formData.specialRequirements || null
      });

      if (error) {
        console.error('Error saving trial booking:', error);
        throw error;
      }

      console.log('Trial booking saved successfully:', data);
      
      toast({
        title: "Trial Class Booked Successfully! 🎉",
        description: "Our team will contact you within 24 hours to confirm your trial class details.",
        duration: 5000,
      });

      // Reset form
      setFormData({
        studentName: '',
        parentName: '',
        email: '',
        phone: '',
        age: '',
        instrument: '',
        skillLevel: '',
        preferredLocation: '',
        preferredTime: '',
        preferredDate: undefined,
        experience: '',
        goals: '',
        specialRequirements: ''
      });

    } catch (error) {
      console.error('Error saving trial booking:', error);
      toast({
        title: "Booking Failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const trialBenefits = [
    {
      icon: Gift,
      title: "100% Free",
      description: "No cost, no commitment required"
    },
    {
      icon: User,
      title: "1-on-1 Session",
      description: "Personalized attention from expert instructors"
    },
    {
      icon: Award,
      title: "Skill Assessment",
      description: "Professional evaluation of current abilities"
    },
    {
      icon: BookOpen,
      title: "Customized Plan",
      description: "Personalized learning path recommendations"
    }
  ];

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Star className="w-8 h-8 text-yellow-500" />
          <h2 className="text-3xl font-bold text-primary">Book Your Free Trial Class</h2>
          <Star className="w-8 h-8 text-yellow-500" />
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          Experience world-class music education with our complimentary trial session
        </p>
        
        {/* Benefits Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {trialBenefits.map((benefit, index) => (
            <div key={index} className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border">
              <benefit.icon className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-sm text-blue-900">{benefit.title}</h3>
              <p className="text-xs text-blue-700 text-center">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Trial Class Details
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Fill in your details and we'll contact you to schedule your free trial
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Student Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="studentName">Student Name *</Label>
                    <Input
                      id="studentName"
                      value={formData.studentName}
                      onChange={(e) => handleInputChange('studentName', e.target.value)}
                      placeholder="Enter student's full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="e.g., 12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                  <Input
                    id="parentName"
                    value={formData.parentName}
                    onChange={(e) => handleInputChange('parentName', e.target.value)}
                    placeholder="Enter parent/guardian name"
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+254 700 000 000"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Music Preferences */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Music Preferences
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instrument">Subject/Instrument *</Label>
                    <Select value={formData.instrument} onValueChange={(value) => handleInputChange('instrument', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject/instrument" />
                      </SelectTrigger>
                      <SelectContent>
                        {instruments.map((instrument) => (
                          <SelectItem key={instrument} value={instrument}>
                            {instrument}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="skillLevel">Current Skill Level *</Label>
                    <Select value={formData.skillLevel} onValueChange={(value) => handleInputChange('skillLevel', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select skill level" />
                      </SelectTrigger>
                      <SelectContent>
                        {skillLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="experience">Previous Music Experience</Label>
                  <Textarea
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    placeholder="Tell us about any previous music lessons or experience..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="goals">Learning Goals</Label>
                  <Textarea
                    id="goals"
                    value={formData.goals}
                    onChange={(e) => handleInputChange('goals', e.target.value)}
                    placeholder="What would you like to achieve through music lessons?"
                    rows={3}
                  />
                </div>
              </div>

              {/* Scheduling Preferences */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Scheduling Preferences
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Preferred Location *</Label>
                    <Select value={formData.preferredLocation} onValueChange={(value) => handleInputChange('preferredLocation', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="time">Preferred Time *</Label>
                    <Select value={formData.preferredTime} onValueChange={(value) => handleInputChange('preferredTime', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time preference" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="date">Preferred Date (Optional)</Label>
                  <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.preferredDate ? format(formData.preferredDate, "PPP") : "Select a date"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.preferredDate}
                        onSelect={(date) => {
                          handleInputChange('preferredDate', date || new Date());
                          setShowCalendar(false);
                        }}
                        initialFocus
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Special Requirements */}
              <div>
                <Label htmlFor="specialRequirements">Special Requirements or Notes</Label>
                <Textarea
                  id="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  placeholder="Any special requirements, accessibility needs, or additional information..."
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Booking Your Trial...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Book Free Trial Class
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Information Panel */}
        <div className="space-y-6">
          {/* What to Expect */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                What to Expect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">Skill Assessment</h4>
                  <p className="text-sm text-muted-foreground">Our instructor will evaluate your current musical abilities and interests.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Personalized Lesson</h4>
                  <p className="text-sm text-muted-foreground">Experience our teaching methodology with a customized mini-lesson.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">Learning Plan</h4>
                  <p className="text-sm text-muted-foreground">Receive recommendations for the best learning path for your goals.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold">Next Steps</h4>
                  <p className="text-sm text-muted-foreground">Learn about enrollment options and how to continue your musical journey.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Choose Us */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Why Choose Damon Music Academy?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-semibold">Expert Instructors</h4>
                  <p className="text-sm text-muted-foreground">Qualified teachers with industry experience</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-semibold">Proven Results</h4>
                  <p className="text-sm text-muted-foreground">Students achieving their musical goals</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-semibold">Flexible Options</h4>
                  <p className="text-sm text-muted-foreground">At academy, home, or online lessons</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-semibold">Comprehensive Curriculum</h4>
                  <p className="text-sm text-muted-foreground">From beginner to advanced levels</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">+254 700 000 000</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">info@damonmusicacademy.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Nakuru, Kenya</span>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Our team is available to help you with any questions about our trial classes or programs.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrialBookingForm;


