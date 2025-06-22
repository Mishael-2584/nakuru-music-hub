import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle } from "lucide-react"

interface FounderChatPopupProps {
  children: React.ReactNode;
}

export const FounderChatPopup = ({ children }: FounderChatPopupProps) => {
  const founderName = "Musumba Collince";
  const phoneNumber = "+254701195460";
  const message = "Hello! I'm interested in learning more about Damon Music Academy's programs.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 mr-4 mb-2 bg-white rounded-xl shadow-2xl border-primary/20">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-bold leading-none text-primary">Chat with the Founder</h4>
            <p className="text-sm text-muted-foreground">
              Have questions? Get them answered directly by our founder.
            </p>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-primary/5 rounded-lg">
            <Avatar className="h-16 w-16">
              {/* To add the founder's image, place it in the public folder and update the path below */}
              <AvatarImage src="/founder-musumba.jpg" />
              <AvatarFallback className="bg-primary text-white text-2xl">MC</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{founderName}</p>
              <p className="text-sm text-muted-foreground">Founder, Damon Music Academy</p>
            </div>
          </div>
          <Button
            onClick={() => window.open(whatsappUrl, '_blank')}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Start WhatsApp Chat
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
} 