import React, { useState, useEffect, useRef } from 'react';
import { useMedication } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';
import { SarvamService } from '../services/sarvamService';
import { Send, User, Bot, Volume2, Flame, Heart } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export const Caregiver: React.FC = () => {
  const { medications, streak, adherenceRate } = useMedication();
  const { language, t } = useSettings();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Setup Initial Welcome message based on selected language
  useEffect(() => {
    setMessages([
      { sender: 'bot', text: t.botWelcome }
    ]);
  }, [language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hook layout's global voice listening recognition to chat input!
  useEffect(() => {
    const handleVoiceChat = async (e: Event) => {
      const text = (e as CustomEvent).detail;
      if (text) {
        handleSendMessage(text);
      }
    };
    
    window.addEventListener('pulse_voice_chat', handleVoiceChat);
    return () => window.removeEventListener('pulse_voice_chat', handleVoiceChat);
  }, [language]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // 1. Add user message
    const userMsg: ChatMessage = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // 2. Fetch response from Sarvam LLM (or robust clinical local fallback)
      const reply = await SarvamService.chatSaaras(textToSend, language);
      
      // 3. Add bot message
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
      
      // 4. Synthesize voice aloud automatically! (TTS alert)
      await SarvamService.textToSpeech(reply, language);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  // Speaks any message in history when clicking the speaker button
  const handleSpeakAloud = async (text: string) => {
    await SarvamService.textToSpeech(text, language);
  };

  // Quick suggestion chips based on selected language
  const quickQuestions: Record<string, string[]> = {
    hi: [
      "मेटफॉर्मिन खाली पेट ले सकते हैं?",
      "एस्पिरिन किस समय लेनी चाहिए?",
      "दवाई छूटने पर क्या करें?",
      "दवाइयों के साइड इफेक्ट्स क्या हैं?"
    ],
    ta: [
      "மெட்ஃபார்மின் வெறும் வயிற்றில் சாப்பிடலாమా?",
      "ஆஸ்பிரின் எப்போது உட்கொள்ள வேண்டும்?",
      "மருந்து தவறினால் என்ன செய்வது?",
      "பக்க விளைவுகள் என்னென்ன?"
    ],
    gu: [
      "મેટફોર્મિન ખાલી પેટે લઈ શકાય?",
      "એસ્પિરિન કયા સમયે લેવી જોઈએ?",
      "દવા લેવાનું ભૂલી જવાય તો શું કરવું?",
      "દવાના સાઈડ ઈફેક્ટ્સ શું છે?"
    ],
    mr: [
      "मेटफॉर्मिन रिकाम्या पोटी घेऊ शकतो का?",
      "एस्पिरिन कोणत्या वेळी घ्यावी?",
      "औषध विसरल्यास काय करावे?",
      "औषधांचे दुष्परिणाम काय आहेत?"
    ],
    en: [
      "Can I take Metformin on empty stomach?",
      "When is the best time to take Aspirin?",
      "What should I do if I miss a dose?",
      "What are common medicine side effects?"
    ]
  };

  const chips = quickQuestions[language] || quickQuestions['en'];

  return (
    <div className="flex flex-col h-full space-y-5">
      
      {/* 1. Caregiver Patient Summary Card (Top bar) */}
      <div className="card-navy border border-navy-800 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full blur-2xl"></div>
        
        <div className="flex items-center space-x-2 mb-3">
          <Heart className="text-rose-500 fill-rose-500" size={18} />
          <h3 className="text-xs font-bold text-navy-700 uppercase tracking-widest">Relative's Health Summary</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-2xl font-extrabold text-white font-sans">{adherenceRate}%</span>
            <p className="text-[10px] text-navy-700 font-bold uppercase mt-0.5">{t.adherenceRate}</p>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-orange-500 font-sans flex items-center space-x-1">
              <Flame size={18} fill="#F97316" stroke="none" />
              <span>{streak} Days</span>
            </span>
            <p className="text-[10px] text-navy-700 font-bold uppercase mt-0.5">{t.streakText}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-navy-850 flex items-center justify-between text-xs text-navy-100 font-semibold">
          <span>Active Medications Scheduled:</span>
          <span className="text-accent font-bold text-sm">{medications.length} Medicines</span>
        </div>
      </div>

      {/* 2. Interactive QA chatbot window */}
      <div className="flex-1 bg-navy-900 border border-navy-800 rounded-3xl p-4 shadow-xl flex flex-col min-h-60 overflow-hidden relative">
        
        {/* Messages Stream area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 no-scrollbar text-sm">
          {messages.map((msg, idx) => {
            const isBot = msg.sender === 'bot';
            return (
              <div 
                key={idx}
                className={`flex items-start space-x-3 max-w-[85%] ${
                  isBot ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right space-x-reverse'
                }`}
              >
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${
                  isBot ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-navy-800 border-navy-700 text-white'
                }`}>
                  {isBot ? <Bot size={16} /> : <User size={16} />}
                </div>

                <div className="space-y-1">
                  <div className={`rounded-2xl p-3.5 shadow-md leading-relaxed font-sans ${
                    isBot 
                      ? 'bg-navy-950 text-white border border-navy-850' 
                      : 'bg-accent text-white border border-accent-dark'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Speak Aloud trigger button for elderly */}
                  {isBot && (
                    <button 
                      onClick={() => handleSpeakAloud(msg.text)}
                      className="flex items-center space-x-1 text-navy-700 hover:text-navy-100 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-navy-850 bg-navy-950/40 tactile-btn"
                    >
                      <Volume2 size={12} />
                      <span>Speak Aloud</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-start space-x-3 mr-auto text-left">
              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot size={16} />
              </div>
              <div className="bg-navy-950 text-navy-700 rounded-2xl p-3.5 border border-navy-850 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-navy-700 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-navy-700 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-navy-700 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto no-scrollbar py-1">
            {chips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="bg-navy-950 border border-navy-850 hover:border-accent/40 rounded-xl px-3 py-1.5 text-xs text-navy-100 font-semibold transition-all tactile-btn text-left line-clamp-1"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
          className="flex items-center space-x-2 border-t border-navy-800 pt-3"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chatPlaceholder}
            className="flex-1 bg-navy-950 border border-navy-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-accent font-sans"
          />
          <button 
            type="submit"
            className="p-3 bg-accent hover:bg-accent-dark text-white rounded-2xl shadow-lg border border-accent-dark tactile-btn"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

    </div>
  );
};
