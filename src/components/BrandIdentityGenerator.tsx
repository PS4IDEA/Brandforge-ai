import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, Mic, StopCircle, Upload, AlertCircle } from 'lucide-react';
import { Language, UserProfile } from '../types';
import { motion } from 'motion/react';
import LoadingOverlay from './ui/LoadingOverlay';

interface Props {
  language: Language;
  user?: UserProfile | null;
  onDeductCredits?: (amount: number) => boolean;
  onOpenLogin?: () => void;
}

export default function BrandIdentityGenerator({ language, user, onDeductCredits, onOpenLogin }: Props) {
  const isAr = language === 'ar';
  
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError(isAr ? 'تعذر الوصول إلى الميكروفون' : 'Could not access microphone');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    // In a real app, you would send the audio here or convert to text
    setError(isAr ? 'تم تسجيل الصوت (الميزة قيد التطوير)' : 'Audio recorded (feature in development)');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onOpenLogin) onOpenLogin();
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-brand-from-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description, 
          language 
        })
      });

      const resJson = await response.json();

      if (resJson.success && resJson.brand) {
        if (onDeductCredits) {
          onDeductCredits(5);
        }
        setResult(resJson.brand);
      } else {
        if (response.status === 429) {
          setError(isAr ? 'تم تجاوز حصة الطلبات اليومية، يرجى المحاولة لاحقاً.' : 'Daily API quota exceeded, please try again later.');
        } else {
          setError(resJson.error || (isAr ? 'فشل توليد الهوية التجارية.' : 'Failed to generate brand identity.'));
        }
      }
    } catch (err: any) {
      setError(isAr ? 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى.' : 'A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      <LoadingOverlay isLoading={loading} language={language} message={isAr ? 'جاري بناء الهوية...' : 'Building identity...'} />
      <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-sm">
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder={isAr ? 'صف فكرتك أو مشروعك...' : 'Describe your idea or project...'} 
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl" 
          required 
          rows={4}
        />
        
        <div className="flex gap-4">
          <button 
            type="button" 
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-200 hover:bg-slate-300'} text-white transition-all`}
          >
            {isRecording ? <><StopCircle className="w-5 h-5" /> {isAr ? 'إيقاف التسجيل' : 'Stop'}</> : <><Mic className="w-5 h-5" /> {isAr ? 'سجل صوتياً' : 'Record Audio'}</>}
          </button>
          
          <button type="submit" disabled={loading} className="flex-[2] px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isAr ? 'توليد البراند' : 'Generate Brand'}
          </button>
        </div>
      </form>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 border rounded-3xl p-8 space-y-6 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{result.brandName}</h2>
          <p className="text-lg text-orange-600 font-semibold">{result.tagline}</p>
          <div className="space-y-4">
            <p><strong>{isAr ? 'مفهوم الشعار:' : 'Logo Concept:'}</strong> {result.logoConcept}</p>
            <p><strong>{isAr ? 'الشخصية:' : 'Personality:'}</strong> {result.personality}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
