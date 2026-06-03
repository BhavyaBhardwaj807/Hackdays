import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, Pill, FileText, MessageSquare, Mic, Settings, X, Volume2, ShieldAlert } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import type { LanguageCode } from '../context/SettingsContext';
import { useMedication } from '../context/MedicationContext';
import { useFirebase } from '../context/FirebaseContext';
import { SarvamService } from '../services/sarvamService';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const { language, setLanguage, sarvamKey, setSarvamKey, firebaseConfig, setFirebaseConfig, t, isDemo, setIsDemo } = useSettings();
  const { isFirebaseActive: _unused } = useFirebase();
  const { addMedication } = useMedication();

  // Dialog & Slide-over States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMicOpen, setIsMicOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [tempSarvam, setTempSarvam] = useState(sarvamKey);
  const [tempFirebase, setTempFirebase] = useState(firebaseConfig);

  // Web Speech recognition variables
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize Web Speech API if supported
    const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (Speech) {
      const rec = new Speech();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
        setSpeechText('');
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpeechText(transcript);
        handleSpeechCompletion(transcript);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [language]);

  const toggleMic = () => {
    if (isMicOpen) {
      if (recognition) recognition.stop();
      setIsMicOpen(false);
    } else {
      setIsMicOpen(true);
      setSpeechText(t.micListening);
      setTimeout(() => {
        startSpeechListening();
      }, 500);
    }
  };

  const startSpeechListening = () => {
    if (recognition) {
      // Map preferred Indian language locale
      const langMap: Record<LanguageCode, string> = {
        hi: 'hi-IN', ta: 'ta-IN', gu: 'gu-IN', mr: 'mr-IN',
        te: 'te-IN', bn: 'bn-IN', kn: 'kn-IN', ml: 'ml-IN', en: 'en-IN'
      };
      recognition.lang = langMap[language] || 'hi-IN';
      try {
        recognition.start();
      } catch (err) {
        console.warn("Recognition already active", err);
      }
    } else {
      // Direct text simulator for testing on unsupported browsers
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const sim = language === 'hi' ? "सुबह खाने के बाद एक गोली एस्पिरिन देना" : "Take one tablet of Aspirin in the morning after breakfast";
        setSpeechText(sim);
        handleSpeechCompletion(sim);
      }, 2000);
    }
  };

  const handleSpeechCompletion = async (text: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 1. If currently on Caregiver Tab, route this voice directly to caregiver chat query!
    if (activeTab === 'caregiver') {
      window.dispatchEvent(new CustomEvent('pulse_voice_chat', { detail: text }));
      setIsMicOpen(false);
      return;
    }

    // 2. Otherwise parse text to add new medication
    const parsedMed = SarvamService.parseMedicationFromVoice(text);
    await addMedication(parsedMed);

    // Trigger visual/vocal success notification!
    const successSpeech: Record<LanguageCode, string> = {
      hi: `${parsedMed.name} दवाई सुरक्षित कर ली गई है।`,
      ta: `${parsedMed.name} மருந்து வெற்றிகரமாக சேர்க்கப்பட்டது.`,
      gu: `${parsedMed.name} દવા ઉમેરી દેવામાં આવી છે.`,
      mr: `${parsedMed.name} औषध जतन केले आहे.`,
      te: `${parsedMed.name} మందును జోడించడం జరిగింది.`,
      bn: `${parsedMed.name} ওষুধ সংরক্ষণ করা হয়েছে।`,
      kn: `${parsedMed.name} ಔಷಧಿ ಸೇರಿಸಲಾಗಿದೆ.`,
      ml: `${parsedMed.name} മരുന്ന് വിജയകരമായി ചേർത്തു.`,
      en: `${parsedMed.name} medication added successfully.`
    };
    
    // Play alert
    await SarvamService.textToSpeech(successSpeech[language] || successSpeech['hi'], language);

    // Redirect user to Medicines tab to see the newly added card!
    setActiveTab('medicines');
    setIsMicOpen(false);
  };

  const handleSaveSettings = () => {
    setSarvamKey(tempSarvam);
    setFirebaseConfig(tempFirebase);
    setIsSettingsOpen(false);
    
    // Trigger window refresh to re-evaluate configurations
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  

  return (
    <div className="min-h-screen bg-navy-950 text-navy-50 flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl border-x border-navy-800">
      
      {/* 1. Header (Topbar) */}
      <header className="bg-navy-900 px-6 py-4 flex items-center justify-between border-b border-navy-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold text-white text-lg">⚡</div>
          <h1 className="text-xl font-bold font-sans tracking-wide text-white">{t.appName}</h1>
        </div>

        <div className="flex items-center space-x-3">
          {/* Native Language Toggle Box */}
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="bg-navy-800 text-navy-50 font-medium text-sm px-2 py-1.5 rounded-xl border border-navy-700 outline-none cursor-pointer"
          >
            <option value="hi">हिंदी</option>
            <option value="ta">தமிழ்</option>
            <option value="gu">ગુજરાતી</option>
            <option value="mr">मराठी</option>
            <option value="te">తెలుగు</option>
            <option value="bn">বাংলা</option>
            <option value="kn">ಕನ್ನಡ</option>
            <option value="ml">മലയാളം</option>
            <option value="en">EN</option>
          </select>

          {/* Settings gear tactile-btn */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-navy-100 hover:text-white bg-navy-800 rounded-xl border border-navy-700 tactile-btn"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* 2. Core Dashboard Content Area */}
      <main className="flex-1 overflow-y-auto px-5 py-6 pb-28">
        {children}
      </main>

      {/* 3. Voice Microphone Circle Action */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30">
        <button 
          onClick={toggleMic}
          className="w-16 h-16 rounded-full bg-accent hover:bg-accent-dark flex items-center justify-center shadow-2xl border-4 border-navy-950 text-white tactile-btn mic-active-pulse"
        >
          <Mic size={28} />
        </button>
      </div>

      {/* 4. Bottom Tab Bar Navigation */}
      <nav className="bg-navy-900 border-t border-navy-800 px-4 py-2 sticky bottom-0 z-40 flex items-center justify-between pb-safe-bottom">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center flex-1 py-1 ${activeTab === 'home' ? 'text-accent font-semibold' : 'text-navy-700 hover:text-navy-100'} transition-all`}
        >
          <HomeIcon size={22} />
          <span className="text-[10px] mt-1 tracking-tight leading-tight">{t.homeTab}</span>
        </button>

        <button 
          onClick={() => setActiveTab('medicines')}
          className={`flex flex-col items-center flex-1 py-1 mr-4 ${activeTab === 'medicines' ? 'text-accent font-semibold' : 'text-navy-700 hover:text-navy-100'} transition-all`}
        >
          <Pill size={22} />
          <span className="text-[10px] mt-1 tracking-tight leading-tight">{t.medicinesTab}</span>
        </button>

        {/* Spacer for mic overlay */}
        <div className="w-12"></div>

        <button 
          onClick={() => setActiveTab('documents')}
          className={`flex flex-col items-center flex-1 py-1 ml-4 ${activeTab === 'documents' ? 'text-accent font-semibold' : 'text-navy-700 hover:text-navy-100'} transition-all`}
        >
          <FileText size={22} />
          <span className="text-[10px] mt-1 tracking-tight leading-tight">{t.documentsTab}</span>
        </button>

        <button 
          onClick={() => setActiveTab('caregiver')}
          className={`flex flex-col items-center flex-1 py-1 ${activeTab === 'caregiver' ? 'text-accent font-semibold' : 'text-navy-700 hover:text-navy-100'} transition-all`}
        >
          <MessageSquare size={22} />
          <span className="text-[10px] mt-1 tracking-tight leading-tight">{t.caregiverTab}</span>
        </button>
      </nav>

      {/* 5. Voice Microphone Modal Overlay */}
      {isMicOpen && (
        <div className="absolute inset-0 bg-navy-950/95 z-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          <button 
            onClick={() => setIsMicOpen(false)}
            className="absolute top-6 right-6 p-2 text-navy-100 bg-navy-800 rounded-full border border-navy-700 tactile-btn"
          >
            <X size={20} />
          </button>

          <div className="mb-8">
            <h2 className="text-elder-xl font-bold mb-2 text-white">{t.appName} Voice Input</h2>
            <p className="text-navy-700 text-lg">{activeTab === 'caregiver' ? "Talk to Caregiver Bot" : t.micPrompt}</p>
          </div>

          <div className="relative w-36 h-36 flex items-center justify-center mb-12">
            <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping"></div>
            <div className="absolute inset-4 rounded-full bg-accent/40 animate-pulse"></div>
            <button 
              onClick={startSpeechListening}
              className="w-24 h-24 rounded-full bg-accent hover:bg-accent-dark flex items-center justify-center border-4 border-navy-900 text-white z-10 shadow-2xl tactile-btn"
            >
              {isListening ? <Volume2 size={36} className="animate-bounce" /> : <Mic size={36} />}
            </button>
          </div>

          <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 w-full max-w-sm shadow-xl min-h-24 flex items-center justify-center">
            <p className="text-white text-lg font-medium leading-relaxed font-sans">{speechText}</p>
          </div>
        </div>
      )}

      {/* 6. Settings slide drawer (Slide-over overlay) */}
      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex justify-end animate-fade-in">
          <div className="w-4/5 h-full bg-navy-950 border-l border-navy-800 flex flex-col shadow-2xl animate-slide-left p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold font-sans text-white">{t.apiKeySettings}</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-navy-100 bg-navy-800 rounded-xl border border-navy-700 tactile-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simulated Demo Banner */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 mb-6 flex flex-col">
              <div className="flex items-center space-x-2 text-accent font-semibold mb-1">
                <ShieldAlert size={18} />
                <span>{t.demoMode}</span>
              </div>
              <p className="text-[12px] text-navy-700 leading-normal">
                PULSE uses browser Speech APIs and local clinical response fallbacks to ensure 100% immediate demo compatibility.
              </p>
              <button 
                onClick={() => setIsDemo(!isDemo)}
                className={`mt-3 py-1.5 px-3 rounded-xl font-semibold text-xs border ${isDemo ? 'bg-accent border-accent text-white' : 'border-navy-700 text-navy-100'} tactile-btn`}
              >
                {language === 'hi'
                  ? (isDemo ? 'रियल API मोड में जाएँ' : 'ऑफलाइन डेमो मोड में जाएँ')
                  : (isDemo ? 'Switch to Real API Mode' : 'Switch to Offline Demo Mode')}
              </button>
            </div>

            {/* Developer fields */}
            <div className="space-y-5 mb-8 flex-1">
              <div>
                <label className="block text-sm font-semibold text-navy-100 mb-2">Sarvam AI API Key</label>
                <input 
                  type="password"
                  value={tempSarvam}
                  onChange={(e) => setTempSarvam(e.target.value)}
                  placeholder="Enter sarvam.ai API Key"
                  className="w-full bg-navy-900 border border-navy-800 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-100 mb-2">Firebase Project Config</label>
                <textarea 
                  value={tempFirebase}
                  onChange={(e) => setTempFirebase(e.target.value)}
                  placeholder='{ "apiKey": "...", "projectId": "..." }'
                  rows={4}
                  className="w-full bg-navy-900 border border-navy-800 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-accent font-mono"
                />
              </div>

              {/* JSON backup removed for demo cleanliness */}
            </div>

            <button 
              onClick={handleSaveSettings}
              className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 rounded-2xl shadow-xl border border-accent tactile-btn mt-auto"
            >
              {t.saveKeys}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
