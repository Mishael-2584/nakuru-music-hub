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
import { sendApplicationConfirmationEmail } from '@/lib/emailService';
import { LANGUAGE_OPTIONS, LANGUAGE_PACKAGES, LANGUAGE_PATHWAYS, LANGUAGE_PROGRAM_INTRO, LANGUAGE_PRICING_NOTE, LANGUAGE_LEARNING_MODE, formatLanguageMonthlyPrice, getLanguagePathwayLabel, getLanguagePackageLabel } from '@/lib/languageCourseUtils';
import { Music, Users, Award, Star, ArrowRight, ArrowLeft, CheckCircle, MapPin, Phone, Mail, User, Calendar, Guitar, Mic, Palette, Video, Speaker, Music2, Users2, Code, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Registration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    student_name: "",
    age: "",
    email: "",
    phone: "",
    country_code: "+254",
    parent_name: "",
    parent_phone: "",
    course_category: "",
    music_subcategory: "",
    instrument: "",
    custom_instrument: "",
    production_type: "",
    technology_type: "",
    language_type: "",
    custom_language: "",
    language_pathway: "conversational",
    language_package: "individual",
    experience: "",
    goals: "",
    preferred_schedule: "",
    proficiency_level: "beginner",
    learning_mode: "in-person",
    owns_instrument: false,
    location: "",
    medical_condition: "no",
    medical_details: "",
    date_of_birth: '',
    sessions_per_week: 1,
    home_lesson_duration: '', // Music + Home: '30_min' | '1_hour'
    term_period: '1st_term', // Termly Production / Photography
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const countryCodes = [
    { code: "+1", country: "United States", flag: "🇺🇸" },
    { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
    { code: "+254", country: "Kenya", flag: "🇰🇪" },
    { code: "+255", country: "Tanzania", flag: "🇹🇿" },
    { code: "+256", country: "Uganda", flag: "🇺🇬" },
    { code: "+27", country: "South Africa", flag: "🇿🇦" },
    { code: "+234", country: "Nigeria", flag: "🇳🇬" },
    { code: "+233", country: "Ghana", flag: "🇬🇭" },
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+39", country: "Italy", flag: "🇮🇹" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+7", country: "Russia", flag: "🇷🇺" },
    { code: "+34", country: "Spain", flag: "🇪🇸" },
    { code: "+351", country: "Portugal", flag: "🇵🇹" },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
    { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
    { code: "+90", country: "Turkey", flag: "🇹🇷" },
    { code: "+20", country: "Egypt", flag: "🇪🇬" },
    { code: "+212", country: "Morocco", flag: "🇲🇦" },
    { code: "+213", country: "Algeria", flag: "🇩🇿" },
    { code: "+62", country: "Indonesia", flag: "🇮🇩" },
    { code: "+63", country: "Philippines", flag: "🇵🇭" },
    { code: "+358", country: "Finland", flag: "🇫🇮" },
    { code: "+46", country: "Sweden", flag: "🇸🇪" },
    { code: "+47", country: "Norway", flag: "🇳🇴" },
    { code: "+48", country: "Poland", flag: "🇵🇱" },
    { code: "+380", country: "Ukraine", flag: "🇺🇦" },
    { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
    { code: "+421", country: "Slovakia", flag: "🇸🇰" },
    { code: "+386", country: "Slovenia", flag: "🇸🇮" },
    { code: "+385", country: "Croatia", flag: "🇭🇷" },
    { code: "+43", country: "Austria", flag: "🇦🇹" },
    { code: "+41", country: "Switzerland", flag: "🇨🇭" },
    { code: "+32", country: "Belgium", flag: "🇧🇪" },
    { code: "+31", country: "Netherlands", flag: "🇳🇱" },
    { code: "+30", country: "Greece", flag: "🇬🇷" },
    { code: "+52", country: "Mexico", flag: "🇲🇽" },
    { code: "+55", country: "Brazil", flag: "🇧🇷" },
    { code: "+56", country: "Chile", flag: "🇨🇱" },
    { code: "+57", country: "Colombia", flag: "🇨🇴" },
    { code: "+58", country: "Venezuela", flag: "🇻🇪" },
    { code: "+591", country: "Bolivia", flag: "🇧🇴" },
    { code: "+595", country: "Paraguay", flag: "🇵🇾" },
    { code: "+598", country: "Uruguay", flag: "🇺🇾" },
    { code: "+51", country: "Peru", flag: "🇵🇪" },
    { code: "+53", country: "Cuba", flag: "🇨🇺" },
    { code: "+54", country: "Argentina", flag: "🇦🇷" },
    // ... (add more as needed for full coverage)
  ];

  const musicInstruments = [
    "Piano", "Drums", "Violin", "Saxophone", "Bass Guitar", 
    "Acoustic Guitar", "Electric Guitar", "Flute", "Clarinet", "Cello", "Voice",
    "Music Theory", "Trumpet", "Trombone", "Other"
  ];

  const productionTypes = [
    "Music Production", "Live Sound Engineering", "Videography"
  ];

  const technologyTypes = [
    "Web Design & Programming", "Mobile App Development", "Software Engineering", "Data Science"
  ];

  const proficiencyLevels = [
    {
      value: "beginner",
      label: "Beginner",
      description: "No prior experience / Just starting out"
    },
    {
      value: "intermediate", 
      label: "Intermediate",
      description: "Can play some pieces and read basic music"
    },
    {
      value: "advanced",
      label: "Advanced", 
      description: "Can play their instrument well and is able to read music effectively"
    },
    {
      value: "unsure",
      label: "Unsure / Needs Assessment",
      description: "Not sure where I fit, please guide me"
    }
  ];

  const learningModes = [
    { value: "in-person", label: "In Person at the Academy" },
    { value: "home", label: "Home Lesson" },
    { value: "online", label: "Online" }
  ];

  const isTermlyCourseCategory = (category: string) =>
    category === 'Production' || category === 'Photography' ||
    ['production', 'photography'].includes(String(category || '').toLowerCase());

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      // Scroll to the top of the form after state update
      setTimeout(() => {
        const formElement = document.getElementById('registration');
        if (formElement) {
          formElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100); // Small delay to ensure state has updated
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Scroll to the top of the form after state update
      setTimeout(() => {
        const formElement = document.getElementById('registration');
        if (formElement) {
          formElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100); // Small delay to ensure state has updated
    }
  };

  // Validation functions
  const validateField = (field: string, value: any): { isValid: boolean; error: string } => {
    switch (field) {
      case 'student_name':
        if (!value || value.trim().length < 2) {
          return { isValid: false, error: 'Student name must be at least 2 characters long' };
        }
        if (value.trim().length > 100) {
          return { isValid: false, error: 'Student name must be less than 100 characters' };
        }
        break;
      
      case 'age':
        const ageNum = parseInt(value);
        if (!ageNum || ageNum < 2 || ageNum > 100) {
          return { isValid: false, error: 'Age must be between 2 and 100 years' };
        }
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value || !emailRegex.test(value)) {
          return { isValid: false, error: 'Please enter a valid email address' };
        }
        break;
      
      case 'phone':
        if (!value || value.trim().length < 9) {
          return { isValid: false, error: 'Phone number must be at least 10 digits' };
        }
        break;
      
      case 'location':
        if (!value || value.trim().length < 2) {
          return { isValid: false, error: 'Location must be at least 2 characters long' };
        }
        if (value.trim().length > 100) {
          return { isValid: false, error: 'Location must be less than 100 characters' };
        }
        break;
      
      case 'date_of_birth':
        if (!value) {
          return { isValid: false, error: 'Date of birth is required' };
        }
        const date = new Date(value);
        const today = new Date();
        if (isNaN(date.getTime())) {
          return { isValid: false, error: 'Please enter a valid date of birth' };
        }
        if (date > today) {
          return { isValid: false, error: 'Date of birth cannot be in the future' };
        }
        // Check if person is at least 2 years old
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        if (age < 2 || (age === 2 && monthDiff < 0)) {
          return { isValid: false, error: 'Student must be at least 2 years old' };
        }
        break;
      
      case 'course_category':
        if (!value || !['Music', 'Production', 'Art', 'Technology', 'Languages'].includes(value)) {
          return { isValid: false, error: 'Please select a valid course category' };
        }
        break;
      
      case 'music_subcategory':
        if (formData.course_category === 'Music' && (!value || !['Individual Lessons', 'DMA Kids Band', 'DMA Children\'s Choir'].includes(value))) {
          return { isValid: false, error: 'Please select a music program' };
        }
        break;
      
      case 'instrument':
        if (formData.course_category === 'Music' && formData.music_subcategory === 'Individual Lessons' && (!value || value.trim().length === 0)) {
          return { isValid: false, error: 'Please select an instrument for individual lessons' };
        }
        if (formData.course_category === 'Music' && formData.music_subcategory === 'Individual Lessons' && value === 'Other' && (!formData.custom_instrument || formData.custom_instrument.trim().length === 0)) {
          return { isValid: false, error: 'Please specify your instrument' };
        }
        // For DMA Kids Band and DMA Children's Choir, instrument is optional
        break;
      
      case 'production_type':
        if (formData.course_category === 'Production' && (!value || value.trim().length === 0)) {
          return { isValid: false, error: 'Please select a production type' };
        }
        break;
      
      case 'technology_type':
        if (formData.course_category === 'Technology' && (!value || value.trim().length === 0)) {
          return { isValid: false, error: 'Please select a technology type' };
        }
        break;

      case 'language_type':
        if (formData.course_category === 'Languages' && (!value || value.trim().length === 0)) {
          return { isValid: false, error: 'Please select a language' };
        }
        if (formData.course_category === 'Languages' && value === 'Other' && (!formData.custom_language || formData.custom_language.trim().length === 0)) {
          return { isValid: false, error: 'Please specify your language' };
        }
        break;
      
      case 'medical_details':
        if (formData.medical_condition === 'yes' && (!value || value.trim().length === 0)) {
          return { isValid: false, error: 'Please provide details about your medical condition' };
        }
        break;
      case 'goals':
        if (!value || value.trim().length === 0) {
          return { isValid: false, error: 'Learning Goals is required' };
        }
        break;
      case 'preferred_schedule':
        if (!value || value.trim().length === 0) {
          return { isValid: false, error: 'Preferred Schedule is required' };
        }
        break;
      case 'sessions_per_week':
        const sessionsNum = parseInt(value);
        if (!sessionsNum || sessionsNum < 1 || sessionsNum > 5) {
          return { isValid: false, error: 'Number of classes per week must be between 1 and 5' };
        }
        break;
    }
    return { isValid: true, error: '' };
  };

  const validateStep = (step: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        ['student_name', 'age', 'email', 'phone', 'location', 'date_of_birth'].forEach(field => {
          const validation = validateField(field, formData[field as keyof typeof formData]);
          if (!validation.isValid) {
            errors.push(`${field}: ${validation.error}`);
          }
        });
        
        // Validate parent details for underage students (under 18)
        const age = parseInt(formData.age);
        if (age < 18) {
          if (!formData.parent_name || formData.parent_name.trim().length < 2) {
            errors.push('Parent/Guardian name is required for students under 18');
          }
          if (!formData.parent_phone || formData.parent_phone.trim().length < 9) {
            errors.push('Parent/Guardian phone number is required for students under 18');
          }
        }
        
        // Validate medical details if medical condition is yes
        if (formData.medical_condition === 'yes') {
          const validation = validateField('medical_details', formData.medical_details);
          if (!validation.isValid) {
            errors.push(validation.error);
          }
        }
        break;
      
      case 2:
        ['course_category'].forEach(field => {
          const validation = validateField(field, formData[field as keyof typeof formData]);
          if (!validation.isValid) {
            errors.push(`${field}: ${validation.error}`);
          }
        });
        
        if (formData.course_category === 'Music') {
          const validation = validateField('instrument', formData.instrument);
          if (!validation.isValid) {
            errors.push(validation.error);
          }
        }
        
        if (formData.course_category === 'Production') {
          const validation = validateField('production_type', formData.production_type);
          if (!validation.isValid) {
            errors.push(validation.error);
          }
        }
        
        if (formData.course_category === 'Technology') {
          const validation = validateField('technology_type', formData.technology_type);
          if (!validation.isValid) {
            errors.push(validation.error);
          }
        }

        if (formData.course_category === 'Languages') {
          const validation = validateField('language_type', formData.language_type);
          if (!validation.isValid) {
            errors.push(validation.error);
          }
        }
        break;
      
      case 3:
        if (formData.medical_condition === 'yes') {
          const validation = validateField('medical_details', formData.medical_details);
          if (!validation.isValid) {
            errors.push(validation.error);
          }
        }
        if (!isTermlyCourseCategory(formData.course_category)) {
          const sessionsValidation = validateField('sessions_per_week', formData.sessions_per_week);
          if (!sessionsValidation.isValid) {
            errors.push(sessionsValidation.error);
          }
        }
        if (formData.course_category === 'Music' && formData.learning_mode === 'home' && !formData.home_lesson_duration) {
          errors.push('Please select home lesson duration (30 minutes or 1 hour).');
        }
        break;
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const logFormData = (data: any, label: string) => {
    console.group(`🔍 ${label}`);
    console.log('Form Data Structure:', Object.keys(data));
    console.log('Form Data Values:', data);
    console.log('Data Types:', Object.entries(data).map(([key, value]) => `${key}: ${typeof value}`));
    console.groupEnd();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!agreedToTerms) {
      toast({
        title: "Agreement Required",
        description: "You must agree to the Terms of Service and Cancellation Policy to proceed.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Comprehensive validation before submission
    console.group('🚀 Form Submission Started');
    logFormData(formData, 'Original Form Data');
    
    // Validate all steps
    const allErrors: string[] = [];
    for (let step = 1; step <= 4; step++) {
      const stepValidation = validateStep(step);
      if (!stepValidation.isValid) {
        allErrors.push(`Step ${step} errors: ${stepValidation.errors.join(', ')}`);
      }
    }
    
    if (allErrors.length > 0) {
      console.error('❌ Validation Errors:', allErrors);
      toast({
        title: "Validation Errors",
        description: allErrors.join('\n'),
        variant: "destructive",
      });
      setIsSubmitting(false);
      console.groupEnd();
      return;
    }
    
    console.log('✅ All validation passed');

    try {
      // Test Supabase connection
      console.log('🔌 Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('registrations')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Connection test failed:', testError);
        console.error('Connection Error Details:', {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        });
        toast({
          title: "Connection Error",
          description: `Cannot connect to database: ${testError.message}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        console.groupEnd();
        return;
      }
      
      console.log('✅ Connection test successful');

      // Prepare the complete data for submission
      let instrumentValue = formData.instrument;
      if (formData.course_category === 'Art') {
        instrumentValue = 'Art Classes'; // canonical name for art in fees table
      } else if (formData.course_category === 'Languages') {
        instrumentValue =
          formData.language_type === 'Other'
            ? formData.custom_language?.trim() || 'Language Lessons'
            : formData.language_type?.trim() || 'Language Lessons';
      }
      const submissionData = {
        student_name: formData.student_name.trim(),
        age: parseInt(formData.age),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        country_code: formData.country_code || "+254",
        parent_name: formData.parent_name?.trim() || null,
        parent_phone: formData.parent_phone?.trim() || null,
        course_category: formData.course_category,
        music_subcategory: formData.music_subcategory?.trim() || null,
        instrument: instrumentValue === "Other" ? formData.custom_instrument?.trim() : (instrumentValue?.trim() || "Not specified"),
        production_type: formData.production_type?.trim() || null,
        term_period: isTermlyCourseCategory(formData.course_category)
          ? (formData.term_period || '1st_term')
          : null,
        technology_type: formData.technology_type?.trim() || null,
        language_type:
          formData.course_category === 'Languages'
            ? (formData.language_type === 'Other'
                ? formData.custom_language?.trim() || 'Other'
                : formData.language_type?.trim() || null)
            : null,
        language_pathway: formData.course_category === 'Languages' ? formData.language_pathway : null,
        language_package: formData.course_category === 'Languages' ? formData.language_package : null,
        experience: formData.proficiency_level || "beginner",
        proficiency_level: formData.proficiency_level || "beginner",
        learning_mode: formData.course_category === 'Languages'
          ? LANGUAGE_LEARNING_MODE
          : (formData.learning_mode || "in-person"),
        home_lesson_duration: (formData.learning_mode === "home" && formData.course_category === "Music" && formData.home_lesson_duration) ? formData.home_lesson_duration : null,
        owns_instrument: Boolean(formData.owns_instrument),
        location: formData.location?.trim() || null,
        medical_condition: formData.medical_condition || "no",
        medical_details: formData.medical_condition === "yes" ? formData.medical_details?.trim() : null,
        goals: formData.goals?.trim() || null,
        preferred_schedule: formData.preferred_schedule?.trim() || null,
        date_of_birth: formData.date_of_birth,
        sessions_per_week: parseInt(String(formData.sessions_per_week), 10) || 1,
        status: 'pending'
      };

      logFormData(submissionData, 'Processed Submission Data');

      // Log the exact SQL that would be executed (for debugging)
      console.log('📝 SQL Insert Statement (simulated):');
      console.log(`INSERT INTO registrations (${Object.keys(submissionData).join(', ')}) VALUES (${Object.values(submissionData).map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')})`);

      console.log('🔍 About to insert registration data...');
      console.log('🔍 Submission data keys:', Object.keys(submissionData));
      console.log('🔍 Submission data values:', Object.values(submissionData));

      const { data, error } = await supabase
        .from('registrations')
        .insert([submissionData])
        .select('*, receipt_number');

      if (error) {
        console.error('❌ Registration error:', error);
        
        // Provide specific error messages based on error codes
        let userMessage = `Registration failed: ${error.message}`;
        if (error.code === '23505') {
          if (error.message && error.message.includes('receipt_number')) {
            userMessage = 'System error: duplicate receipt number. Please try again or contact support.';
          } else if (error.message && error.message.includes('email')) {
            userMessage = 'A registration with this email already exists. Please use a different email address.';
          } else {
            userMessage = `Duplicate entry error: ${error.message}`;
          }
        } else if (error.code === '23502') {
          userMessage = 'Required field missing. Please check all required fields are filled.';
        } else if (error.code === '23503') {
          userMessage = 'Invalid reference data. Please check your selections.';
        } else if (error.code === '42501') {
          userMessage = 'Permission denied. Please contact support.';
        }
        
        // Show the actual error for debugging
        console.error('❌ Registration error:', error);
        toast({
          title: 'Registration Failed',
          description: userMessage,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        console.groupEnd();
        return;
      }

      console.log('✅ Registration successful:', data);
      console.groupEnd();

      setIsSubmitted(true);
      
      // Send application confirmation email
      try {
        const emailSent = await sendApplicationConfirmationEmail(data[0]);
        if (emailSent) {
          console.log('✅ Application confirmation email sent successfully');
        } else {
          console.error('❌ Failed to send application confirmation email');
        }
      } catch (emailError) {
        console.error('❌ Error sending application confirmation email:', emailError);
      }
      
      toast({
        title: "Registration Successful! 🎉",
        description: "Your application has been received! We'll contact you within 2 business days.",
      });

      // Save date_of_birth into profiles table
      if (formData.date_of_birth) {
        const { error: dateOfBirthError } = await supabase
          .from('profiles')
          .update({ date_of_birth: formData.date_of_birth })
          .eq('email', formData.email);
        
        if (dateOfBirthError) {
          console.error('❌ Error updating date_of_birth in profiles:', dateOfBirthError);
          // Don't fail the registration if this fails
        } else {
          console.log('✅ Date of birth updated in profiles table');
        }
      }

      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          student_name: "",
          age: "",
          email: "",
          phone: "",
          country_code: "+254",
          parent_name: "",
          parent_phone: "",
          course_category: "",
          music_subcategory: "",
          instrument: "",
          custom_instrument: "",
          production_type: "",
          technology_type: "",
          language_type: "",
          custom_language: "",
          language_pathway: "conversational",
          language_package: "individual",
          experience: "",
          goals: "",
          preferred_schedule: "",
          proficiency_level: "beginner",
          learning_mode: "in-person",
          home_lesson_duration: "",
          owns_instrument: false,
          location: "",
          medical_condition: "no",
          medical_details: "",
          date_of_birth: '',
          sessions_per_week: 1,
        });
        setCurrentStep(1);
        setIsSubmitted(false);
      }, 3000);

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      console.error('Error stack:', (error as Error).stack);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again or contact support.",
        variant: "destructive",
      });
      console.groupEnd();
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 px-4">
      <div className="flex items-center max-w-full overflow-hidden">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center flex-shrink-0">
            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-300 ${
              step <= currentStep 
                ? 'bg-gradient-to-r from-primary to-accent border-transparent text-white' 
                : 'border-gray-300 text-gray-400'
            }`}>
              {step < currentStep ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : step}
            </div>
            {step < 4 && (
              <div className={`w-8 sm:w-12 md:w-16 h-1 mx-1 sm:mx-2 transition-all duration-300 ${
                step < currentStep ? 'bg-gradient-to-r from-primary to-accent' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Personal Information</h3>
        <p className="text-gray-600">Let's start with your basic details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
          <Label htmlFor="student_name" className="text-sm font-medium text-gray-700">Full Name *</Label>
          <Input
            id="student_name"
            value={formData.student_name}
            onChange={(e) => setFormData({...formData, student_name: e.target.value})}
            className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
            placeholder="Enter your full name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age" className="text-sm font-medium text-gray-700">Age *</Label>
          <Input
            id="age"
            type="number"
            min="2"
            max="100"
            value={formData.age}
            onChange={(e) => setFormData({...formData, age: e.target.value})}
            className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
            placeholder="Your age"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="h-12 pl-10 border-gray-300 focus:border-primary focus:ring-primary"
              placeholder="your.email@example.com"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number *</Label>
          <div className="flex">
            <Select value={formData.country_code} onValueChange={(value) => setFormData({...formData, country_code: value})}>
              <SelectTrigger className="w-20 md:w-24 h-12 border-r-0 rounded-r-none border-gray-300 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countryCodes.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <span className="text-xs md:text-sm">{country.flag} {country.country} ({country.code})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="h-12 flex-1 border-l-0 rounded-l-none border-gray-300 focus:border-primary focus:ring-primary"
              placeholder="Phone number"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location *</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="h-12 pl-10 border-gray-300 focus:border-primary focus:ring-primary"
            placeholder="Your city or area"
            required
          />
        </div>
      </div>

      {/* Mobile-optimized Date of Birth with Year Dropdown */}
      <div className="space-y-4">
        <Label htmlFor="date_of_birth" className="text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></Label>
        
        {/* Desktop: Regular date input */}
        <div className="hidden md:block">
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
            required
            className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
          />
        </div>

        {/* Mobile: Custom date picker with year dropdown */}
        <div className="md:hidden space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {/* Day */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-600">Day</Label>
              <Select 
                value={formData.date_of_birth ? new Date(formData.date_of_birth).getDate().toString() : ""}
                onValueChange={(day) => {
                  const currentDate = formData.date_of_birth ? new Date(formData.date_of_birth) : new Date(2000, 0, 1); // Default to Jan 1, 2000
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const dayNum = parseInt(day);
                  
                  // Validate date and prevent rollover
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const validDay = Math.min(dayNum, daysInMonth);
                  
                  const newDate = new Date(year, month, validDay);
                  // Format date as YYYY-MM-DD without timezone conversion
                  const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
                  setFormData({ ...formData, date_of_birth: formattedDate });
                }}
              >
                <SelectTrigger className="h-12 border-gray-300 focus:border-primary focus:ring-primary">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-600">Month</Label>
              <Select 
                value={formData.date_of_birth ? (new Date(formData.date_of_birth).getMonth() + 1).toString() : ""}
                onValueChange={(month) => {
                  const currentDate = formData.date_of_birth ? new Date(formData.date_of_birth) : new Date(2000, 0, 1); // Default to Jan 1, 2000
                  const year = currentDate.getFullYear();
                  const monthNum = parseInt(month) - 1; // Convert to 0-based
                  const currentDay = currentDate.getDate();
                  
                  // Validate date and prevent rollover
                  const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
                  const validDay = Math.min(currentDay, daysInMonth);
                  
                  const newDate = new Date(year, monthNum, validDay);
                  // Format date as YYYY-MM-DD without timezone conversion
                  const formattedDate = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
                  setFormData({ ...formData, date_of_birth: formattedDate });
                }}
              >
                <SelectTrigger className="h-12 border-gray-300 focus:border-primary focus:ring-primary">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: "1", label: "January" },
                    { value: "2", label: "February" },
                    { value: "3", label: "March" },
                    { value: "4", label: "April" },
                    { value: "5", label: "May" },
                    { value: "6", label: "June" },
                    { value: "7", label: "July" },
                    { value: "8", label: "August" },
                    { value: "9", label: "September" },
                    { value: "10", label: "October" },
                    { value: "11", label: "November" },
                    { value: "12", label: "December" }
                  ].map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-600">Year</Label>
              <Select 
                value={formData.date_of_birth ? new Date(formData.date_of_birth).getFullYear().toString() : ""}
                onValueChange={(year) => {
                  const currentDate = formData.date_of_birth ? new Date(formData.date_of_birth) : new Date(2000, 0, 1); // Default to Jan 1, 2000
                  const yearNum = parseInt(year);
                  const month = currentDate.getMonth();
                  const currentDay = currentDate.getDate();
                  
                  // Validate date and prevent rollover (especially for leap years)
                  const daysInMonth = new Date(yearNum, month + 1, 0).getDate();
                  const validDay = Math.min(currentDay, daysInMonth);
                  
                  const newDate = new Date(yearNum, month, validDay);
                  // Format date as YYYY-MM-DD without timezone conversion
                  const formattedDate = `${yearNum}-${String(month + 1).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
                  setFormData({ ...formData, date_of_birth: formattedDate });
                }}
              >
                <SelectTrigger className="h-12 border-gray-300 focus:border-primary focus:ring-primary">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Show selected date */}
          {formData.date_of_birth && (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
              Selected: {new Date(formData.date_of_birth).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-700">Medical Conditions</Label>
        <RadioGroup 
          value={formData.medical_condition} 
          onValueChange={(value) => setFormData({...formData, medical_condition: value, medical_details: value === "no" ? "" : formData.medical_details})}
          className="flex flex-col sm:flex-row gap-4 sm:gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="no-medical" />
            <Label htmlFor="no-medical" className="text-sm font-medium text-gray-700">No medical conditions</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="yes-medical" />
            <Label htmlFor="yes-medical" className="text-sm font-medium text-gray-700">Yes, I have medical conditions</Label>
          </div>
        </RadioGroup>
        
        {formData.medical_condition === "yes" && (
          <div className="space-y-2">
            <Label htmlFor="medical_details" className="text-sm font-medium text-gray-700">Please specify your medical conditions *</Label>
            <Textarea
              id="medical_details"
              value={formData.medical_details}
              onChange={(e) => setFormData({...formData, medical_details: e.target.value})}
              placeholder="Please describe any medical conditions, allergies, or special needs that we should be aware of..."
              rows={3}
              className="border-gray-300 focus:border-primary focus:ring-primary resize-none"
              required
            />
            <p className="text-xs text-gray-500">This information helps us provide appropriate accommodations and ensure your safety during classes.</p>
          </div>
        )}
      </div>

      {parseInt(formData.age) < 18 && (
        <>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 md:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <h4 className="font-semibold text-orange-800 text-lg">Parent/Guardian Information Required</h4>
            </div>
            <p className="text-orange-700 text-sm">Since you are under 18, we require parent/guardian contact information.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parent_name" className="text-sm font-medium text-gray-700">
                  Parent/Guardian Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={e => setFormData({ ...formData, parent_name: e.target.value })}
                  required
                  className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                  placeholder="Enter parent/guardian full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_phone" className="text-sm font-medium text-gray-700">
                  Parent/Guardian Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="parent_phone"
                  value={formData.parent_phone}
                  onChange={e => setFormData({ ...formData, parent_phone: e.target.value })}
                  required
                  className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                  placeholder="Enter parent/guardian phone number"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full mb-4">
          <Music className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Course Selection</h3>
        <p className="text-gray-600">Choose your area of interest</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Course Category *</Label>
          <RadioGroup 
            value={formData.course_category} 
            onValueChange={(value) => setFormData({...formData, course_category: value, music_subcategory: "", instrument: "", production_type: "", technology_type: "", language_type: "", custom_language: "", language_pathway: "conversational", language_package: "individual", learning_mode: value === "Languages" ? LANGUAGE_LEARNING_MODE : formData.learning_mode, sessions_per_week: value === "Languages" ? 1 : formData.sessions_per_week})}
            className="grid md:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            <div className="relative">
              <RadioGroupItem value="Music" id="music" className="sr-only" />
              <Label htmlFor="music" className={`flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                formData.course_category === "Music" 
                  ? "border-primary bg-primary/5 shadow-lg" 
                  : "border-gray-200 hover:border-primary"
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${
                  formData.course_category === "Music" 
                    ? "bg-gradient-to-r from-primary to-accent scale-110" 
                    : "bg-gradient-to-r from-primary to-accent"
                }`}>
                  <Guitar className="w-6 h-6 text-white" />
                </div>
                <span className={`font-medium transition-colors duration-200 ${
                  formData.course_category === "Music" ? "text-primary" : "text-gray-800"
                }`}>Music</span>
                <span className="text-sm text-gray-500 text-center mt-1">Learn instruments & theory</span>
              </Label>
            </div>
            <div className="relative">
              <RadioGroupItem value="Production" id="production" className="sr-only" />
              <Label htmlFor="production" className={`flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                formData.course_category === "Production" 
                  ? "border-primary bg-primary/5 shadow-lg" 
                  : "border-gray-200 hover:border-primary"
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${
                  formData.course_category === "Production" 
                    ? "bg-gradient-to-r from-accent to-secondary scale-110" 
                    : "bg-gradient-to-r from-accent to-secondary"
                }`}>
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <span className={`font-medium transition-colors duration-200 ${
                  formData.course_category === "Production" ? "text-primary" : "text-gray-800"
                }`}>Production</span>
                <span className="text-sm text-gray-500 text-center mt-1">Music production & sound</span>
              </Label>
            </div>
            <div className="relative">
              <RadioGroupItem value="Art" id="art" className="sr-only" />
              <Label htmlFor="art" className={`flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                formData.course_category === "Art" 
                  ? "border-primary bg-primary/5 shadow-lg" 
                  : "border-gray-200 hover:border-primary"
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${
                  formData.course_category === "Art" 
                    ? "bg-gradient-to-r from-secondary to-primary scale-110" 
                    : "bg-gradient-to-r from-secondary to-primary"
                }`}>
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <span className={`font-medium transition-colors duration-200 ${
                  formData.course_category === "Art" ? "text-primary" : "text-gray-800"
                }`}>Art</span>
                <span className="text-sm text-gray-500 text-center mt-1">Visual arts & creativity</span>
              </Label>
            </div>
            <div className="relative">
              <RadioGroupItem value="Technology" id="technology" className="sr-only" />
              <Label htmlFor="technology" className={`flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                formData.course_category === "Technology" 
                  ? "border-primary bg-primary/5 shadow-lg" 
                  : "border-gray-200 hover:border-primary"
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${
                  formData.course_category === "Technology" 
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 scale-110" 
                    : "bg-gradient-to-r from-blue-500 to-purple-500"
                }`}>
                  <Code className="w-6 h-6 text-white" />
                </div>
                <span className={`font-medium transition-colors duration-200 ${
                  formData.course_category === "Technology" ? "text-primary" : "text-gray-800"
                }`}>Technology</span>
                <span className="text-sm text-gray-500 text-center mt-1">Web design & programming</span>
              </Label>
            </div>
            <div className="relative">
              <RadioGroupItem value="Languages" id="languages" className="sr-only" />
              <Label htmlFor="languages" className={`flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                formData.course_category === "Languages"
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-gray-200 hover:border-primary"
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${
                  formData.course_category === "Languages"
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 scale-110"
                    : "bg-gradient-to-r from-teal-500 to-cyan-500"
                }`}>
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <span className={`font-medium transition-colors duration-200 ${
                  formData.course_category === "Languages" ? "text-primary" : "text-gray-800"
                }`}>Languages</span>
                <span className="text-sm text-gray-500 text-center mt-1">Languages & cultural fluency</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {formData.course_category === "Music" && (
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Music Program *</Label>
            <RadioGroup 
              value={formData.music_subcategory} 
              onValueChange={(value) => setFormData({...formData, music_subcategory: value, instrument: ""})}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="relative">
                <RadioGroupItem value="Individual Lessons" id="individual" className="sr-only" />
                <Label htmlFor="individual" className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  formData.music_subcategory === "Individual Lessons" 
                    ? "border-primary bg-primary/5 shadow-lg" 
                    : "border-gray-200 hover:border-primary"
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-200 ${
                    formData.music_subcategory === "Individual Lessons" 
                      ? "bg-gradient-to-r from-primary to-accent scale-110" 
                      : "bg-gradient-to-r from-primary to-accent"
                  }`}>
                    <Guitar className="w-5 h-5 text-white" />
                  </div>
                  <span className={`font-medium transition-colors duration-200 text-sm ${
                    formData.music_subcategory === "Individual Lessons" ? "text-primary" : "text-gray-800"
                  }`}>Individual Lessons</span>
                  <span className="text-xs text-gray-500 text-center mt-1">1-on-1 instruction</span>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem value="DMA Kids Band" id="kids-band" className="sr-only" />
                <Label htmlFor="kids-band" className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  formData.music_subcategory === "DMA Kids Band" 
                    ? "border-primary bg-primary/5 shadow-lg" 
                    : "border-gray-200 hover:border-primary"
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-200 ${
                    formData.music_subcategory === "DMA Kids Band" 
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 scale-110" 
                      : "bg-gradient-to-r from-green-500 to-emerald-500"
                  }`}>
                    <Music2 className="w-5 h-5 text-white" />
                  </div>
                  <span className={`font-medium transition-colors duration-200 text-sm ${
                    formData.music_subcategory === "DMA Kids Band" ? "text-primary" : "text-gray-800"
                  }`}>DMA Kids Band</span>
                  <span className="text-xs text-gray-500 text-center mt-1">Group learning</span>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem value="DMA Children's Choir" id="childrens-choir" className="sr-only" />
                <Label htmlFor="childrens-choir" className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  formData.music_subcategory === "DMA Children's Choir" 
                    ? "border-primary bg-primary/5 shadow-lg" 
                    : "border-gray-200 hover:border-primary"
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-200 ${
                    formData.music_subcategory === "DMA Children's Choir" 
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 scale-110" 
                      : "bg-gradient-to-r from-purple-500 to-pink-500"
                  }`}>
                    <Users2 className="w-5 h-5 text-white" />
                  </div>
                  <span className={`font-medium transition-colors duration-200 text-sm ${
                    formData.music_subcategory === "DMA Children's Choir" ? "text-primary" : "text-gray-800"
                  }`}>DMA Children's Choir</span>
                  <span className="text-xs text-gray-500 text-center mt-1">Vocal ensemble</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {(formData.course_category === "Music" && formData.music_subcategory === "Individual Lessons") && (
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Instrument *</Label>
            <Select value={formData.instrument} onValueChange={(value) => setFormData({...formData, instrument: value})}>
              <SelectTrigger className="h-12 border-gray-300 focus:border-primary focus:ring-primary">
                <SelectValue placeholder="Select your instrument" />
              </SelectTrigger>
              <SelectContent>
                {musicInstruments.map((instrument) => (
                  <SelectItem key={instrument} value={instrument}>
                    {instrument}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.instrument === "Other" && (
              <Input
                placeholder="Please specify your instrument"
                className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                onChange={(e) => setFormData({...formData, custom_instrument: e.target.value})}
              />
            )}
          </div>
        )}

        {(formData.course_category === "Music" && (formData.music_subcategory === "DMA Kids Band" || formData.music_subcategory === "DMA Children's Choir")) && (
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Instrument (Optional)</Label>
            <Select value={formData.instrument} onValueChange={(value) => setFormData({...formData, instrument: value})}>
              <SelectTrigger className="h-12 border-gray-300 focus:border-primary focus:ring-primary">
                <SelectValue placeholder="Select your instrument (optional)" />
              </SelectTrigger>
              <SelectContent>
                {musicInstruments.map((instrument) => (
                  <SelectItem key={instrument} value={instrument}>
                    {instrument}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.instrument === "Other" && (
              <Input
                placeholder="Please specify your instrument"
                className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                onChange={(e) => setFormData({...formData, custom_instrument: e.target.value})}
              />
            )}
          </div>
        )}

        {formData.course_category === "Production" && (
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Production Program *</Label>
            <Select value={formData.production_type} onValueChange={(value) => setFormData({...formData, production_type: value})}>
              <SelectTrigger className="h-12 border-gray-300 focus:border-primary focus:ring-primary">
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {productionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label className="text-sm font-medium text-gray-700">Term *</Label>
            <Select
              value={formData.term_period}
              onValueChange={(value) => setFormData({ ...formData, term_period: value })}
            >
              <SelectTrigger className="h-12 border-gray-300 focus:border-primary focus:ring-primary">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st_term">1st Term (new students)</SelectItem>
                <SelectItem value="final_term">Final Term (returning students)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.course_category === "Technology" && (
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Technology Type *</Label>
            <Select value={formData.technology_type} onValueChange={(value) => setFormData({...formData, technology_type: value})}>
              <SelectTrigger className="h-12 border-gray-300 focus:border-primary focus:ring-primary">
                <SelectValue placeholder="Select technology type" />
              </SelectTrigger>
              <SelectContent>
                {technologyTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.course_category === "Languages" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
              <p className="font-medium mb-1">Fully remote language program</p>
              <p>{LANGUAGE_PROGRAM_INTRO}</p>
              <p className="mt-2 text-xs text-teal-800">{LANGUAGE_PRICING_NOTE}</p>
            </div>

            <Label className="text-sm font-medium text-gray-700">Language *</Label>
            <Select
              value={formData.language_type}
              onValueChange={(value) => setFormData({ ...formData, language_type: value, custom_language: value === 'Other' ? formData.custom_language : '' })}
            >
              <SelectTrigger className="h-12 border-gray-300 focus:border-primary focus:ring-primary">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang === 'Other' ? 'Other native African language' : lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.language_type === 'Other' && (
              <Input
                placeholder="Specify language (e.g. Amharic, Yoruba)"
                value={formData.custom_language}
                onChange={(e) => setFormData({ ...formData, custom_language: e.target.value })}
                className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
              />
            )}

            <Label className="text-sm font-medium text-gray-700">Learning pathway *</Label>
            <RadioGroup
              value={formData.language_pathway}
              onValueChange={(value) => setFormData({ ...formData, language_pathway: value })}
              className="grid gap-3"
            >
              {LANGUAGE_PATHWAYS.map((pathway) => (
                <div key={pathway.value} className="relative">
                  <RadioGroupItem value={pathway.value} id={`pathway-${pathway.value}`} className="sr-only" />
                  <Label
                    htmlFor={`pathway-${pathway.value}`}
                    className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.language_pathway === pathway.value
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-primary'
                    }`}
                  >
                    <span className="font-medium">{pathway.label}</span>
                    <span className="text-sm text-gray-500 mt-1">{pathway.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <Label className="text-sm font-medium text-gray-700">Package *</Label>
            <RadioGroup
              value={formData.language_package}
              onValueChange={(value) => setFormData({ ...formData, language_package: value })}
              className="grid gap-3"
            >
              {LANGUAGE_PACKAGES.map((pkg) => (
                <div key={pkg.value} className="relative">
                  <RadioGroupItem value={pkg.value} id={`pkg-${pkg.value}`} className="sr-only" />
                  <Label
                    htmlFor={`pkg-${pkg.value}`}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.language_package === pkg.value
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-primary'
                    }`}
                  >
                    <span className="font-medium">{pkg.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full mb-4">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Learning Preferences</h3>
        <p className="text-gray-600">Tell us about your experience and preferences</p>
      </div>

      {formData.course_category === "Music" && (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Current Musical Proficiency *</Label>
            <RadioGroup 
              value={formData.proficiency_level} 
              onValueChange={(value) => setFormData({...formData, proficiency_level: value})}
              className="grid gap-4"
            >
              {proficiencyLevels.map((level) => (
                <div key={level.value} className="relative">
                  <RadioGroupItem value={level.value} id={level.value} className="sr-only" />
                  <Label htmlFor={level.value} className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    formData.proficiency_level === level.value 
                      ? "border-primary bg-primary/5 shadow-md" 
                      : "border-gray-200 hover:border-primary"
                  }`}>
                    <div className="flex items-center h-5">
                      <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center transition-all duration-200 ${
                        formData.proficiency_level === level.value 
                          ? "border-primary bg-primary" 
                          : "border-gray-300"
                      }`}>
                        {formData.proficiency_level === level.value && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium transition-colors duration-200 ${
                        formData.proficiency_level === level.value ? "text-primary" : "text-gray-800"
                      }`}>{level.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{level.description}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Learning Mode *</Label>
            <RadioGroup 
              value={formData.learning_mode} 
              onValueChange={(value) => setFormData({
                ...formData,
                learning_mode: value,
                home_lesson_duration: value === "home" ? formData.home_lesson_duration : "",
              })}
              className="grid gap-4"
            >
              {(isTermlyCourseCategory(formData.course_category)
                ? [
                    { value: 'in-person', label: 'Physical (at the Academy)' },
                    { value: 'online', label: 'Online' },
                  ]
                : learningModes
              ).map((mode) => (
                <div key={mode.value} className="relative">
                  <RadioGroupItem value={mode.value} id={mode.value} className="sr-only" />
                  <Label htmlFor={mode.value} className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    formData.learning_mode === mode.value 
                      ? "border-primary bg-primary/5 shadow-md" 
                      : "border-gray-200 hover:border-primary"
                  }`}>
                    <div className="flex items-center h-5">
                      <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center transition-all duration-200 ${
                        formData.learning_mode === mode.value 
                          ? "border-primary bg-primary" 
                          : "border-gray-300"
                      }`}>
                        {formData.learning_mode === mode.value && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <span className={`font-medium transition-colors duration-200 ${
                      formData.learning_mode === mode.value ? "text-primary" : "text-gray-800"
                    }`}>{mode.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {formData.course_category === "Music" && formData.learning_mode === "home" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Home lesson session duration *</Label>
              <Select
                value={formData.home_lesson_duration || ""}
                onValueChange={(value) => setFormData({ ...formData, home_lesson_duration: value })}
              >
                <SelectTrigger className="h-12 border-gray-300 focus:border-primary focus:ring-primary">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30_min">30 minutes — KSh 6,000/month</SelectItem>
                  <SelectItem value="1_hour">1 hour — KSh 12,000/month</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">Choose how long each home lesson session will be. Billing is based on this selection.</p>
            </div>
          )}

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Checkbox
              id="owns_instrument"
              checked={formData.owns_instrument}
              onCheckedChange={(checked) => setFormData({...formData, owns_instrument: checked as boolean})}
              className="w-5 h-5"
            />
            <Label htmlFor="owns_instrument" className="text-sm font-medium text-gray-700">
              I own the instrument I want to learn
            </Label>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Label htmlFor="goals" className="text-sm font-medium text-gray-700">Learning Goals</Label>
        <Textarea
          id="goals"
          value={formData.goals}
          onChange={(e) => setFormData({...formData, goals: e.target.value})}
          placeholder="What would you like to achieve? (e.g., learn specific songs, prepare for exams, performance goals, career development)"
          rows={4}
          className="border-gray-300 focus:border-primary focus:ring-primary resize-none"
          required
        />
      </div>

      <div className="space-y-4">
        <Label htmlFor="preferred_schedule" className="text-sm font-medium text-gray-700">Preferred Schedule</Label>
        <Input
          id="preferred_schedule"
          value={formData.preferred_schedule}
          onChange={(e) => setFormData({...formData, preferred_schedule: e.target.value})}
          placeholder="e.g., Weekday evenings, Sunday mornings, Flexible"
          className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
          required
        />
      </div>

      {(formData.course_category === "Technology") && (
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">Learning Mode *</Label>
          <RadioGroup
            value={formData.learning_mode}
            onValueChange={(value) => setFormData({ ...formData, learning_mode: value })}
            className="grid gap-4"
          >
            {[
              { value: 'in-person', label: 'In Person at the Academy' },
              { value: 'online', label: 'Online' },
            ].map((mode) => (
              <div key={mode.value} className="relative">
                <RadioGroupItem value={mode.value} id={`lang-tech-${mode.value}`} className="sr-only" />
                <Label
                  htmlFor={`lang-tech-${mode.value}`}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    formData.learning_mode === mode.value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-gray-200 hover:border-primary'
                  }`}
                >
                  <span className={`font-medium ${formData.learning_mode === mode.value ? 'text-primary' : 'text-gray-800'}`}>
                    {mode.label}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {formData.course_category === "Languages" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-medium">Delivery: Fully online (remote only)</p>
          <p className="mt-1">Language lessons are delivered remotely with flexible scheduling across time zones. Onsite and hybrid options are not available for this program.</p>
        </div>
      )}

      {!isTermlyCourseCategory(formData.course_category) && (
        <div className="space-y-4">
          <Label htmlFor="sessions_per_week" className="text-sm font-medium text-gray-700">Number of Classes per Week *</Label>
          <Select
            value={String(formData.sessions_per_week)}
            onValueChange={(value) => setFormData({ ...formData, sessions_per_week: parseInt(value, 10) })}
          >
            <SelectTrigger className="h-12 border-gray-300 focus:border-primary focus:ring-primary">
              <SelectValue placeholder="Select number of classes per week" />
            </SelectTrigger>
            <SelectContent>
              {(formData.course_category === 'Languages' ? [1, 2] : [1, 2, 3, 4, 5]).map((num) => (
                <SelectItem key={num} value={String(num)}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.course_category === 'Languages' && (
            <p className="text-sm font-medium text-primary">
              Estimated monthly tuition: {formatLanguageMonthlyPrice(formData.language_package, formData.sessions_per_week)}
            </p>
          )}
        </div>
      )}

    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Review & Submit</h3>
        <p className="text-gray-600">Please review your information before submitting</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h4 className="font-medium text-gray-800 mb-4">Registration Summary</h4>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Name:</span>
            <p className="text-gray-800">{formData.student_name}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Age:</span>
            <p className="text-gray-800">{formData.age}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Email:</span>
            <p className="text-gray-800">{formData.email}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Phone:</span>
            <p className="text-gray-800">{formData.country_code} {formData.phone}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Location:</span>
            <p className="text-gray-800">{formData.location}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Course:</span>
            <p className="text-gray-800">{formData.course_category}</p>
          </div>
          {formData.course_category === "Music" && (
            <>
              <div>
                <span className="font-medium text-gray-600">Instrument:</span>
                <p className="text-gray-800">{formData.instrument === "Other" ? formData.custom_instrument : formData.instrument}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Proficiency:</span>
                <p className="text-gray-800">{formData.proficiency_level}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Learning Mode:</span>
                <p className="text-gray-800">{formData.learning_mode}</p>
              </div>
              {formData.learning_mode === "home" && (
                <div>
                  <span className="font-medium text-gray-600">Home lesson duration:</span>
                  <p className="text-gray-800">{formData.home_lesson_duration === "30_min" ? "30 minutes (KSh 6,000/month)" : formData.home_lesson_duration === "1_hour" ? "1 hour (KSh 12,000/month)" : "—"}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-600">Owns Instrument:</span>
                <p className="text-gray-800">{formData.owns_instrument ? "Yes" : "No"}</p>
              </div>
            </>
          )}
          {formData.course_category === "Production" && (
            <div>
              <span className="font-medium text-gray-600">Production Type:</span>
              <p className="text-gray-800">{formData.production_type}</p>
            </div>
          )}
          {formData.course_category === "Technology" && (
            <div>
              <span className="font-medium text-gray-600">Technology Type:</span>
              <p className="text-gray-800">{formData.technology_type}</p>
            </div>
          )}
          {formData.course_category === "Languages" && (
            <>
              <div>
                <span className="font-medium text-gray-600">Language:</span>
                <p className="text-gray-800">
                  {formData.language_type === 'Other' ? formData.custom_language : formData.language_type}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Pathway:</span>
                <p className="text-gray-800">{getLanguagePathwayLabel(formData.language_pathway)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Package:</span>
                <p className="text-gray-800">{getLanguagePackageLabel(formData.language_package)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Delivery:</span>
                <p className="text-gray-800">Fully online (remote only)</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Sessions per week:</span>
                <p className="text-gray-800">{formData.sessions_per_week}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Monthly tuition:</span>
                <p className="text-gray-800">{formatLanguageMonthlyPrice(formData.language_package, formData.sessions_per_week)}</p>
              </div>
            </>
          )}
          <div>
            <span className="font-medium text-gray-600">Medical Conditions:</span>
            <p className="text-gray-800">{formData.medical_condition === "yes" ? "Yes" : "No"}</p>
          </div>
          {formData.medical_condition === "yes" && (
            <div>
              <span className="font-medium text-gray-600">Medical Details:</span>
              <p className="text-gray-800">{formData.medical_details}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-8">
        <label className="flex items-start gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={e => setAgreedToTerms(e.target.checked)}
            className="mt-1 accent-primary"
          />
          <span>
            I have read and agree to the{' '}
            <Link to="/terms-of-service" className="text-primary underline" target="_blank">Terms of Service</Link>{' '}and{' '}
            <Link to="/cancellation-policy" className="text-primary underline" target="_blank">Cancellation Policy</Link>.
          </span>
        </label>
      </div>

      <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <CheckCircle className="w-5 h-5 text-blue-600" />
        <p className="text-sm text-blue-800">
          By submitting this form, you agree to our terms and conditions. We'll contact you within 24 hours to confirm your enrollment.
        </p>
      </div>
    </div>
  );

  const renderSuccessMessage = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful! 🎉</h3>
        <p className="text-gray-600">Thank you for registering with Damon Music Academy</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
        <h4 className="font-medium text-green-800 mb-4">What happens next?</h4>
        <div className="space-y-3 text-sm text-green-700">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>A confirmation email with your receipt has been sent to your email address</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>We'll review your registration within 24-48 hours</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Our team will contact you to confirm your enrollment and schedule your first lesson</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Please check your email (including spam folder) for the confirmation receipt</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button
          onClick={() => {
            setFormData({
              student_name: "",
              age: "",
              email: "",
              phone: "",
              country_code: "+254",
              parent_name: "",
              parent_phone: "",
              course_category: "",
              instrument: "",
              custom_instrument: "",
              production_type: "",
              experience: "",
              goals: "",
              preferred_schedule: "",
              proficiency_level: "beginner",
              learning_mode: "in-person",
              owns_instrument: false,
              location: "",
              medical_condition: "no",
              medical_details: "",
              date_of_birth: '',
              sessions_per_week: 1,
            });
            setCurrentStep(1);
            setIsSubmitted(false);
          }}
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Register Another Student
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    if (isSubmitted) {
      return renderSuccessMessage();
    }
    
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.student_name && formData.age && formData.email && formData.phone && formData.location && formData.date_of_birth && 
               formData.medical_condition && 
               (formData.medical_condition === "no" || (formData.medical_condition === "yes" && formData.medical_details.trim()));
      case 2:
        if (!formData.course_category) return false;
        if (formData.course_category === 'Music') return !!formData.instrument;
        if (formData.course_category === 'Production') return !!formData.production_type;
        if (formData.course_category === 'Technology') return !!formData.technology_type;
        if (formData.course_category === 'Languages') {
          return !!formData.language_type
            && (formData.language_type !== 'Other' || !!formData.custom_language.trim())
            && !!formData.language_pathway
            && !!formData.language_package;
        }
        return true;
      case 3:
        if (formData.course_category === 'Music') {
          return formData.proficiency_level && formData.learning_mode && (formData.learning_mode !== 'home' || (formData.home_lesson_duration === '30_min' || formData.home_lesson_duration === '1_hour'));
        }
        if (formData.course_category === 'Languages') {
          return !!formData.sessions_per_week && (formData.sessions_per_week === 1 || formData.sessions_per_week === 2);
        }
        if (formData.course_category === 'Technology') {
          return !!formData.learning_mode && !!formData.sessions_per_week;
        }
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <section id="registration" className="pt-32 lg:pt-36 pb-24 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-16">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 bg-gradient-to-r from-primary to-accent rounded-full shadow-2xl">
              <Music className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Start Your Creative Journey
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Join hundreds of students who have discovered their passion at Damon Music Academy
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              {!isSubmitted && renderStepIndicator()}
              
              <form onSubmit={handleSubmit}>
                {renderCurrentStep()}
                
                {!isSubmitted && (
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrev}
                      disabled={currentStep === 1}
                      className="flex items-center space-x-2 px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </Button>
                    
                    {currentStep < 4 ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceed()}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isSubmitting || !canProceed()}
                        className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Complete Registration</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

          {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto mt-8 sm:mt-12 lg:mt-16">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
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

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
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

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-secondary/20 rounded-full">
                    <Star className="h-8 w-8 text-secondary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-secondary mb-2">4.8</h3>
                <p className="text-muted-foreground">Average Rating</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Registration;
