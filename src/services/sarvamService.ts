import type { LanguageCode } from '../context/SettingsContext';
import type { SarvamAI } from 'sarvamai';
import { SarvamChatService } from './sarvamChatService';
import { SarvamDocumentService } from './sarvamDocumentService';
import { SarvamSpeechService } from './sarvamSpeechService';
import { clearSarvamApiKeyOverride, setSarvamApiKeyOverride } from './sarvamConfig';

export class SarvamService {
  public static setApiKey(key: string) {
    if (key.trim()) {
      setSarvamApiKeyOverride(key);
    } else {
      clearSarvamApiKeyOverride();
    }
  }

  public static async speechToText(audioBlob: Blob, languageCode: LanguageCode): Promise<string> {
    const response = await SarvamSpeechService.transcribe({
      file: audioBlob,
      language_code: this.mapLanguageCode(languageCode) as SarvamAI.SpeechToTextLanguage,
    });

    return response.transcript;
  }

  public static async textToSpeech(text: string, languageCode: LanguageCode): Promise<string> {
    const response = await SarvamSpeechService.textToSpeech({
      text,
      target_language_code: this.mapLanguageCode(languageCode) as SarvamAI.TextToSpeechLanguage,
      model: 'bulbul:v3',
      speaker: 'shubh',
      speech_sample_rate: 24000,
    });

    const audioBase64 = response.audios[0] || '';

    if (typeof window !== 'undefined' && audioBase64) {
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      await audio.play();
    }

    return audioBase64;
  }

  public static async chatSaaras(message: string, languageCode: LanguageCode): Promise<string> {
    return SarvamChatService.askWithContext({
      context: '',
      question: message,
      languageCode,
    });
  }

  public static parseMedicationFromVoice(text: string): Omit<any, 'id'> {
    const textLower = text.toLowerCase();

    let name = 'Paracetamol';
    let dosage = '1 Tablet';
    let timing: ('morning' | 'afternoon' | 'evening' | 'night')[] = ['morning'];
    let instructions = 'After meals';

    if (textLower.includes('aspirin') || textLower.includes('एस्पिरिन')) {
      name = 'Aspirin (75mg)';
      dosage = '1 Tablet';
      timing = ['morning'];
      instructions = 'After breakfast';
    } else if (textLower.includes('metformin') || textLower.includes('मेटफॉर्मिन')) {
      name = 'Metformin (500mg)';
      dosage = '1 Tablet';
      timing = ['morning', 'night'];
      instructions = 'With meals';
    } else if (textLower.includes('insulin') || textLower.includes('इंसुलिन')) {
      name = 'Insulin Glargine';
      dosage = '10 Units';
      timing = ['night'];
      instructions = 'Before sleeping';
    } else {
      const match = text.match(/(?:दवाई|दवा|medicine|tablet|capsule|सिरप)?\s*([a-zA-Z\u0900-\u097F]+)/);
      if (match && match[1]) {
        name = match[1];
      }
    }

    if (textLower.includes('दोपहर') || textLower.includes('noon') || textLower.includes('lunch')) {
      timing = ['afternoon'];
      instructions = 'After lunch';
    }
    if (textLower.includes('रात') || textLower.includes('night') || textLower.includes('dinner') || textLower.includes('शाम')) {
      if (textLower.includes('सुबह') || textLower.includes('morning')) {
        timing = ['morning', 'night'];
      } else {
        timing = ['night'];
      }
      instructions = 'After dinner';
    }

    return {
      name,
      dosage,
      frequency: timing.length === 1 ? 'Once Daily' : 'Twice Daily',
      timing,
      startDate: new Date().toISOString().split('T')[0],
      instructions,
    };
  }

  public static async extractTextFromBase64(base64Data: string): Promise<{ extractedText: string }> {
    const extractedText = await SarvamDocumentService.extractTextFromSource(base64Data);
    return { extractedText };
  }

  public static async chatWithDocument(extractedText: string, question: string, lang = 'en'): Promise<string> {
    return SarvamChatService.askWithContext({
      context: extractedText,
      question,
      languageCode: lang,
    });
  }

  private static mapLanguageCode(code: LanguageCode): string {
    const map: Record<LanguageCode, string> = {
      hi: 'hi-IN',
      ta: 'ta-IN',
      gu: 'gu-IN',
      mr: 'mr-IN',
      te: 'te-IN',
      bn: 'bn-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      en: 'en-IN',
    };

    return map[code] || 'hi-IN';
  }
}
