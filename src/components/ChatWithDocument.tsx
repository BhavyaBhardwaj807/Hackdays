import React, { useState } from 'react';
import { useMedication } from '../context/MedicationContext';
import { SarvamService } from '../services/sarvamService';
import { useSettings } from '../context/SettingsContext';

export const ChatWithDocument: React.FC = () => {
  const { language } = useSettings();
  const { documents } = useMedication();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  React.useEffect(() => {
  if (!selectedId && documents.length > 0) {
    setSelectedId(documents[0].id);
  }
}, [documents]);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<
    {
      role: 'user' | 'assistant';
      content: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDoc = documents.find(d => d.id === selectedId) || null;
  const askQuestion = async (questionText: string) => {
  if (!selectedDoc) return;

  const text = selectedDoc.extractedText || '';

  if (!text.trim()) {
    setError('Document has not been processed yet');
    return;
  }

  setLoading(true);

  try {
    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: questionText,
      },
    ]);

    const res = await SarvamService.chatWithDocument(
      text,
      questionText,
      language
    );

    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: res,
      },
    ]);

    if (res && res.trim()) {
      await SarvamService.textToSpeech(res, 'en');
    }
  } catch (err: any) {
    setError(err?.message || String(err));
  } finally {
    setLoading(false);
  }
};
  const ask = async () => {
  if (!selectedDoc) {
    setError('No document selected');
    return;
  }

  const text = selectedDoc.extractedText || '';

  if (!text.trim()) {
    setError('Document has not been processed yet');
    return;
  }

  setLoading(false);
  setError(null);

  try {
  setMessages(prev => [
    ...prev,
    {
      role: 'user',
      content: question,
    },
  ]);

  const res = await SarvamService.chatWithDocument(
    text,
    question,
    'en'
  );

  setMessages(prev => [
    ...prev,
    {
      role: 'assistant',
      content: res,
    },
  ]);

  if (res && res.trim()) {
    await SarvamService.textToSpeech(res, 'en');
  }

  setQuestion('');
} catch (err: any) {
  setError(err?.message || String(err));
}
  }
const handleVoiceInput = async () => {
  try {
    if (!recording) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunks, {
            type: 'audio/webm',
          });
          
          const transcript =
            await SarvamService.speechToText(
              audioBlob,
              language
            );

          console.log('Transcript:', transcript);

          setQuestion(transcript);
          await askQuestion(transcript);
        } catch (err) {
          console.error('Speech To Text Error:', err);
        }
      };

      recorder.start();

      setMediaRecorder(recorder);
      setRecording(true);
    } else {
      mediaRecorder?.stop();
      setRecording(false);
    }
  } catch (err) {
    console.error(err);
  }
};
  
  return (
    <div className="space-y-4">
  {/* Header */}
  <div className="flex items-center gap-3">
    <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-xl">
      🤖
    </div>

    <div>
      <h3 className="font-bold text-white text-lg">
        Pulse Assistant
      </h3>
      <p className="text-green-400 text-sm">
        Online
      </p>
    </div>
  </div>

  {/* Document Selector */}
  <select
    value={selectedId || ''}
    onChange={(e) => setSelectedId(e.target.value)}
    className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700"
  >
    {documents.map((d) => (
      <option key={d.id} value={d.id}>
        📄 {d.name}
      </option>
    ))}
  </select>

  {/* Messages */}
  <div className="bg-slate-900 rounded-2xl p-4 h-[400px] overflow-y-auto space-y-3">
    {messages.length === 0 && (
      <div className="text-center text-slate-400 mt-10">
        Ask anything about this medical report
      </div>
    )}

    {messages.map((msg, index) => (
      <div
        key={index}
        className={`flex ${
          msg.role === 'user'
            ? 'justify-end'
            : 'justify-start'
        }`}
      >
        <div
          className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-lg whitespace-pre-wrap ${
            msg.role === 'user'
              ? 'bg-cyan-500 text-white rounded-br-md'
              : 'bg-slate-800 text-white rounded-bl-md'
          }`}
        >
          {msg.content}
        </div>
      </div>
    ))}

    {loading && (
      <div className="flex justify-start">
        <div className="bg-slate-800 text-white px-4 py-3 rounded-2xl rounded-bl-md">
          Thinking...
        </div>
      </div>
    )}
  </div>

  {/* Error */}
  {error && (
    <div className="text-rose-400 text-sm">
      {error}
    </div>
  )}

  {/* Input Area */}
  <div className="flex items-center gap-2">
    <button
      onClick={handleVoiceInput}
      className={`w-12 h-12 rounded-full text-white text-lg transition ${
        recording
          ? 'bg-red-500 animate-pulse'
          : 'bg-cyan-500'
      }`}
    >
      {recording ? '⏹' : '🎤'}
    </button>

    <input
      value={question}
      onChange={(e) => setQuestion(e.target.value)}
      placeholder="Ask about this report..."
      className="flex-1 bg-slate-800 text-white rounded-full px-5 py-3 border border-slate-700 focus:outline-none"
    />

    <button
      onClick={ask}
      disabled={loading || !question}
      className="w-12 h-12 rounded-full bg-cyan-500 text-white text-lg hover:scale-105 transition disabled:opacity-50"
    >
      ➤
    </button>
  </div>
</div>
  );
};

export default ChatWithDocument;
