
import { Button } from "@/components/ui/button";
import { Instagram, Facebook, Youtube, Twitter, MessageCircle } from "lucide-react";

const SocialMedia = () => {
  const socialLinks = [
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://www.instagram.com/damon_music_academy/",
      color: "from-pink-500 to-purple-600"
    },
    {
      name: "Facebook", 
      icon: Facebook,
      url: "https://www.facebook.com/profile.php?id=100063578945234",
      color: "from-blue-600 to-blue-700"
    },
    {
      name: "YouTube",
      icon: Youtube, 
      url: "https://www.youtube.com/channel/UCExample",
      color: "from-red-500 to-red-600"
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: "https://x.com/AcademyDamon/status/1342439351767195648",
      color: "from-sky-400 to-sky-600"
    }
  ];

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hello! I'm interested in learning more about Damon Music Academy programs.");
    window.open(`https://wa.me/254701195460?text=${message}`, '_blank');
  };

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Connect With Us
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Follow our musical journey and stay updated with the latest news, events, and student performances
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {socialLinks.map((social) => {
            const IconComponent = social.icon;
            return (
              <Button
                key={social.name}
                variant="outline"
                size="lg"
                className={`group bg-gradient-to-r ${social.color} hover:${social.color} text-white border-0 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
                onClick={() => window.open(social.url, '_blank')}
              >
                <IconComponent className="h-5 w-5 mr-2" />
                {social.name}
              </Button>
            );
          })}
        </div>
        
        {/* WhatsApp Chat */}
        <div className="mt-8">
          <Button
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            onClick={handleWhatsAppClick}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Chat on WhatsApp
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Get instant answers to your questions
          </p>
        </div>
      </div>
    </section>
  );
};

export default SocialMedia;
