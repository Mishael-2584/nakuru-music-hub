import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Star, 
  Music, 
  Code, 
  Users, 
  Award, 
  Clock, 
  X,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TrialClassPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrialClassPopup = ({ isOpen, onClose }: TrialClassPopupProps) => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Show popup after 3 seconds
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShowPopup(false);
    onClose();
  };

  const benefits = [
    {
      icon: Gift,
      title: "100% Free",
      description: "No cost, no commitment"
    },
    {
      icon: Users,
      title: "1-on-1 Session",
      description: "Personalized attention"
    },
    {
      icon: Award,
      title: "Expert Instructors",
      description: "Qualified teachers"
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      description: "Choose your time"
    }
  ];

  const subjects = [
    { name: "Piano", icon: Music, color: "text-blue-600" },
    { name: "Guitar", icon: Music, color: "text-green-600" },
    { name: "Violin", icon: Music, color: "text-purple-600" },
    { name: "Coding & Programming", icon: Code, color: "text-orange-600" },
    { name: "Vocals", icon: Music, color: "text-pink-600" },
    { name: "Drums", icon: Music, color: "text-red-600" }
  ];

  return (
    <Dialog open={isOpen && showPopup} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-xl md:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pr-8 sm:pr-0 mb-3 sm:mb-4">
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500" />
              <span className="text-base sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Free Trial Classes Available!
              </span>
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500" />
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Experience our world-class education before you commit
            </p>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-6">
          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border">
                <benefit.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-semibold text-[10px] sm:text-sm text-blue-900">{benefit.title}</h4>
                  <p className="text-[9px] sm:text-xs text-blue-700 truncate">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Available Subjects */}
          <div>
            <h3 className="font-semibold text-sm sm:text-lg mb-1.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
              <BookOpen className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-primary" />
              Available Subjects
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
              {subjects.map((subject, index) => (
                <div key={index} className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-gray-50 rounded-md">
                  <subject.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${subject.color} flex-shrink-0`} />
                  <span className="text-[10px] sm:text-sm font-medium truncate">{subject.name}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              + More music instruments and programming topics available
            </p>
          </div>

          {/* What You'll Get */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-2 sm:p-4 rounded-lg border">
            <h3 className="font-semibold text-sm sm:text-lg mb-1.5 sm:mb-2 text-green-800">What You'll Get:</h3>
            <ul className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-sm text-green-700">
              <li className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
                <span>Professional skill assessment</span>
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
                <span>Personalized learning plan</span>
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
                <span>Hands-on experience with expert instructor</span>
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
                <span>Course recommendations tailored to your goals</span>
              </li>
            </ul>
          </div>

          {/* Testimonial - Hidden on mobile for space */}
          <div className="hidden sm:block bg-gradient-to-r from-purple-50 to-pink-50 p-3 sm:p-4 rounded-lg border">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-xs sm:text-sm text-purple-800 italic mb-2">
              "The trial class was amazing! I learned so much in just one session and couldn't wait to start regular lessons."
            </blockquote>
            <p className="text-xs text-purple-600 font-medium">- Sarah M., Piano Student</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-1.5 sm:gap-3">
            <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-2 sm:py-3 text-xs sm:text-sm">
              <Link to="/trial-classes" onClick={handleClose}>
                <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Book Free Trial Class
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full py-2 sm:py-3 text-xs sm:text-sm">
              <Link to="/fees" onClick={handleClose}>
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                View Pricing
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleClose} 
              className="w-full py-1.5 sm:py-3 text-muted-foreground hover:text-foreground text-xs sm:text-sm"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Maybe Later
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="text-center pt-1 sm:pt-2">
            <div className="flex items-center justify-center gap-2 sm:gap-4 text-[9px] sm:text-xs text-muted-foreground">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">500+ Students</span>
                <span className="sm:hidden">500+</span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Since 2016</span>
                <span className="sm:hidden">2016</span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">5-Star Rated</span>
                <span className="sm:hidden">5★</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialClassPopup;
