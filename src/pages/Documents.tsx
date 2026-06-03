import ChatWithDocument from '../components/ChatWithDocument';
import React, { useState } from 'react';
import { useMedication } from '../context/MedicationContext';
import type { MedDocument } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';
import { FileText, Calendar, Plus, User, Building, Eye, Trash2, X } from 'lucide-react';

export const Documents: React.FC = () => {
  
  const { documents, addDocument, deleteDocument } = useMedication();
  const { t } = useSettings();

  const [isUploading, setIsUploading] = useState(false);
  const [docName, setDocName] = useState('');
  const [doctor, setDoctor] = useState('');
  const [hospital, setHospital] = useState('');
  const [type, setType] = useState<'prescription' | 'report' | 'summary'>('prescription');

  // Preview dialog modal state
  const [previewDoc, setPreviewDoc] = useState<MedDocument | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("FILE SELECTED:", file);
    if (!file) return;

    setIsUploading(true);
    
    // Convert to Base64 for local inline viewing without cloud dependencies!
    const reader = new FileReader();
    reader.onload = async (event) => {
      console.log("READER LOADED");

      const base64 = event.target?.result as string;
      console.log("BASE64 LENGTH:", base64?.length);

      try {
        console.log("ABOUT TO CALL addDocument");

        // Add structured prescription document
        await addDocument({
          name: docName || file.name.split('.')[0] || "Medical Document",
          type,
          date: new Date().toISOString().split('T')[0],
          doctor: doctor || "Dr. Amit Sharma",
          hospital: hospital || "City Health Clinic",
          medicines: ['Aspirin', 'Paracetamol'], // mock parsed list for generic documents
          fileUrl: base64
        });

        console.log("addDocument FINISHED");

        // Reset
        setDocName('');
        setDoctor('');
        setHospital('');
        setIsUploading(false);
      } catch (err) {
        console.error("UPLOAD ERROR:", err);
        setIsUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-sans text-white">{t.docTitle}</h2>
      </div>

      {/* 2. Quick Upload Box */}
      <div className="card-navy space-y-4 text-left">
        <h3 className="text-sm font-bold text-navy-700 uppercase tracking-widest pl-1">{t.uploadDoc}</h3>
        
        <div className="grid grid-cols-2 gap-3.5">
          <input 
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="Document Label (e.g. AIIMS prescription)"
            className="w-full bg-navy-950 border border-navy-800 rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-accent"
          />
          <select 
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full bg-navy-950 border border-navy-800 rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-accent cursor-pointer"
          >
            <option value="prescription">Prescription पर्चा</option>
            <option value="report">Lab Report लैब रिपोर्ट</option>
            <option value="summary">Discharge Summary डिस्चार्ज</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <input 
            type="text"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            placeholder="Doctor's Name"
            className="w-full bg-navy-950 border border-navy-800 rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-accent"
          />
          <input 
            type="text"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            placeholder="Hospital / Laboratory"
            className="w-full bg-navy-950 border border-navy-800 rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-accent"
          />
        </div>

        <label className="w-full flex items-center justify-center space-x-2 border-2 border-dashed border-navy-800 bg-navy-950 py-4 rounded-2xl cursor-pointer hover:border-accent/40 transition-all text-sm font-bold text-navy-100 tactile-btn">
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Plus size={18} />
          )}
          <span>{isUploading ? "Uploading..." : "Click to select Prescription File"}</span>
          <input 
            type="file" 
            accept="image/*,application/pdf" 
            onChange={handleUpload} 
            className="hidden" 
          />
        </label>
      </div>

      {/* 3. Date organized documents list */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-16 text-navy-750">
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-elder-base font-bold text-navy-700">No documents stored</p>
            <p className="text-xs text-navy-800 mt-1 leading-normal">Your scanned and manually uploaded prescriptions will show up here.</p>
          </div>
        ) : (
          documents.map(doc => (
            <div 
              key={doc.id}
              className="card-navy flex items-start justify-between border border-navy-800 hover:border-navy-700 transition-all p-5"
            >
              <div className="flex items-start space-x-4 flex-1 text-left min-w-0 pr-2">
                <div className="w-12 h-12 rounded-2xl bg-navy-950 border border-navy-800 flex items-center justify-center text-accent">
                  <FileText size={22} />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="bg-navy-950 border border-navy-850 px-2 py-0.5 rounded-lg text-[9px] font-bold text-navy-100 uppercase tracking-widest">
                    {doc.type}
                  </span>
                  
                  <h3 className="text-elder-base font-extrabold text-white mt-1 leading-tight truncate">
                    {doc.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-3 text-xs font-semibold text-navy-100">
                    <div className="flex items-center space-x-1.5">
                      <User size={13} className="text-navy-700" />
                      <span className="truncate">{doc.doctor}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Calendar size={13} className="text-navy-700" />
                      <span>{doc.date}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 col-span-2 mt-1">
                      <Building size={13} className="text-navy-700" />
                      <span className="truncate">{doc.hospital}</span>
                    </div>
                  </div>

                  {/* Medicine List tags */}
                  {doc.medicines.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-navy-850">
                      {doc.medicines.map((m, i) => (
                        <span 
                          key={i} 
                          className="bg-accent/10 border border-accent/15 px-2 py-0.5 rounded-lg text-[10px] font-bold text-accent"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons (View/Delete) */}
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => setPreviewDoc(doc)}
                  className="p-2.5 text-accent hover:text-white bg-navy-950 rounded-xl border border-navy-800 hover:border-accent/40 tactile-btn"
                  title={t.viewInline}
                >
                  <Eye size={16} />
                </button>
                <button 
                  onClick={() => {
                    if (confirm(`Delete ${doc.name}?`)) {
                      deleteDocument(doc.id);
                    }
                  }}
                  className="p-2.5 text-navy-700 hover:text-rose-500 bg-navy-950 hover:bg-rose-500/10 border border-navy-800 hover:border-rose-500/20 rounded-xl tactile-btn"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Inline preview dialog modal (zero dependencies!) */}
      {previewDoc && (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col p-6 items-center justify-center animate-fade-in">
          <div className="bg-navy-900 border border-navy-800 rounded-3xl w-full max-w-sm h-4/5 flex flex-col shadow-2xl relative">
            
            {/* Modal header */}
            <div className="p-4 border-b border-navy-800 flex items-center justify-between">
              <h3 className="font-bold text-white leading-tight font-sans truncate pr-2">
                {previewDoc.name}
              </h3>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="p-2 text-navy-100 bg-navy-850 border border-navy-750 rounded-full tactile-btn"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal inline viewer content */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-navy-950">
              {previewDoc.fileUrl.startsWith('data:image/') || previewDoc.fileUrl.startsWith('http') ? (
                <img 
                  src={previewDoc.fileUrl} 
                  alt={previewDoc.name} 
                  className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                />
              ) : (
                <div className="text-center p-6 text-navy-700">
                  <FileText size={48} className="mx-auto mb-2 opacity-30" />
                  <p className="font-bold">PDF / Complex Format Document</p>
                  <p className="text-xs text-navy-800 mt-1">Natively stored base64 structures are active.</p>
                </div>
              )}
            </div>

            {/* Modal details footer */}
            <div className="p-4 border-t border-navy-800 bg-navy-900 rounded-b-3xl text-left text-xs space-y-1">
              <div><span className="text-navy-700 font-bold uppercase mr-2">Doctor:</span> <span className="text-white font-semibold">{previewDoc.doctor}</span></div>
              <div><span className="text-navy-700 font-bold uppercase mr-2">Hospital:</span> <span className="text-white font-semibold">{previewDoc.hospital}</span></div>
              <div><span className="text-navy-700 font-bold uppercase mr-2">Date:</span> <span className="text-white font-semibold">{previewDoc.date}</span></div>
            </div>
          </div>
        </div>
      )}
<ChatWithDocument />
    </div>
  );
};
