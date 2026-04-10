import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Shield, Phone, MessageSquare, X, ChevronRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToMessages, sendMessage } from '../../services/user/featureService';
import { SupportMessage } from '../../types';

export default function SupportChat({ userId, userName }: { userId: string, userName: string }) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToMessages(userId, (data) => {
      setMessages(data);
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendMessage(userId, {
        chat_id: userId,
        sender_id: userId,
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

  return (
    <div className="h-full flex flex-col bg-slate-50 rounded-3xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">অ্যাডমিন সাপোর্ট</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">অনলাইন</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-500">
            <Phone size={20} />
          </button>
          <button className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-500">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="bg-indigo-100 p-6 rounded-full mb-6">
              <MessageSquare size={48} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">সাপোর্ট টিমের সাথে কথা বলুন</h3>
            <p className="text-slate-500 max-w-xs">আপনার যেকোনো সমস্যা বা জিজ্ঞাসার জন্য এখানে মেসেজ দিন। আমাদের প্রতিনিধি খুব শীঘ্রই আপনার সাথে যোগাযোগ করবেন।</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] flex gap-3 ${msg.sender_id === userId ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                  msg.sender_id === userId ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}>
                  {msg.sender_name.substring(0, 1).toUpperCase()}
                </div>
                <div className={`p-4 rounded-3xl shadow-sm ${
                  msg.sender_id === userId 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  <div className={`flex items-center gap-1 mt-2 text-[10px] ${
                    msg.sender_id === userId ? 'text-indigo-200' : 'text-slate-400'
                  }`}>
                    <Clock size={10} />
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-200">
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <input 
            type="text" 
            placeholder="আপনার মেসেজ লিখুন..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-slate-800 font-medium"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="p-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
