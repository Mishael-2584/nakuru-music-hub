import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mail, Phone, Calendar, MapPin, DollarSign, Clock, FileText, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService?: string;
}

const serviceCategories = [
  { value: "live-sound-lighting", label: "Live Sound & Lighting" },
  { value: "livestreaming", label: "Livestreaming Services" },
  { value: "event-coverage", label: "Event Coverage" },
  { value: "photography", label: "Photography Services" },
  { value: "songwriting", label: "Songwriting" },
  { value: "studio-recording", label: "Studio Recording & Production" },
  { value: "audio-mixing", label: "Audio Mixing & Mastering" },
  { value: "voice-over", label: "Voice-over Production" },
  { value: "podcast", label: "Podcast Production" },
  { value: "live-feed", label: "Live Feed Services" },
  { value: "stage-lighting", label: "Stage Lighting Setup" },
  { value: "led-screen", label: "LED Screen Rental" },
  { value: "rehearsal-space", label: "Rehearsal Space Rental" },
  { value: "music-production", label: "Music Production for Artists" },
  { value: "dj-mc", label: "DJ & MC Services" },
  { value: "music-arrangement", label: "Music Arrangement & Transcription" },
  { value: "music-composition", label: "Music Composition Services" },
  { value: "session-musicians", label: "Session & Event Musicians" }
];

const budgetRanges = [
  { value: "under-10k", label: "Under KES 10,000" },
  { value: "10k-25k", label: "KES 10,000 - 25,000" },
  { value: "25k-50k", label: "KES 25,000 - 50,000" },
  { value: "50k-100k", label: "KES 50,000 - 100,000" },
  { value: "100k-250k", label: "KES 100,000 - 250,000" },
  { value: "over-250k", label: "Over KES 250,000" }
];

const timelines = [
  { value: "asap", label: "ASAP (Within 1 week)" },
  { value: "1-2-weeks", label: "1-2 weeks" },
  { value: "1-month", label: "1 month" },
  { value: "2-3-months", label: "2-3 months" },
  { value: "3-6-months", label: "3-6 months" },
  { value: "flexible", label: "Flexible timeline" }
];

export default function QuoteForm({ isOpen, onClose, selectedService }: QuoteFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service_category: selectedService || "",
    project_type: "",
    event_date: "",
    location: "",
    budget_range: "",
    timeline: "",
    specific_requirements: "",
    preferred_contact_method: "email",
    additional_notes: ""
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('quotes')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Quote Request Submitted!",
        description: "We'll review your request and send you a detailed quote within 24 hours.",
      });

      // Reset form and close modal
      setFormData({
        name: "",
        email: "",
        phone: "",
        service_category: "",
        project_type: "",
        event_date: "",
        location: "",
        budget_range: "",
        timeline: "",
        specific_requirements: "",
        preferred_contact_method: "email",
        additional_notes: ""
      });
      setCurrentStep(1);
      onClose();
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast({
        title: "Error",
        description: "Failed to submit quote request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Project Overview</h3>
        <p className="text-gray-600">Tell us about your project and we'll get back to you with a detailed quote.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Your full name"
            required
          />
        </div>

        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+254 700 000 000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="service_category">Service Category *</Label>
          <Select value={formData.service_category} onValueChange={(value) => handleInputChange('service_category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              {serviceCategories.map((service) => (
                <SelectItem key={service.value} value={service.value}>
                  {service.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project_type">Project Type</Label>
          <Input
            id="project_type"
            value={formData.project_type}
            onChange={(e) => handleInputChange('project_type', e.target.value)}
            placeholder="e.g., Wedding, Corporate Event, Recording Session"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_date">Event Date</Label>
          <Input
            id="event_date"
            type="date"
            value={formData.event_date}
            onChange={(e) => handleInputChange('event_date', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location/Venue</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Event location or venue"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Project Requirements</h3>
        <p className="text-gray-600">Help us understand your specific needs and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget_range">Budget Range</Label>
          <Select value={formData.budget_range} onValueChange={(value) => handleInputChange('budget_range', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select budget range" />
            </SelectTrigger>
            <SelectContent>
              {budgetRanges.map((budget) => (
                <SelectItem key={budget.value} value={budget.value}>
                  {budget.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeline">Timeline</Label>
          <Select value={formData.timeline} onValueChange={(value) => handleInputChange('timeline', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select timeline" />
            </SelectTrigger>
            <SelectContent>
              {timelines.map((timeline) => (
                <SelectItem key={timeline.value} value={timeline.value}>
                  {timeline.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specific_requirements">Specific Requirements</Label>
        <Textarea
          id="specific_requirements"
          value={formData.specific_requirements}
          onChange={(e) => handleInputChange('specific_requirements', e.target.value)}
          placeholder="Describe your specific requirements, equipment needs, or special requests..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
        <Select value={formData.preferred_contact_method} onValueChange={(value) => handleInputChange('preferred_contact_method', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Review & Submit</h3>
        <p className="text-gray-600">Review your information and submit your quote request.</p>
      </div>

      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
              <div className="space-y-1 text-gray-600">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                {formData.phone && <p><strong>Phone:</strong> {formData.phone}</p>}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Project Details</h4>
              <div className="space-y-1 text-gray-600">
                <p><strong>Service:</strong> {serviceCategories.find(s => s.value === formData.service_category)?.label}</p>
                {formData.project_type && <p><strong>Type:</strong> {formData.project_type}</p>}
                {formData.event_date && <p><strong>Date:</strong> {formData.event_date}</p>}
                {formData.location && <p><strong>Location:</strong> {formData.location}</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="additional_notes">Additional Notes (Optional)</Label>
        <Textarea
          id="additional_notes"
          value={formData.additional_notes}
          onChange={(e) => handleInputChange('additional_notes', e.target.value)}
          placeholder="Any additional information or special requests..."
          rows={3}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">What happens next?</h4>
            <p className="text-blue-700 text-sm">
              We'll review your request and send you a detailed quote within 24 hours. 
              Our team will contact you via your preferred method to discuss your project in detail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Get Your Quote
          </DialogTitle>
        </DialogHeader>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {renderStepContent()}

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={nextStep}
              className="flex items-center gap-2"
              disabled={
                (currentStep === 1 && (!formData.name || !formData.email || !formData.service_category)) ||
                (currentStep === 2 && !formData.budget_range)
              }
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? "Submitting..." : "Submit Quote Request"}
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 