import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Shield, Phone, MessageSquare, X, ChevronRight, Clock, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../firebase';
import { subscribeToMessages, sendMessage, subscribeToChatSessions, createChatSession } from '../../services/user/featureService';
import { SupportMessage } from '../../types';

export default function SupportChat({ userId, userName }: { userId: string, userName: string }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToChatSessions(userId, (data) => {
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        setCurrentSessionId(data[0].id);
      }
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToMessages(currentSessionId, (data) => {
      setMessages(data);
    });
    return () => unsub();
  }, [currentSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || !currentSessionId) return;
    setIsSending(true);
    try {
      await sendMessage(currentSessionId, {
        chat_id: currentSessionId,
        sender_id: userId || '0000',
        sender_name: userName,
        message: newMessage
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateSession = async () => {
    const title = prompt("চ্যাটের একটি শিরোনাম দিন");
    if (!title) return;
    await createChatSession(userId, title);
  };

  return (
    <div className="h-full flex bg-slate-50 rounded-3xl overflow-hidden border border-slate-200">
      {/* Sessions Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col">
        <button 
          onClick={handleCreateSession}
          className="flex items-center gap-2 w-full p-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all mb-4"
        >
          <Plus size={20} /> নতুন চ্যাট
        </button>
        <div className="flex-1 overflow-y-auto space-y-2">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`w-full p-3 text-left rounded-xl ${currentSessionId === session.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100'}`}
            >
              {session.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
          <h3 className="font-bold text-slate-900">
            {sessions.find(s => s.id === currentSessionId)?.title || "সাপোর্ট চ্যাট"}
          </h3>
          <a href="tel:+8801XXXXXXXXX" className="p-3 hover:bg-indigo-50 rounded-2xl transition-all text-indigo-600 hover:text-indigo-700">
            <Phone size={20} />
          </a>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 text-slate-500">
               <MessageSquare size={48} className="mb-4" />
               <p>মেসেজ পাঠানো শুরু করুন</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-3xl shadow-sm max-w-[80%] ${msg.sender_id === userId ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        {currentSessionId && (
          <div className="p-6 bg-white border-t border-slate-200">
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <input 
                type="text" 
                placeholder="আপনার মেসেজ লিখুন..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-transparent border-none outline-none px-4 py-2"
              />
              <button onClick={handleSendMessage} className="p-3 bg-indigo-600 text-white rounded-xl">
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
