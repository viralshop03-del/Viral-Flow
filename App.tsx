import React, { useState, useEffect, useRef } from 'react';
import { Clapperboard, FileText, Trash2, Type, Folder, History, MessageSquare, CheckCircle2, Circle, X, User, Upload, Ratio, Key, Loader2, Sparkles, XCircle, Aperture } from 'lucide-react';
import { ScriptResponse, SavedProject } from './types';
import { generateScript } from './services/geminiService';
import { ScriptOutput } from './components/ScriptOutput';

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 512;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(event.target?.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

function App() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [result, setResult] = useState<ScriptResponse | null>(null);
  const [hasKey, setHasKey] = useState(false);

  const [scriptContent, setScriptContent] = useState('');
  const [includeBubble, setIncludeBubble] = useState(true);
  const [visualCinematic, setVisualCinematic] = useState(true); // Default ON
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio && await (window as any).aistudio.hasSelectedApiKey()) setHasKey(true);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    processScript('strict');
  };

  const processScript = async (mode: 'strict' | 'viral') => {
    if (!scriptContent || loading) return;

    setLoading(true);
    
    if (mode === 'strict') {
      setLoadingMessage("Menganalisis Naskah Original...");
      setTimeout(() => setLoadingMessage("Memecah Scene Sinematik..."), 2000);
    } else {
      setLoadingMessage("Meretas Algoritma TikTok...");
      setTimeout(() => setLoadingMessage("Menulis Ulang Narasi FYP..."), 2000);
      setTimeout(() => setLoadingMessage("Mengaplikasikan Filter Anti-Banned..."), 4000);
    }

    try {
      const data = await generateScript({
        scriptContent,
        includeBubbleText: includeBubble,
        characterImage,
        aspectRatio,
        optimizationMode: mode
      });
      setResult(data);
    } catch (error: any) {
      console.error("Submit Error:", error);
      const errorMsg = error?.message || (typeof error === 'string' ? error : "Terjadi kesalahan sistem.");
      if (errorMsg.includes("Requested entity was not found")) {
        setHasKey(false);
      }
      alert("Gagal memproses skrip. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = () => {
    processScript('viral');
  };

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-[#0f0f11] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-purple-500/10 rounded-3xl border border-purple-500/20 mb-6">
          <Key className="text-purple-500" size={40} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Kunci Proyek Diperlukan</h1>
        <p className="text-zinc-400 text-sm mb-6 max-w-xs leading-relaxed">
          Untuk menghasilkan konten viral berkualitas tinggi, Anda harus memilih Kunci API Gemini dari proyek GCP yang berbayar.
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline block mt-2 font-bold">
            Pelajari tentang penagihan
          </a>
        </p>
        <button onClick={handleSelectKey} className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-900/20">
          Atur Kunci API
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] text-zinc-100 relative selection:bg-purple-500/30">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 relative mb-6">
            <Loader2 className="text-purple-500 animate-spin w-full h-full" />
            <Sparkles className="absolute inset-0 m-auto text-purple-300 animate-pulse" size={32} />
          </div>
          <h2 className="text-2xl font-black mb-2 tracking-tight animate-pulse">{loadingMessage}</h2>
          <p className="text-zinc-500 text-sm max-w-xs">AI sedang bekerja untuk konten Anda.</p>
        </div>
      )}

      <nav className="border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-xl">
              <Clapperboard size={20} className="text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase italic">AlurViral</span>
          </div>
          {result && (
            <button onClick={() => setResult(null)} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl font-black tracking-widest transition-colors">PROYEK BARU</button>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className={`lg:col-span-4 ${result ? 'hidden lg:block' : 'lg:col-start-4 lg:col-span-6'}`}>
            <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-8 shadow-2xl">
              <div className="space-y-3">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Skrip Cerita
                </label>
                <textarea 
                  value={scriptContent}
                  onChange={(e) => setScriptContent(e.target.value)}
                  placeholder="Tempel skrip mentah Anda di sini. Langkah 1: AI akan memvisualisasikan tanpa mengubah teks."
                  className="w-full h-48 bg-black border border-zinc-800 rounded-2xl p-6 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none transition-all text-sm leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Ratio size={14} /> Format Video
                  </label>
                  <select 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm font-bold focus:border-purple-500 outline-none"
                  >
                    <option value="9:16">9:16 (TIKTOK)</option>
                    <option value="16:9">16:9 (YOUTUBE)</option>
                    <option value="1:1">1:1 (FEED)</option>
                  </select>
                </div>
                
                {/* FITUR BARU: Visual Cinematic Toggle */}
                <div className="space-y-3">
                   <label className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Aperture size={14} /> Visual Style
                  </label>
                  <button 
                    type="button"
                    onClick={() => setVisualCinematic(!visualCinematic)}
                    className={`w-full p-3 rounded-xl border text-[10px] font-black transition-all flex items-center justify-center gap-2 ${visualCinematic ? 'bg-blue-600/10 border-blue-500/50 text-blue-500 shadow-lg shadow-blue-900/10' : 'bg-black border-zinc-800 text-zinc-600'}`}
                  >
                    {visualCinematic ? <Sparkles size={14} /> : null}
                    {visualCinematic ? 'CINEMATIC ON' : 'CINEMATIC OFF'}
                  </button>
                </div>

                <div className="space-y-3 col-span-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} /> Teks Manga
                  </label>
                  <button 
                    type="button"
                    onClick={() => setIncludeBubble(!includeBubble)}
                    className={`w-full p-3 rounded-xl border text-[10px] font-black transition-all flex items-center justify-center gap-2 ${includeBubble ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-500 shadow-lg shadow-indigo-900/10' : 'bg-black border-zinc-800 text-zinc-600'}`}
                  >
                    {includeBubble ? <Sparkles size={14} /> : null}
                    {includeBubble ? 'BUBBLE TEXT: AKTIF' : 'BUBBLE TEXT: NONAKTIF'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} /> Ref. Karakter
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-28 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-all bg-black/30 group overflow-hidden"
                >
                  {characterImage ? (
                    <img src={characterImage} className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <Upload className="text-zinc-700 group-hover:text-purple-500 mb-2 transition-colors" size={24} />
                      <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">UNGGAH REFERENSI (OPSIONAL)</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    accept="image/*" 
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setCharacterImage(await resizeImage(f));
                    }} 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 border border-zinc-700"
              >
                <Clapperboard size={20} />
                PROSES (TANPA UBAH TEKS)
              </button>
            </form>
          </div>

          {result && (
            <div className="lg:col-span-8">
              <ScriptOutput 
                data={result} 
                characterImage={characterImage} 
                onOptimize={handleOptimize}
                initialVisualCinematic={visualCinematic}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;