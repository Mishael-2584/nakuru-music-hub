import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FounderChatPopup } from "./FounderChatPopup";

const WhatsAppChat = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <FounderChatPopup>
        <Button
          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 group animate-bounce"
          size="lg"
          style={{
            animationDuration: '2s',
            animationIterationCount: 'infinite'
          }}
        >
          <MessageCircle className="h-6 w-6 mr-2" />
          <span className="font-semibold">
            Chat Now
          </span>
        </Button>
      </FounderChatPopup>
    </div>
  );
};

export default WhatsAppChat;
