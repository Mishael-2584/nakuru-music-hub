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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-6 w-6 p-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Free Trial Classes Available!
              </span>
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-muted-foreground text-sm">
              Experience our world-class education before you commit
            </p>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border">
                <benefit.icon className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-sm text-blue-900">{benefit.title}</h4>
                  <p className="text-xs text-blue-700">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Available Subjects */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Available Subjects
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {subjects.map((subject, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <subject.icon className={`w-4 h-4 ${subject.color}`} />
                  <span className="text-sm font-medium">{subject.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              + More music instruments and programming topics available
            </p>
          </div>

          {/* What You'll Get */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
            <h3 className="font-semibold text-lg mb-2 text-green-800">What You'll Get:</h3>
            <ul className="space-y-1 text-sm text-green-700">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Professional skill assessment
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Personalized learning plan
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Hands-on experience with expert instructor
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Course recommendations tailored to your goals
              </li>
            </ul>
          </div>

          {/* Testimonial */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-sm text-purple-800 italic mb-2">
              "The trial class was amazing! I learned so much in just one session and couldn't wait to start regular lessons."
            </blockquote>
            <p className="text-xs text-purple-600 font-medium">- Sarah M., Piano Student</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold">
              <Link to="/trial-classes" onClick={handleClose}>
                <Gift className="w-4 h-4 mr-2" />
                Book Free Trial Class
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to="/fees" onClick={handleClose}>
                <BookOpen className="w-4 h-4 mr-2" />
                View Pricing
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>500+ Students</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                <span>Since 2016</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                <span>5-Star Rated</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialClassPopup;
