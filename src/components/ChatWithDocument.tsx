import React, { useState } from 'react';
import { useMedication } from '../context/MedicationContext';
import { SarvamService } from '../services/sarvamService';

export const ChatWithDocument: React.FC = () => {
  const { documents } = useMedication();
  const [selectedId, setSelectedId] = useState<string | null>(documents[0]?.id || null);
  
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDoc = documents.find(d => d.id === selectedId) || null;

  const ask = async () => {
    if (!selectedDoc) return setError('No document selected');
    setLoading(true);
    setError(null);
    try {
      const text = `
                    Patient: Rajesh Sharma

                    Conditions:
                        - Type 2 Diabetes
                        - Hypertension

                        Medications:
                        - Metformin 500mg twice daily
                        - Aspirin 75mg once daily
                        - Atorvastatin 20mg at bedtime
                        `;
      const res = await SarvamService.chatWithDocument(text, question, 'en');
      setAnswer(res);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-white">Chat with Document</h3>
      <div className="flex gap-2">
        <select value={selectedId || ''} onChange={(e) => setSelectedId(e.target.value)} className="flex-1">
          {documents.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <input className="flex-2" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question about the document" />
        <button onClick={ask} disabled={loading || !question} className="btn">Ask</button>
      </div>

      {loading && <div>Thinking...</div>}
      {error && <div className="text-rose-400">{error}</div>}

      {answer && (
        <div className="mt-4 p-3 bg-navy-950 rounded"> 
          <h4 className="font-semibold text-white">Answer</h4>
          <p className="mt-2 text-sm text-navy-100 whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </div>
  );
};

export default ChatWithDocument;
