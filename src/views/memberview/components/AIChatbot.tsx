import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your HCMUT Smart Parking AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "How do I top up my wallet?",
    "How to find a parking spot?",
    "Register a membership plan",
    "View my parking history",
    "Technical support"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textOverride?: string) => {
    const userMessage = textOverride || input.trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!apiKey) {
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: '⚠️ Groq API Key not found. Please add VITE_GROQ_API_KEY to your .env file.' 
          }]);
          setIsLoading(false);
        }, 1000);
        return;
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { 
              role: 'system', 
              content: 'You are a professional AI assistant for the HCMUT Smart Parking system (Ho Chi Minh City University of Technology). Your task is to help users (members) with: finding parking spots, topping up their wallet, registering for membership plans, viewing transaction history, and basic technical support. Please answer in English by default (unless the user speaks Vietnamese), be polite, friendly, and concise. If you don\'t know the answer, guide the user to the "Support" section.' 
            },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Groq API Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting. Please try again later!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-2xl shadow-[0_8px_30px_rgb(0,84,163,0.4)] flex items-center justify-center z-[60] cursor-pointer group"
      >
        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="material-symbols-outlined text-3xl transition-transform duration-300">
          {isOpen ? 'close' : 'smart_toy'}
        </span>
        
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-accent-cyan flex items-center justify-center text-[10px] font-bold">1</span>
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9, blur: 10 }}
            animate={{ opacity: 1, y: 0, scale: 1, blur: 0 }}
            exit={{ opacity: 0, y: 40, scale: 0.9, blur: 10 }}
            className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] glass-panel border border-white/40 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[60] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-primary to-primary-dark text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                <span className="material-symbols-outlined text-8xl">smart_toy</span>
              </div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                  <span className="material-symbols-outlined text-2xl">smart_toy</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Smart Assistant</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-xs text-white/80 font-medium">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-[20px] text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20'
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white p-4 rounded-[20px] rounded-tl-none border border-slate-100 flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-primary/80 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </motion.div>
              )}

              {!isLoading && messages.length === 1 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {suggestions.map((suggestion, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      onClick={() => handleSend(suggestion)}
                      className="px-4 py-2 bg-white/80 hover:bg-white text-primary border border-primary/10 rounded-full text-[13px] font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 text-left"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/80 backdrop-blur-md border-t border-slate-100">
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="w-full pl-5 pr-14 py-4 bg-slate-100/50 border border-transparent rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:hover:scale-100 shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-3 font-medium uppercase tracking-wider">
                Powered by Groq Cloud • Llama 3
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
