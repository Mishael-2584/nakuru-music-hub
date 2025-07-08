import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  MessageCircle, 
  Copy,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  className?: string;
  variant?: "default" | "compact" | "floating";
}

const SocialShare = ({ 
  url, 
  title, 
  description = "", 
  imageUrl = "", 
  className = "",
  variant = "default"
}: SocialShareProps) => {
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();

  const shareData = {
    url,
    title,
    text: description,
    imageUrl
  };

  const shareButtons = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-sky-500 hover:bg-sky-600",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700 hover:bg-blue-800",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-600 hover:bg-green-700",
      url: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-gray-600 hover:bg-gray-700",
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\nRead more: ${url}`)}`
    }
  ];

  const handleShare = async (shareUrl: string, platform: string) => {
    try {
      // Try native sharing first (mobile)
      if (navigator.share && platform !== "Email") {
        await navigator.share({
          title,
          text: description,
          url
        });
        return;
      }

      // Fallback to opening URL
      window.open(shareUrl, '_blank', 'width=600,height=400');
      
      toast({
        title: "Shared!",
        description: `Article shared to ${platform}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Share Failed",
        description: "Could not share to this platform",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      
      toast({
        title: "Link Copied!",
        description: "Article link copied to clipboard",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title,
        text: description,
        url
      });
    } catch (error) {
      console.error('Error with native sharing:', error);
      // Fallback to showing all buttons
      setShowAll(true);
    }
  };

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="flex items-center gap-2"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
      </div>
    );
  }

  if (variant === "floating") {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <div className="bg-white rounded-full shadow-2xl border border-gray-200 p-2">
          <div className="flex items-center gap-2">
            {shareButtons.map((button) => (
              <Button
                key={button.name}
                size="sm"
                className={`${button.color} text-white rounded-full w-10 h-10 p-0`}
                onClick={() => handleShare(button.url, button.name)}
                title={`Share on ${button.name}`}
              >
                <button.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold text-lg">Share this article</span>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {/* Native share button for mobile */}
        {navigator.share && (
          <Button
            onClick={handleNativeShare}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}

        {/* Individual platform buttons */}
        {shareButtons.map((button) => (
          <Button
            key={button.name}
            variant="outline"
            onClick={() => handleShare(button.url, button.name)}
            className="flex items-center gap-2 hover:scale-105 transition-transform"
            title={`Share on ${button.name}`}
          >
            <button.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{button.name}</span>
          </Button>
        ))}

        {/* Copy link button */}
        <Button
          variant="outline"
          onClick={handleCopyLink}
          className="flex items-center gap-2 hover:scale-105 transition-transform"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="hidden sm:inline">
            {copied ? "Copied!" : "Copy Link"}
          </span>
        </Button>
      </div>

      {/* Share statistics */}
      <div className="text-sm text-muted-foreground pt-2 border-t">
        <p>Help us reach more music enthusiasts! Share this article to spread the word about Damon Music Academy.</p>
      </div>
    </div>
  );
};

export default SocialShare; 