// src/components/chatroom/session/ChatPanel.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Paperclip, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { sendMessage, shareDocument } from '@/lib/redux/slices/sessionSlice';
import type { ChatroomMessage } from '@prisma/client';
import type { SafeUser } from '@/types';
import { CldUploadWidget } from "next-cloudinary";
import NextImage from "next/image"; // To avoid conflict with lucide-react Image icon
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";


interface ChatPanelProps {
  user: SafeUser | null;
  isHost: boolean;
}

interface CloudinaryResult {
  event?: "success";
  info?: {
    secure_url: string;
    resource_type: string;
    original_filename: string;
    format: string;
  };
}

export default function ChatPanel({ user, isHost }: ChatPanelProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const activeSession = useAppSelector(state => state.session.activeSession);
  const messages = activeSession?.messages || [];
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user || !activeSession) return null;

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeSession) return;
    setIsSending(true);
    try {
        await dispatch(sendMessage({
            sessionId: activeSession.id,
            content: newMessage.trim(),
        })).unwrap();
        setNewMessage('');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erreur d'envoi",
            description: error.message || "Impossible d'envoyer le message.",
        });
    } finally {
        setIsSending(false);
    }
  };
  
  // File upload logic can be added later
  const handleUploadSuccess = (result: CloudinaryResult) => {
    // This functionality would require an API endpoint and a thunk
    toast({ title: "Fonctionnalité non implémentée" });
  };

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const renderMessageContent = (msg: ChatroomMessage) => {
    // Simplified: No document sharing in this refactor
    return <p className="text-sm whitespace-pre-wrap">{msg.content}</p>;
  };

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Chat de la session</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-start gap-3 ${msg.authorId === user.id ? 'justify-end' : ''}`}>
                {msg.authorId !== user.id && (
                  <img src={(msg.author as any).img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(msg.author as any).name}`} alt={(msg.author as any).name || 'avatar'} className="w-8 h-8 rounded-full" />
                )}
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.authorId === user.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold">{(msg.author as any).name}</p>
                    <p className="text-xs opacity-70">{formatTime(msg.createdAt)}</p>
                  </div>
                  {renderMessageContent(msg)}
                </div>
                 {msg.authorId === user.id && (
                  <img src={user.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt={user.name || 'avatar'} className="w-8 h-8 rounded-full" />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Votre message..."
              onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
              className="bg-card"
              disabled={isSending}
            />
            <Button onClick={handleSendMessage} size="icon" title="Envoyer" disabled={isSending}>
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
