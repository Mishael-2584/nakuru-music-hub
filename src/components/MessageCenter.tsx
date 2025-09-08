import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Send, Inbox, Send as SendIcon, User, Clock, Eye, Reply, Trash2, Plus, Video } from 'lucide-react';
import MeetingInvitationCard from './MeetingInvitationCard';

interface Message {
  id: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  sender_name?: string;
  recipient_name?: string;
  message_type: string;
  meeting_id?: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MessageCenterProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  messages: Message[];
  users: User[];
  onSendMessage: (message: any) => void;
  onMarkAsRead: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

const MessageCenter: React.FC<MessageCenterProps> = ({
  currentUser,
  messages,
  users,
  onSendMessage,
  onMarkAsRead,
  onDeleteMessage
}) => {
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [newMessage, setNewMessage] = useState({
    subject: '',
    message: '',
    recipient_id: '',
    message_type: 'general'
  });

  // Search functionality for recipients
  const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);

  const inboxMessages = messages.filter(m => m.recipient_id === currentUser.id);
  const sentMessages = messages.filter(m => m.sender_id === currentUser.id);
  const unreadMessages = inboxMessages.filter(m => !m.is_read);

  // Filter recipients for search
  const filteredRecipients = users.filter(user => 
    user.id !== currentUser.id && (
      user.name.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(recipientSearchTerm.toLowerCase())
    )
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage({
      ...newMessage,
      sender_id: currentUser.id
    });
    setShowComposeModal(false);
    setNewMessage({
      subject: '',
      message: '',
      recipient_id: '',
      message_type: 'general'
    });
  };

  // Close recipient dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.recipient-search-container')) {
        setShowRecipientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset recipient search when modal closes
  useEffect(() => {
    if (!showComposeModal) {
      setRecipientSearchTerm('');
      setSelectedRecipient(null);
      setShowRecipientDropdown(false);
    }
  }, [showComposeModal]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'bg-blue-100 text-blue-800';
      case 'assignment': return 'bg-green-100 text-green-800';
      case 'payment': return 'bg-yellow-100 text-yellow-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'meeting_invitation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting_invitation': return <Video className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  const renderMessageCard = (message: Message) => {
    // Special rendering for meeting invitations
    if (message.message_type === 'meeting_invitation' && message.meeting_id) {
      return (
        <MeetingInvitationCard
          key={message.id}
          meetingId={message.meeting_id}
          subject={message.subject}
          message={message.message}
          senderName={message.sender_name || 'Unknown'}
          sentAt={message.created_at}
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          isRead={message.is_read}
          onMarkAsRead={() => onMarkAsRead(message.id)}
        />
      );
    }

    // Regular message rendering
    return (
      <div key={message.id} className={`p-4 border rounded-lg ${!message.is_read ? 'bg-blue-50 border-blue-200' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold">{message.subject}</h4>
            <Badge className={getMessageTypeColor(message.message_type)}>
              {getMessageTypeIcon(message.message_type)}
              {message.message_type}
            </Badge>
            {!message.is_read && <Badge variant="secondary">New</Badge>}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{formatDate(message.created_at)}</span>
            <Button variant="outline" size="sm" onClick={() => setSelectedMessage(message)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDeleteMessage(message.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-2">From: {message.sender_name}</p>
        <p className="text-gray-700">{message.message.substring(0, 100)}...</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Message Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Inbox className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{inboxMessages.length}</div>
                <div className="text-sm text-gray-600">Total Messages</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{unreadMessages.length}</div>
                <div className="text-sm text-gray-600">Unread</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <SendIcon className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{sentMessages.length}</div>
                <div className="text-sm text-gray-600">Sent</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{users.length}</div>
                <div className="text-sm text-gray-600">Contacts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compose Message Button */}
      <div className="flex justify-end">
        <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowComposeModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Compose Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Compose New Message</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <Label htmlFor="recipient">To</Label>
                <div className="relative recipient-search-container">
                  <Input
                    id="recipient"
                    placeholder="Search for recipient..."
                    value={selectedRecipient ? `${selectedRecipient.name} (${selectedRecipient.role})` : recipientSearchTerm}
                    onChange={(e) => {
                      setRecipientSearchTerm(e.target.value);
                      setSelectedRecipient(null);
                      setNewMessage({...newMessage, recipient_id: ''});
                      setShowRecipientDropdown(true);
                    }}
                    onFocus={() => setShowRecipientDropdown(true)}
                    className="w-full"
                  />
                  {showRecipientDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredRecipients.length > 0 ? (
                        filteredRecipients.map(user => (
                          <div
                            key={user.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              setSelectedRecipient(user);
                              setNewMessage({...newMessage, recipient_id: user.id});
                              setRecipientSearchTerm('');
                              setShowRecipientDropdown(false);
                            }}
                          >
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email} ({user.role})</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">No recipients found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  placeholder="Message subject"
                  required
                />
              </div>

              <div>
                <Label htmlFor="message_type">Message Type</Label>
                <Select value={newMessage.message_type} onValueChange={(value) => setNewMessage({...newMessage, message_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="lesson">Lesson Related</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                  placeholder="Type your message here..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowComposeModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Message Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>Manage your communications</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inbox">Inbox ({inboxMessages.length})</TabsTrigger>
              <TabsTrigger value="sent">Sent ({sentMessages.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadMessages.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="inbox" className="space-y-4">
              {inboxMessages.length > 0 ? (
                inboxMessages.map(message => renderMessageCard(message))
              ) : (
                <p className="text-gray-500 text-center py-8">No messages in inbox</p>
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {sentMessages.length > 0 ? (
                sentMessages.map(message => renderMessageCard(message))
              ) : (
                <p className="text-gray-500 text-center py-8">No sent messages</p>
              )}
            </TabsContent>

            <TabsContent value="unread" className="space-y-4">
              {unreadMessages.length > 0 ? (
                unreadMessages.map(message => renderMessageCard(message))
              ) : (
                <p className="text-gray-500 text-center py-8">No unread messages</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Message Detail Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    From: {selectedMessage.sender_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    To: {selectedMessage.recipient_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Date: {formatDate(selectedMessage.created_at)}
                  </p>
                </div>
                <Badge className={getMessageTypeColor(selectedMessage.message_type)}>
                  {selectedMessage.message_type}
                </Badge>
              </div>
              <div className="border-t pt-4">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                  Close
                </Button>
                <Button>
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageCenter; 