import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Mic, MicOff, Volume2, VolumeX, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useScreening } from '../context/ScreeningContext';
import { ChatMessage } from '../types';

export const ChatbotWidget: React.FC = () => {
  const { language, setLanguage } = useAuth();
  const { latestResult } = useScreening();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your Netra AI Eye-Health Assistant. How can I assist you with your vision screening, symptoms, or doctor appointments today?'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-netra-chat', handleOpenChat);
    return () => window.removeEventListener('open-netra-chat', handleOpenChat);
  }, []);

  // Speech Recognition (Speech-to-Text)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : 'en-US';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (queryToSend?: string) => {
    const q = queryToSend || inputQuery;
    if (!q.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(q, language, latestResult);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      if (res.is_emergency) {
        setEmergencyAlert(res.emergency_warning || 'Potential ocular emergency detected!');
      } else {
        setEmergencyAlert(null);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Apologies, I encountered an issue retrieving the clinical information. Please check your network and try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-2xl bg-[#0756B8] hover:bg-[#064696] text-white shadow-2xl shadow-[#0756B8]/40 hover:scale-105 transition-all flex items-center space-x-2.5 group border border-[#19C7E8]/40"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#19C7E8] border-2 border-[#071426] rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#19C7E8] border-2 border-[#071426] rounded-full" />
          </div>
          <span className="font-semibold text-xs tracking-wide hidden sm:inline-block">AI Eye Assistant</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] rounded-2xl border border-slate-700 bg-[#071426] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Top Bar */}
          <div className="p-4 bg-[#071426] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0756B8] flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4 text-[#19C7E8]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <span>Netra AI Assistant</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#0756B8]/30 text-[#19C7E8] border border-[#19C7E8]/30">
                    Clinical RAG
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">Context-aware ophthalmic guidance</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* Language Switch */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded-lg border border-slate-700 outline-none"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="bn">বাংলা</option>
              </select>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Emergency Alert Banner */}
          {emergencyAlert && (
            <div className="bg-red-950/90 border-b border-red-800 p-2.5 text-xs text-red-200 flex items-start space-x-2 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">🚨 Urgent Medical Triage Alert:</span>
                <span>Immediate emergency hospital attendance advised. Call 112 or 108.</span>
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                      isUser
                        ? 'bg-[#0756B8] text-white rounded-br-sm shadow-md'
                        : 'bg-slate-900/90 text-slate-200 rounded-bl-sm border border-slate-800 shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.content}</div>
                  </div>

                  {!isUser && (
                    <button
                      onClick={() => speakText(m.content)}
                      className="mt-1 text-[10px] text-slate-400 hover:text-[#19C7E8] flex items-center space-x-1"
                    >
                      {isSpeaking ? <VolumeX className="w-3 h-3 text-[#19C7E8]" /> : <Volume2 className="w-3 h-3" />}
                      <span>{isSpeaking ? 'Mute Speech' : 'Listen'}</span>
                    </button>
                  )}
                </div>
              );
            })}
            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
                <span className="w-2 h-2 rounded-full bg-[#19C7E8] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#19C7E8] animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-[#19C7E8] animate-bounce delay-200" />
                <span>Consulting eye health knowledge base...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Chips */}
          <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-[11px] no-scrollbar">
            {latestResult && (
              <button
                onClick={() => handleSend("Can you explain my recent eye screening report?")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-[#19C7E8]/15 text-[#19C7E8] border border-[#19C7E8]/40 hover:bg-[#19C7E8]/25 transition-colors"
              >
                Explain My Scan
              </button>
            )}
            <button
              onClick={() => handleSend("What are the warning signs of Diabetic Retinopathy?")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Diabetic Signs
            </button>
            <button
              onClick={() => handleSend("How can I book an appointment with an ophthalmologist?")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Book Specialist
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center space-x-2">
            <button
              onClick={toggleListen}
              className={`p-2 rounded-xl border transition-colors ${
                isListening
                  ? 'bg-red-950 border-red-600 text-red-400 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Voice Input (Speech to Text)"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? 'Listening...' : 'Ask about your eye health or report...'}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#19C7E8]"
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputQuery.trim() || loading}
              className="p-2 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
