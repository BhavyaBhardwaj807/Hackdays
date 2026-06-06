import type { SarvamAI } from 'sarvamai';
import { createSarvamClient } from './sarvamClient';


export class SarvamChatService {
  static async completions(request: SarvamAI.ChatCompletionsRequest) {
    const client = createSarvamClient();
    return client.chat.completions(request);
  }

  static async askWithContext(options: {
    context: string;
    question: string;
    languageCode?: string;
  }): Promise<string> {
    console.log("DOC LANGUAGE:", options.languageCode);
    console.log("QUESTION:", options.question);
    const client = createSarvamClient();
    const response = await client.chat.completions({
      model: 'sarvam-30b',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: options.languageCode
            ? `You are a medical document assistant. Answer in ${options.languageCode}. Answer only from the provided context when possible. Keep responses concise, clear, and clinically cautious.`
            : 'You are a medical document assistant. Answer only from the provided context when possible. Use the same language as the user\'s question.'
        },
        {
          role: 'user',
          content: `Context:\n${options.context}\n\nQuestion:\n${options.question}`,
        },
      ],
    });

    return response.choices[0]?.message?.content ?? '';
  }

  
public static async extractMedicationFromText(text: string) {
  console.log("USING SarvamchatService.extractMedicationFromText");
  const response = await SarvamChatService.completions({
    model: 'sarvam-30b',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: 'You are a medication extraction assistant. Return ONLY valid JSON.'
      },
      {
        role: 'user',
        content: `Return JSON only for medication: ${text}`
      }
    ]
});
  console.log("FULL RESPONSE:");
  console.log(response);
  console.log(JSON.stringify(response, null, 2));

  const content =
    (response as any)?.choices?.[0]?.message?.content || '{}';
  console.log("SARVAM RESPONSE:", content);
  

  return JSON.parse(content);
}
}