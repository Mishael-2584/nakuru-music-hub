import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { MessageSquare, Send, Reply, Search, Filter } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';

interface Message {
  id: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  type?: 'received' | 'sent';
}

interface Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserType: 'student' | 'teacher' | 'admin';
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
}

interface Recipient {
  id: string;
  user_id: string;
  name: string;
  email: string;
  type: 'student' | 'teacher' | 'admin';
}

interface MessagingUIProps {
  recipients: Recipient[];
  currentUserId: string;
  currentUserName: string;
  userType: 'student' | 'teacher' | 'admin';
}

const MessagingUI: React.FC<MessagingUIProps> = ({ 
  recipients, 
  currentUserId, 
  currentUserName, 
  userType 
}) => {
  const { toast } = useToast();
  
  // Debug logging
  console.log('🔍 MessagingUI props:', { 
    recipientsCount: recipients.length, 
    recipients, 
    currentUserId, 
    currentUserName, 
    userType 
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: '',
    message: '',
    recipient_id: ''
  });
  const [chatMessage, setChatMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'sent'>('all');
  const [loading, setLoading] = useState(false);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      const { data: receivedMessages, error: receivedError } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('recipient_id', currentUserId)
        .order('created_at', { ascending: false });

      const { data: sentMessages, error: sentError } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('sender_id', currentUserId)
        .order('created_at', { ascending: false });

      if (receivedError || sentError) {
        console.error('Error fetching messages:', receivedError || sentError);
        return;
      }

      const allMessages = [
        ...(receivedMessages || []).map(msg => ({ ...msg, type: 'received' as const })),
        ...(sentMessages || []).map(msg => ({ ...msg, type: 'sent' as const }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setMessages(allMessages);
      
      // Group messages into conversations
      const conversationMap = new Map<string, Message[]>();
      
      allMessages.forEach(message => {
        const otherUserId = message.sender_id === currentUserId ? message.recipient_id : message.sender_id;
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, []);
        }
        conversationMap.get(otherUserId)!.push(message);
      });
      
      const conversationsList: Conversation[] = [];
      
      conversationMap.forEach((messages, otherUserId) => {
        const sortedMessages = messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const lastMessage = sortedMessages[sortedMessages.length - 1];
        const unreadCount = messages.filter(msg => !msg.is_read && msg.type === 'received').length;
        
        const otherUser = recipients.find(r => r.user_id === otherUserId);
        if (otherUser) {
          conversationsList.push({
            otherUserId,
            otherUserName: otherUser.name,
            otherUserType: otherUser.type,
            messages: sortedMessages,
            lastMessage,
            unreadCount
          });
        }
      });
      
      // Sort conversations by last message time
      conversationsList.sort((a, b) => 
        new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      );
      
      setConversations(conversationsList);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markConversationAsRead = async (conversation: Conversation) => {
    try {
      const unreadMessages = conversation.messages.filter(msg => !msg.is_read && msg.type === 'received');
      
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg.id);
        
        const { error } = await supabase
          .from('portal_messages')
          .update({ is_read: true })
          .in('id', messageIds);

        if (error) {
          console.error('Error marking messages as read:', error);
          return;
        }

        // Refresh messages to update the UI
        await fetchMessages();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.subject || !newMessage.message || !newMessage.recipient_id) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('portal_messages')
        .insert({
          sender_id: currentUserId,
          recipient_id: newMessage.recipient_id,
          subject: newMessage.subject,
          message: newMessage.message
        })
        .select()
        .single();

      if (error) throw error;

      setShowComposeModal(false);
      setNewMessage({ subject: '', message: '', recipient_id: '' });
      await fetchMessages();

      toast({
        title: "Success",
        description: "Message sent successfully!",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleSendChatMessage = async () => {
    if (!selectedConversation) {
      toast({
        title: "Validation Error",
        description: "No conversation selected",
        variant: "destructive",
      });
      return;
    }
    
    if (!chatMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    const messageToSend = chatMessage.trim();
    setChatMessage(''); // Clear input immediately for better UX

    try {
      const { data, error } = await supabase
        .from('portal_messages')
        .insert({
          sender_id: currentUserId,
          recipient_id: selectedConversation.otherUserId,
          subject: `Chat with ${selectedConversation.otherUserName}`,
          message: messageToSend
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state immediately for instant feedback
      const newMessage: Message = {
        ...data,
        type: 'sent' as const
      };

      // Update the selected conversation with the new message
      setSelectedConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
          lastMessage: newMessage
        };
      });

      // Update the conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.otherUserId === selectedConversation.otherUserId
            ? {
                ...conv,
                messages: [...conv.messages, newMessage],
                lastMessage: newMessage
              }
            : conv
        )
      );

      toast({
        title: "Success",
        description: "Message sent successfully!",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message in the input if sending failed
      setChatMessage(messageToSend);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const getRecipientName = (recipientId: string) => {
    const recipient = recipients.find(r => r.user_id === recipientId);
    console.log('🔍 getRecipientName:', { recipientId, recipient, allRecipients: recipients });
    return recipient ? recipient.name : 'Unknown';
  };

  const getSenderName = (senderId: string) => {
    const sender = recipients.find(r => r.user_id === senderId);
    console.log('🔍 getSenderName:', { senderId, sender, allRecipients: recipients });
    return sender ? sender.name : 'Unknown';
  };

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.otherUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.lastMessage.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.lastMessage.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && conversation.unreadCount > 0) ||
                         (filter === 'sent' && conversation.lastMessage.type === 'sent');

    return matchesSearch && matchesFilter;
  });

  const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [currentUserId]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedConversation?.messages.length]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">Messages</h2>
            <p className="text-sm text-gray-500">
              {totalUnreadCount > 0 ? `${totalUnreadCount} unread message${totalUnreadCount > 1 ? 's' : ''}` : 'No unread messages'}
            </p>
          </div>
        </div>
        <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
          <DialogTrigger asChild>
            <Button>
              <Send className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Compose New Message</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recipient" className="text-right">To</Label>
                <Select 
                  value={newMessage.recipient_id} 
                  onValueChange={(value) => setNewMessage({...newMessage, recipient_id: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipients.map(recipient => (
                      <SelectItem key={recipient.user_id} value={recipient.user_id}>
                        {recipient.name} ({recipient.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">Subject</Label>
                <Input
                  id="subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  className="col-span-3"
                  placeholder="Message subject"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message" className="text-right">Message</Label>
                <Textarea
                  id="message"
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                  className="col-span-3"
                  placeholder="Your message..."
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowComposeModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={(value: 'all' | 'unread' | 'sent') => setFilter(value)}>
            <SelectTrigger className="w-32">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading conversations...</p>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map(conversation => (
              <div
                key={conversation.otherUserId}
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  conversation.unreadCount > 0 ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => {
                  setSelectedConversation(conversation);
                  setShowChatModal(true);
                  // Mark messages as read when opening conversation
                  markConversationAsRead(conversation);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {conversation.otherUserName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold truncate">
                          {conversation.otherUserName} ({conversation.otherUserType})
                        </h4>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {conversation.unreadCount} new
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.lastMessage.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(conversation.lastMessage.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No conversations found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || filter !== 'all' ? 'Try adjusting your search or filter' : 'Start a conversation by sending a message'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Chat with {selectedConversation?.otherUserName}
            </DialogTitle>
          </DialogHeader>
          {selectedConversation && (
            <div className="space-y-4">
                             <ScrollArea className="h-64 border rounded-lg p-4" ref={chatScrollRef}>
                 <div className="space-y-3">
                   {selectedConversation.messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                          message.type === 'sent'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDate(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex space-x-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                />
                <Button onClick={handleSendChatMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagingUI; 