// Notification Service - Web Push and Multilingual TTS Audio Alarms
import type { LanguageCode } from '../context/SettingsContext';
import { SarvamService } from './sarvamService';

export class NotificationService {
  private static registeredReminders: Record<string, any> = {};

  // Request browser notification permissions
  public static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Schedule a dose alarm that triggers a popup notification AND plays a beautiful TTS alarm voice!
  public static scheduleDoseReminder(
    medId: string,
    medName: string,
    dosage: string,
    timeSlot: string,
    scheduledTimeStr: string, // "HH:MM" format
    lang: LanguageCode
  ) {
    const key = `${medId}_${timeSlot}`;
    
    // Clear existing timer if rescheduled
    if (this.registeredReminders[key]) {
      clearTimeout(this.registeredReminders[key]);
    }

    // Calculate time offset
    const now = new Date();
    const [hours, minutes] = scheduledTimeStr.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    // If target time is past today, schedule for tomorrow
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();

    // Schedule the timeout
    const timeout = setTimeout(() => {
      this.triggerDoseAlert(medName, dosage, timeSlot, lang);
      // Re-schedule for next day
      this.scheduleDoseReminder(medId, medName, dosage, timeSlot, scheduledTimeStr, lang);
    }, delay);

    this.registeredReminders[key] = timeout;
    console.log(`Scheduled reminder for ${medName} (${timeSlot}) in ${Math.round(delay/1000/60)} minutes.`);
  }

  // Play spoken vocal alarm AND show browser notification
  public static async triggerDoseAlert(
    medName: string,
    dosage: string,
    timeSlot: string,
    lang: LanguageCode
  ) {
    // 1. Compile spoken audio sentence in selected Indian language!
    const reminders: Record<LanguageCode, string> = {
      hi: `नमस्ते! आपकी ${timeSlot} की खुराक ${medName} लेने का समय हो गया है। कृपया अपनी ${dosage} दवाई अभी ले लें। धन्यवाद।`,
      ta: `வணக்கம்! உங்கள் ${timeSlot} மருந்து ${medName} சாப்பிட வேண்டிய நேரம் இது. தயவுசெய்து உங்கள் ${dosage} மருந்தை உடனே உட்கொள்ளுங்கள். நன்றி.`,
      gu: `નમસ્તે! તમારી ${timeSlot} ની દવા ${medName} લેવાનો સમય થઈ ગયો છે. કૃપા કરીને તમારી ${dosage} દવા લઈ લો. આભાર.`,
      mr: `नमस्कार! आपली ${timeSlot} ची औषध ${medName} घेण्याची वेळ झाली आहे. कृपया आपली ${dosage} औषध आता घ्या. धन्यवाद.`,
      te: `నమస్కారం! మీ ${timeSlot} మోతాదు ${medName} వేసుకునే సమయం అయింది. దయచేసి మీ ${dosage} మందును వేసుకోండి. ధన్యవాదాలు.`,
      bn: `নমস্কার! আপনার ${timeSlot} এর ওষুধ ${medName} নেওয়ার সময় হয়েছে। দয়া করে আপনার ${dosage} ওষুধ নিয়ে নিন। ধন্যবাদ।`,
      kn: `ನಮಸ್ಕಾರ! ನಿಮ್ಮ ${timeSlot} ಔಷಧಿ ${medName} ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯವಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ${dosage} ಔಷಧಿಯನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ. ಧನ್ಯವಾದಗಳು.`,
      ml: `നമസ്കാരം! നിങ്ങളുടെ ${timeSlot} മരുന്ന് ${medName} കഴിക്കാനുള്ള സമയമായി. ദയവായി നിങ്ങളുടെ ${dosage} മരുന്ന് കഴിക്കുക. നന്ദി.`,
      en: `Namaste! It is time to take your ${timeSlot} dose of ${medName}. Please take your ${dosage} medication now. Thank you.`
    };

    const text = reminders[lang] || reminders['hi'];

    // 2. Display System Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification("PULSE Medication Reminder", {
        body: `${medName} (${dosage}) - Scheduled for ${timeSlot}`,
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230B132B"/><text y=".9em" font-size="90">⚡</text></svg>',
        tag: 'pulse-dose-alert'
      });
    }

    // 3. Spoken alarm playback via Sarvam TTS / browser voice synthesizer
    try {
      await SarvamService.textToSpeech(text, lang);
    } catch (err) {
      console.warn("Speech Synthesis play fail:", err);
    }
  }

  // Clear all pending reminders
  public static clearAllReminders() {
    Object.values(this.registeredReminders).forEach(clearTimeout);
    this.registeredReminders = {};
  }
}
