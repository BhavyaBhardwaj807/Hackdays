import React, { useState, useEffect } from 'react';
import { useMedication } from '../context/MedicationContext';
import type { Medication } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';
import { Check, Flame, Clock, Calendar, CheckCircle } from 'lucide-react';

export const Home: React.FC = () => {
  const { medications, logs, toggleDose, streak } = useMedication();
  const { language, t } = useSettings();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // States for next dose countdown
  const [nextDoseText, setNextDoseText] = useState('');
  const [countdown, setCountdown] = useState('');

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update countdown to next dose
  useEffect(() => {
    if (medications.length === 0) {
      setNextDoseText('No medicines scheduled');
      setCountdown('--:--:--');
      return;
    }

    const computeNextDose = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const slotHours: Record<string, number> = { morning: 8, afternoon: 13, evening: 18, night: 21 };
      
      let nearestDiff = Infinity;
      let nearestMed: Medication | null = null;
      let nearestSlot = '';

      medications.forEach(med => {
        const timings = Array.isArray(med.timing)
          ? med.timing
          : [];

        timings.forEach(slot => {
          const targetHour = slotHours[slot];
          const target = new Date();
          target.setHours(targetHour, 0, 0, 0);

          // If the dose was already taken today, we skip it for nearest calculation
          const logKey = `${med.id}_${slot}`;
          const isTakenToday = !!logs[todayStr]?.[logKey]?.taken;

          let diff = target.getTime() - now.getTime();
          
          if (diff <= 0 || isTakenToday) {
            // Target is in the past, look at tomorrow
            target.setDate(target.getDate() + 1);
            diff = target.getTime() - now.getTime();
          }

          if (diff < nearestDiff) {
            nearestDiff = diff;
            nearestMed = med;
            nearestSlot = slot;
          }
        });
      });

      if (nearestMed) {
        const medName = (nearestMed as Medication).name;
        // Translate slot for native text
        const slotText: Record<string, string> = {
          morning: language === 'hi' ? 'सुबह' : language === 'ta' ? 'காலை' : 'Morning',
          afternoon: language === 'hi' ? 'दोपहर' : language === 'ta' ? 'மதியம்' : 'Afternoon',
          evening: language === 'hi' ? 'शाम' : language === 'ta' ? 'மாலை' : 'Evening',
          night: language === 'hi' ? 'रात' : language === 'ta' ? 'இரவு' : 'Night'
        };
        
        setNextDoseText(`${medName} (${slotText[nearestSlot] || nearestSlot})`);

        // Format countdown
        const totalSecs = Math.floor(nearestDiff / 1000);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        
        setCountdown(`${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }
    };

    computeNextDose();
    const interval = setInterval(computeNextDose, 1000);
    return () => clearInterval(interval);
  }, [medications, logs, language]);

  // Daily Progress calculations
  const todayStr = currentTime.toISOString().split('T')[0];
  const todayLog = logs[todayStr] || {};

  let totalDosesToday = 0;
  let takenDosesToday = 0;

  medications.forEach(m => {
    const timings = Array.isArray(m.timing)
      ? m.timing
      : [];

    timings.forEach(slot => {
      totalDosesToday++;

      if (todayLog[`${m.id}_${slot}`]?.taken) {
        takenDosesToday++;
      }
    });
  });

  const progressPercent = totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 100;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Render dose list grouped by slot
  const slots: ('morning' | 'afternoon' | 'evening' | 'night')[] = ['morning', 'afternoon', 'evening', 'night'];
  const slotLabels: Record<string, string> = {
    morning: language === 'hi' ? 'सुबह की खुराक (08:00 AM)' : language === 'ta' ? 'காலை வேளை (08:00 AM)' : 'Morning Doses (08:00 AM)',
    afternoon: language === 'hi' ? 'दोपहर की खुराक (01:00 PM)' : language === 'ta' ? 'மதிய வேளை (01:00 PM)' : 'Afternoon Doses (01:00 PM)',
    evening: language === 'hi' ? 'शाम की खुराक (06:00 PM)' : language === 'ta' ? 'மாலை வேளை (06:00 PM)' : 'Evening Doses (06:00 PM)',
    night: language === 'hi' ? 'रात की खुराक (09:00 PM)' : language === 'ta' ? 'இரவு வேளை (09:00 PM)' : 'Night Doses (09:00 PM)'
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Date banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="text-accent" size={24} />
          <span className="text-elder-base font-bold font-sans text-white">
            {currentTime.toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'short'
            })}
          </span>
        </div>

        {/* Streak counter badge */}
        <div className="flex items-center space-x-1.5 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full text-accent">
          <Flame size={20} fill="#F97316" stroke="none" />
          <span className="font-bold text-lg font-sans">{streak} {t.streakText}</span>
        </div>
      </div>

      {/* 2. Visual Radial Chart & Countdown in a combined premium card */}
      <div className="card-navy flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-success/5 rounded-full blur-2xl"></div>

        <div className="grid grid-cols-2 gap-6 w-full items-center">
          
          {/* Radial progress circle */}
          <div className="relative flex flex-col items-center justify-center">
            <svg width="160" height="160" className="transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-navy-800"
                strokeWidth="14"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-accent transition-all duration-500"
                strokeWidth="14"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white font-sans">{progressPercent}%</span>
              <span className="text-[11px] text-navy-700 font-semibold uppercase tracking-wider">{t.todayProgress}</span>
              <span className="text-xs text-navy-100 font-bold mt-0.5">{takenDosesToday}/{totalDosesToday}</span>
            </div>
          </div>

          {/* Clock countdown widget */}
          <div className="flex flex-col items-start justify-center text-left space-y-2 border-l border-navy-800 pl-6 h-full">
            <div className="flex items-center space-x-1.5 text-navy-700 font-bold text-xs uppercase tracking-wider">
              <Clock size={14} />
              <span>{t.nextDose}</span>
            </div>
            
            <h3 className="text-elder-base font-extrabold text-white line-clamp-2 font-sans pr-1">
              {nextDoseText}
            </h3>
            
            <span className="text-3xl font-mono font-bold tracking-tight text-accent mt-1 animate-pulse">
              {countdown}
            </span>
          </div>

        </div>
      </div>

      {/* 3. Daily dose checkboxes list */}
      <div className="space-y-5">
        {slots.map(slot => {
          const slotMeds = medications.filter(
            m => (m.timing || []).includes(slot)
          );
          if (slotMeds.length === 0) return null;

          return (
            <div key={slot} className="space-y-2.5">
              <h3 className="text-sm font-bold text-navy-700 uppercase tracking-widest pl-1">
                {slotLabels[slot]}
              </h3>

              <div className="space-y-3">
                {slotMeds.map(med => {
                  const key = `${med.id}_${slot}`;
                  const isTaken = !!todayLog[key]?.taken;
                  const takenTime = todayLog[key]?.takenAt;

                  return (
                    <div 
                      key={key} 
                      onClick={() => toggleDose(todayStr, med.id, slot)}
                      className={`card-navy py-4 px-5 flex items-center justify-between border cursor-pointer select-none transition-all duration-300 ${
                        isTaken 
                          ? 'border-success/30 bg-success/5 shadow-success/5' 
                          : 'border-navy-800 bg-navy-900 shadow-md hover:border-navy-700'
                      }`}
                    >
                      <div className="flex items-center space-x-4 flex-1 pr-4">
                        {/* High-Contrast visual check circle */}
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          isTaken 
                            ? 'bg-success border-success text-navy-950 scale-105' 
                            : 'border-navy-700 text-transparent'
                        }`}>
                          <Check size={18} strokeWidth={3} />
                        </div>

                        <div className="flex flex-col text-left">
                          <span className={`text-elder-base font-extrabold transition-all leading-tight ${
                            isTaken ? 'text-navy-700 line-through' : 'text-white'
                          }`}>
                            {med.name}
                          </span>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-navy-700 font-bold">{med.dosage}</span>
                            {med.instructions && (
                              <>
                                <span className="text-[10px] text-navy-800">•</span>
                                <span className="text-xs text-accent font-semibold">{med.instructions}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Taken Time badge */}
                      {isTaken && takenTime && (
                        <div className="flex items-center space-x-1 bg-success/15 px-3 py-1.5 rounded-2xl text-success font-semibold text-xs border border-success/10 font-sans">
                          <CheckCircle size={12} />
                          <span>{takenTime}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
