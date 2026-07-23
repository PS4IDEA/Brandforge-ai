import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, Mic, StopCircle, Upload, AlertCircle } from 'lucide-react';
import { Language, UserProfile } from '../types';
import { motion } from 'motion/react';
import LoadingOverlay from './ui/LoadingOverlay';
import { fetchAPI } from '../lib/api';

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
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        // Release mic resources
        stream.getTracks().forEach(track => track.stop());

        setTranscribing(true);
        setError('');

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = reader.result as string;
            const base64Audio = base64Data.split(',')[1];
            const mimeType = audioBlob.type;

            const response = await fetch('/api/transcribe-audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audio: base64Audio,
                mimeType,
                language
              })
            });

            const resJson = await response.json();
            if (resJson.success && resJson.transcription) {
              setDescription((prev) => prev ? `${prev}\n${resJson.transcription}` : resJson.transcription);
            } else {
              setError(resJson.error || (isAr ? 'فشل تحويل الصوت إلى نص.' : 'Audio transcription failed.'));
            }
            setTranscribing(false);
          };
        } catch (err: any) {
          console.error("Transcription processing error:", err);
          setError(isAr ? 'حدث خطأ أثناء معالجة الملف الصوتي.' : 'Error processing audio file.');
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      setError(isAr ? 'تعذر الوصول إلى الميكروفون' : 'Could not access microphone');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
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
      const resJson = await fetchAPI('/api/generate-brand-from-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description, 
          language 
        })
      });

      if (resJson.success && resJson.brand) {
        if (onDeductCredits) {
          onDeductCredits(5);
        }
        setResult(resJson.brand);
      } else {
        setError(resJson.error || (isAr ? 'فشل توليد الهوية التجارية.' : 'Failed to generate brand identity.'));
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
      <LoadingOverlay isLoading={transcribing} language={language} message={isAr ? 'جاري تحويل الصوت إلى نص...' : 'Transcribing audio...'} />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-sm">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            {isAr ? 'صف فكرتك، مشروعك، أو الخدمات التي تقدمها بالتفصيل:' : 'Describe your idea, project, or services in detail:'}
          </label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder={isAr ? 'صف فكرتك أو مشروعك بالتفصيل (يمكنك الكتابة أو التسجيل الصوتي)...' : 'Describe your idea or project details (you can write or record audio)...'} 
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all" 
            required 
            rows={4}
          />
        </div>
        
        <div className="flex gap-4">
          <button 
            type="button" 
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 border-red-600 text-white animate-pulse' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700'
            } transition-all`}
          >
            {isRecording ? (
              <>
                <StopCircle className="w-5 h-5 animate-bounce" /> 
                {isAr ? 'إيقاف التسجيل' : 'Stop'}
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" /> 
                {isAr ? 'سجل صوتياً' : 'Record Audio'}
              </>
            )}
          </button>
          
          <button type="submit" disabled={loading} className="flex-[2] px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md focus:ring-2 focus:ring-orange-400">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isAr ? 'توليد البراند' : 'Generate Brand'}
          </button>
        </div>
      </form>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-8 shadow-md text-slate-800 dark:text-slate-100"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500 dark:text-orange-400">
              {isAr ? 'الهوية المولّدة' : 'Generated Identity'}
            </span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{result.brandName}</h2>
            {result.tagline && (
              <p className="text-lg text-orange-600 dark:text-orange-400 font-semibold mt-2 italic">
                "{result.tagline}"
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side details */}
            <div className="space-y-6">
              {result.industry && (
                <div>
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {isAr ? 'المجال / قطاع العمل' : 'Industry / Category'}
                  </h3>
                  <p className="text-slate-900 dark:text-slate-200 font-semibold text-base">
                    {result.industry}
                  </p>
                </div>
              )}

              {result.targetAudience && (
                <div>
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {isAr ? 'الجمهور المستهدف' : 'Target Audience'}
                  </h3>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                    {result.targetAudience}
                  </p>
                </div>
              )}

              {result.personality && (
                <div>
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {isAr ? 'شخصية ونبرة العلامة' : 'Brand Personality & Tone'}
                  </h3>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                    {result.personality}
                  </p>
                </div>
              )}
            </div>

            {/* Right side details */}
            <div className="space-y-6">
              {result.logoConcept && (
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    {isAr ? 'مفهوم تصميم الشعار' : 'Logo Design Concept'}
                  </h3>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                    {result.logoConcept}
                  </p>
                </div>
              )}

              {result.colors && Array.isArray(result.colors) && result.colors.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    {isAr ? 'لوحة الألوان المقترحة' : 'Suggested Color Palette'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {result.colors.map((color: { hex: string; name: string }, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60">
                        <div 
                          className="w-10 h-10 rounded-lg shadow-inner shrink-0 border border-slate-300 dark:border-slate-700" 
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{color.name}</p>
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 select-all">{color.hex}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
