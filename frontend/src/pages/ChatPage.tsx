import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Sparkles, 
  AlertTriangle,
  Stethoscope,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useScreening } from '../context/ScreeningContext';
import { ChatMessage } from '../types';

interface ChatPageProps {
  onFindDoctor?: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ onFindDoctor }) => {
  const { language, setLanguage } = useAuth();
  const { latestResult } = useScreening();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'user',
      content: 'What does my result mean?'
    },
    {
      role: 'assistant',
      content: 'Your screening result shows a medium risk of diabetic retinopathy. This means there are some changes in your retina that need further evaluation by an eye specialist.\n\nI recommend you to book an appointment with an ophthalmologist. Would you like me to help you find one nearby?'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);
    setEmergencyAlert(null);

    try {
      const res = await api.sendChatMessage(
        query,
        language,
        latestResult ? {
          condition: latestResult.primary_condition,
          risk: latestResult.risk_level
        } : undefined
      );

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.reply
      }]);

      if (res.is_emergency) {
        setEmergencyAlert(res.emergency_warning || 'URGENT: Please report to the nearest emergency eye clinic.');
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I am having trouble connecting to the medical server. Please consult an eye specialist directly.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (prompt: string) => {
    if (prompt === 'Find nearby doctor' && onFindDoctor) {
      onFindDoctor();
    } else {
      handleSendMessage(prompt);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-4 animate-fade-in text-left">
      {/* Top Banner */}
      <div className="card-clean p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-[#F1F6FC] border border-blue-100 flex items-center justify-center text-[#0756B8] shadow-2xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#071426]">AI Eye Assistant</h2>
            <p className="text-xs text-slate-500 font-medium">Your AI-powered eye health companion</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-700 font-bold">Online & Ready</span>
        </div>
      </div>

      {/* Emergency Alert Banner if triggered */}
      {emergencyAlert && (
        <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-500 text-red-900 text-xs flex items-center space-x-3 shadow-md animate-bounce">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
          <div className="flex-1 font-semibold">{emergencyAlert}</div>
          <a
            href="tel:112"
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs shrink-0 shadow-sm hover:bg-red-700 transition-colors"
          >
            Call 112
          </a>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="card-clean p-6 min-h-[460px] max-h-[560px] overflow-y-auto flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#F1F6FC] border border-blue-200 text-[#0756B8] flex items-center justify-center shrink-0 text-xs font-bold mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-lg p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#0756B8] text-white rounded-tr-xs shadow-xs'
                      : 'bg-[#F1F6FC] text-[#071426] border border-blue-100/80 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <div className="w-8 h-8 rounded-xl bg-[#F1F6FC] text-[#0756B8] flex items-center justify-center">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <span>Netra AI is researching ophthalmology guidance...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleChipClick('Find nearby doctor')}
              className="px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0756B8] text-xs font-bold border border-blue-200 transition-colors flex items-center space-x-1.5"
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#0756B8]" />
              <span>Find nearby doctor</span>
            </button>

            <button
              onClick={() => handleChipClick('Understand my report')}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors flex items-center space-x-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Understand my report</span>
            </button>

            <button
              onClick={() => handleChipClick('Eye care tips')}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>Eye care tips</span>
            </button>

            <button
              onClick={() => handleChipClick('Emergency signs')}
              className="px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors flex items-center space-x-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>Emergency signs</span>
            </button>
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:border-[#0756B8] focus:ring-1 focus:ring-[#0756B8] text-sm outline-none bg-white"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="p-3 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white transition-all disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
              aria-label="Send Message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
