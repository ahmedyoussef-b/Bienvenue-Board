
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Users, MessageCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import type { SafeUser } from '@/types';
import { sendMessage, clearChatMessages, type ChatMessage } from '@/lib/redux/slices/sessionSlice';

interface ChatRoomProps {
  roomType: 'admin' | 'teacher';
  title: string;
  description?: string;
  allowedRoles: ('ADMIN' | 'TEACHER')[];
}

export default function ChatRoom({ roomType, title, description, allowedRoles }: ChatRoomProps) {
  const dispatch = useAppDispatch();
  const user: SafeUser | null = useAppSelector((state) => state.auth.user);
  const messages = useAppSelector((state) => state.session.chatMessages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clear messages when component unmounts or room changes to avoid message leakage
  useEffect(() => {
    dispatch(clearChatMessages());
    return () => {
      dispatch(clearChatMessages());
    };
  }, [dispatch, roomType]);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message: Omit<ChatMessage, 'id'> = {
      userId: user.id,
      userName: user.name || user.email,
      userAvatar: user.img || undefined,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(), // Use serializable string
      userRole: user.role.toLowerCase() as 'admin' | 'teacher'
    };

    dispatch(sendMessage({
      ...message,
      id: `msg_${Date.now()}`,
    } as ChatMessage));
    
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'TEACHER':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Accès non autorisé
            </h3>
            <p className="text-gray-500">
              Vous n'avez pas les permissions nécessaires pour accéder à cette salle de chat.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="h-[calc(100vh-2rem)] flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-6 h-6" />
                  {title}
                </CardTitle>
                {description && (
                  <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  1 en ligne
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
                    <p>Aucun message pour le moment.</p>
                    <p className="text-sm">Soyez le premier à envoyer un message !</p>
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.userId === user.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.userId !== user.id && (
                      <img
                        src={message.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.userName}`}
                        alt={message.userName}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    )}
                    
                    <div className={`max-w-xs lg:max-w-md ${
                      message.userId === user.id ? 'order-first' : ''
                    }`}>
                      <div className={`rounded-lg p-3 ${
                        message.userId === user.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border'
                      }`}>
                        {message.userId !== user.id && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {message.userName}
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getRoleBadgeColor(message.userRole)}`}
                            >
                              {message.userRole === 'admin' ? 'Admin' : 
                               message.userRole === 'teacher' ? 'Prof' : 'Élève'}
                            </Badge>
                          </div>
                        )}
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.userId === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>

                    {message.userId === user.id && (
                      <img
                        src={user.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                        alt={user.name || ''}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
