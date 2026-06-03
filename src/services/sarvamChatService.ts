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
    const client = createSarvamClient();
    const response = await client.chat.completions({
      model: 'sarvam-30b',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: options.languageCode
            ? `You are a medical document assistant. Answer in ${options.languageCode}. Answer only from the provided context when possible. Keep responses concise, clear, and clinically cautious.`
            : 'You are a medical document assistant. Answer only from the provided context when possible. Keep responses concise, clear, and clinically cautious.',
        },
        {
          role: 'user',
          content: `Context:\n${options.context}\n\nQuestion:\n${options.question}`,
        },
      ],
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
