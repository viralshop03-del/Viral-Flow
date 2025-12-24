import React, { useState, useEffect } from 'react';
import { ScriptResponse, ScriptScene } from '../types';
import { generateThumbnail } from '../services/geminiService';
import { Download, Image as ImageIcon, Copy, Check, Loader2, MessageSquare, ToggleLeft, ToggleRight, Sparkles, Maximize, TrendingUp, Zap, Heart, Clock, Lightbulb, Ghost, MoveRight, Video, Wand2, RefreshCw, Aperture } from 'lucide-react';

interface ScriptOutputProps {
  data: ScriptResponse;
  characterImage?: string | null;
  onOptimize: () => void;
  initialVisualCinematic: boolean;
}

export const ScriptOutput: React.FC<ScriptOutputProps> = ({ data, characterImage, onOptimize, initialVisualCinematic }) => {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loadingCover, setLoadingCover] = useState(false);
  const [sceneNarrationCopied, setSceneNarrationCopied] = useState<Record<number, boolean>>({});
  const [sceneImages, setSceneImages] = useState<Record<number, string>>({});
  const [loadingScenes, setLoadingScenes] = useState<Record<number, boolean>>({});
  const [useBubbles, setUseBubbles] = useState(true);
  const [visualCinematic, setVisualCinematic] = useState(initialVisualCinematic);

  // Reset semua gambar dan state lokal ketika data skrip berubah (misal: setelah Optimasi)
  useEffect(() => {
    setCoverUrl(null);
    setSceneImages({});
    setSceneNarrationCopied({});
    setLoadingScenes({});
    setLoadingCover(false);
    // Kita tidak mereset visualCinematic di sini karena user mungkin ingin mempertahankan settingnya
    // atau jika data berubah total (proyek baru), komponen ini akan di-remount.
  }, [data]);

  const hasBubbles = data?.body?.some(scene => !!scene.bubbleText);

  const downloadImage = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateCover = async () => {
    if (!data.imagePrompt) return;
    setLoadingCover(true);
    try {
      // Hapus judul dari prompt gambar agar AI tidak mencoba menulis teks (yang sering jelek).
      // Biarkan aplikasi yang menangani overlay teks judul.
      const prompt = `Poster Film Blockbuster (Tanpa Teks): ${data.imagePrompt}. KUALITAS: 8K Ultra HD, Hyper-Realistic, Super Detailed, Cinematic Lighting, Pori-pori kulit terlihat.`;
      const url = await generateThumbnail(prompt, data.aspectRatio, 'cover', characterImage, visualCinematic);
      setCoverUrl(url);
    } catch (e) {
      alert("Gagal membuat sampul.");
    } finally {
      setLoadingCover(false);
    }
  };

  const handleGenerateSceneImage = async (index: number, scene: any) => {
    setLoadingScenes(prev => ({...prev, [index]: true}));
    try {
      const safePrompt = String(scene.imagePrompt || "");
      const safeExpression = String(scene.mangaExpression || "");
      const safeVisual = String(scene.visual || ""); // Mengambil deskripsi visual lengkap
      const safeColor = String(scene.emotionColor || "#ffffff");
      const safeBubble = String(scene.bubbleText || "");

      // LOGIKA DINAMIS: Tentukan shot type agar tidak selalu close-up
      // Jika teks mengandung kata lari/jalan/lompat, paksa Full Body.
      const isAction = /lari|jalan|lompat|tarung|pukul|kejar|run|fight|jump/i.test(safePrompt + safeExpression);
      const shotType = isAction ? "FULL BODY ACTION SHOT, WIDE ANGLE" : "CINEMATIC MEDIUM SHOT";

      // Update Prompt: Fokus pada KUALITAS TINGGI dan AKSI
      let prompt = `
        TIPE SHOT: ${shotType}.
        AKSI UTAMA: ${safePrompt}. 
        DETAIL GERAKAN: ${safeExpression}.
        LINGKUNGAN: ${safeVisual}.
        
        PASTIKAN KARAKTER BERGERAK SESUAI DESKRIPSI. Jangan Pose Diam.
        Kualitas: Super Jernih, 8K, Fotorealistik, Tekstur Nyata. Mood Cahaya: ${safeColor}.
      `;
      
      if (useBubbles && safeBubble) {
        // Update Prompt Bubble: TERKUNCI GAYA LEDAKAN PIJAR
        prompt += ` . FITUR WAJIB: Speech Bubble BENTUK LEDAKAN PIJAR (Spiky/Jagged Manga Shout Bubble). POSISI: TENGAH (CENTERED) menempel dekat wajah. WARNA BUBBLE: ${safeColor} (Mengikuti Mood). Teks di dalam bubble: "${safeBubble}".`;
      }

      const url = await generateThumbnail(prompt, data.aspectRatio, 'scene', characterImage, visualCinematic);
      setSceneImages(prev => ({...prev, [index]: url}));
    } catch (e) {
      alert("Gagal membuat gambar adegan.");
    } finally {
      setLoadingScenes(prev => ({...prev, [index]: false}));
    }
  };

  const copySceneText = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setSceneNarrationCopied(prev => ({...prev, [index]: true}));
    setTimeout(() => setSceneNarrationCopied(prev => ({...prev, [index]: false})), 2000);
  };

  const getAspectRatioClass = (ratio: string) => {
      switch(ratio) {
          case '16:9': return 'aspect-video';
          case '1:1': return 'aspect-square';
          default: return 'aspect-[9/16]';
      }
  };

  const scoreColor = data.analysis.score >= 90 ? 'text-purple-400' : data.analysis.score >= 70 ? 'text-green-400' : 'text-yellow-400';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-20">
      {/* Header Analisis Viral */}
      <div className="bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        
        <div className="relative flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="flex flex-col items-center">
             <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * data.analysis.score) / 100} className="text-purple-500 transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                  <span className={`text-4xl font-black ${scoreColor} tracking-tighter`}>{data.analysis.score}</span>
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-tight">POTENSI FYP</span>
                </div>
             </div>
             {data.analysis.score >= 90 ? (
               <div className="mt-2 flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
                 <Wand2 size={10} className="text-purple-400" />
                 <span className="text-[9px] font-bold text-purple-300 uppercase">DIOPTIMALKAN AI</span>
               </div>
             ) : (
                <div className="mt-2 flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
                  <span className="text-[9px] font-bold text-yellow-500 uppercase">BELUM OPTIMAL</span>
                </div>
             )}
          </div>

          <div className="flex-1 space-y-4 w-full">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video size={18} className="text-purple-400" />
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Laporan Strategi Algoritma</h3>
                </div>
                {/* TOMBOL OPTIMASI */}
                {data.analysis.score < 95 && (
                  <button 
                    onClick={onOptimize}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-900/30 transition-all transform hover:scale-105 active:scale-95 animate-pulse"
                  >
                    <RefreshCw size={14} className="animate-spin-slow" />
                    Perbaiki Skrip (Auto-FYP)
                  </button>
                )}
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/40 p-3 rounded-2xl border border-zinc-800/50">
                   <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                      <Zap size={10} className="text-yellow-400" /> Kekuatan Hook
                   </div>
                   <p className="text-xs text-zinc-300 font-semibold">{data.analysis.hookStrength}</p>
                </div>
                <div className="bg-black/40 p-3 rounded-2xl border border-zinc-800/50">
                   <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                      <Heart size={10} className="text-red-400" /> Emosi Penonton
                   </div>
                   <p className="text-xs text-zinc-300 font-semibold">{data.analysis.emotionalAppeal}</p>
                </div>
                <div className="bg-black/40 p-3 rounded-2xl border border-zinc-800/50">
                   <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                      <Clock size={10} className="text-indigo-400" /> Watch Time
                   </div>
                   <p className="text-xs text-zinc-300 font-semibold">{data.analysis.retentionPrediction}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800/50">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={14} className="text-yellow-400" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Saran Perbaikan (Mode Manual)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.analysis.improvementTips.map((tip, i) => (
              <div key={i} className="bg-black/40 px-4 py-3 rounded-2xl border border-zinc-800/50 flex items-start gap-3">
                <div className="text-purple-500 font-black text-xs">0{i+1}</div>
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed italic">"{tip}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white mb-1 tracking-tight uppercase italic flex items-center gap-3">
               <Video size={20} className="text-purple-500" />
               {String(data.title || "Proyek Sinematik")}
            </h2>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.3em]">Logika FYP 8K • {data.aspectRatio}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Visual Cinematic Toggle */}
            <button 
              onClick={() => setVisualCinematic(!visualCinematic)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-300 transform active:scale-95 ${visualCinematic ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'}`}
            >
              <Aperture size={16} />
              <span className="text-xs font-black uppercase tracking-widest text-center">Visual Cinematic</span>
              {visualCinematic ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            </button>

            {hasBubbles && (
              <button 
                onClick={() => setUseBubbles(!useBubbles)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-300 transform active:scale-95 ${useBubbles ? 'bg-purple-600/10 border-purple-500/30 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'}`}
              >
                <MessageSquare size={16} />
                <span className="text-xs font-black uppercase tracking-widest text-center">Hamparan Manga</span>
                {useBubbles ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
            )}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          {data.body.map((scene: ScriptScene, idx: number) => {
            const safeBubble = String(scene.bubbleText || "");
            const safeColor = String(scene.emotionColor || "#ffffff");
            const safeVisual = String(scene.visual || "");
            const safeExpression = String(scene.mangaExpression || "");
            const safeNarration = String(scene.originalText || "");
            const safeTransition = String(scene.transition || "none");

            return (
              <div key={idx} className="bg-zinc-900 border-2 border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl group transition-all hover:border-purple-500/30">
                <div className="relative">
                  <div className={`${getAspectRatioClass(data.aspectRatio)} bg-black flex items-center justify-center relative overflow-hidden group/img`}>
                    {sceneImages[idx] ? (
                      <>
                        <img src={sceneImages[idx]} className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110" />
                        <button 
                          onClick={() => downloadImage(sceneImages[idx], `adegan-${idx + 1}.png`)}
                          className="absolute bottom-6 right-6 p-3 bg-white text-black rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all z-10"
                          title="Unduh Gambar"
                        >
                          <Download size={20} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-8 w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-zinc-950 via-zinc-900 to-black">
                         {useBubbles && safeBubble && (
                          <div 
                            className="mb-8 bg-white text-black font-black px-5 py-2 rounded-full text-[10px] uppercase border-4 border-black shadow-2xl flex items-center gap-2 transform -rotate-2"
                            style={{ borderColor: safeColor }}
                          >
                            <Sparkles size={12} className="text-purple-600" />
                            Kata Manga: {safeBubble}
                          </div>
                        )}
                        <button 
                          onClick={() => handleGenerateSceneImage(idx, scene)}
                          disabled={loadingScenes[idx]}
                          className="px-10 py-5 bg-white text-black font-black rounded-full flex items-center gap-3 hover:bg-purple-50 transition-all disabled:opacity-50 shadow-2xl transform hover:scale-105 active:scale-95 border-b-4 border-r-4 border-zinc-300"
                        >
                          {loadingScenes[idx] ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                          {loadingScenes[idx] ? 'SEDANG RENDERING...' : 'BUAT GAMBAR ADEGAN'}
                        </button>
                        <p className="mt-5 text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">Kualitas 8K • Konsistensi Wajah</p>
                      </div>
                    )}
                    
                    <div className="absolute top-6 left-6 flex items-center gap-2">
                      <div className="px-4 py-2 bg-black text-white rounded-full text-[10px] font-black border-2 border-white/20">
                        ADEGAN {idx + 1} • {scene.timestamp}
                      </div>
                      {safeTransition !== "none" && (
                        <div className="px-4 py-2 bg-purple-600 text-white rounded-full text-[10px] font-black border-2 border-purple-400/50 flex items-center gap-2 shadow-lg shadow-purple-900/50">
                          <MoveRight size={12} />
                          {safeTransition.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-10 space-y-8">
                  <div className="bg-black/50 p-6 rounded-3xl border border-zinc-800/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: safeColor }}></div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2">
                        Narasi (Skrip)
                      </span>
                      <button onClick={() => copySceneText(idx, safeNarration)} className="text-zinc-500 hover:text-white transition-all hover:scale-110">
                        {sceneNarrationCopied[idx] ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="text-zinc-200 text-lg leading-relaxed font-bold italic tracking-tight">"{safeNarration}"</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest block">Akting & Ekspresi</span>
                      <p className="text-xs text-purple-400 font-bold leading-relaxed">{safeExpression}</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest block">Catatan Visual</span>
                      <p className="text-xs text-zinc-400 font-medium leading-relaxed italic">{safeVisual}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-8">
             <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl">
                <h3 className="text-[10px] font-black text-zinc-500 mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
                  <div className="p-2 bg-purple-500/10 rounded-xl">
                    <ImageIcon size={18} className="text-purple-500" />
                  </div>
                  Poster Utama
                </h3>
                <div className={`${getAspectRatioClass(data.aspectRatio)} bg-black rounded-3xl overflow-hidden mb-8 flex items-center justify-center border-4 border-zinc-800 group relative shadow-inner`}>
                  {coverUrl ? (
                    <>
                      <img src={coverUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      {/* Judul Sampul Profesional di Tengah & Sangat Besar */}
                      <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/40 pointer-events-none z-20">
                        <h1 className="text-white text-5xl md:text-7xl font-black uppercase italic text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-tight tracking-tighter"
                            style={{ textShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
                          {data.title}
                        </h1>
                      </div>
                      <button 
                        onClick={() => downloadImage(coverUrl, 'poster-utama.png')}
                        className="absolute bottom-4 right-4 p-3 bg-white text-black rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all z-10"
                      >
                        <Download size={18} />
                      </button>
                    </>
                  ) : (
                    <button onClick={handleGenerateCover} disabled={loadingCover} className="flex flex-col items-center gap-4 text-zinc-700 hover:text-purple-500 transition-all group-hover:scale-110">
                      {loadingCover ? <Loader2 className="animate-spin" size={48} /> : <ImageIcon size={48} />}
                      <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Render Poster Viral</span>
                    </button>
                  )}
                </div>
                <button 
                  onClick={handleGenerateCover}
                  disabled={loadingCover}
                  className="w-full py-5 bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-[0.15em] transition-all shadow-xl shadow-purple-900/30 active:scale-95 disabled:opacity-50 border-b-4 border-purple-800"
                >
                  {loadingCover ? 'MEMPROSES...' : 'BUAT ULANG POSTER'}
                </button>
             </div>
             
             {/* Status Box */}
             <div className={`border rounded-[2rem] p-8 ${data.analysis.score < 90 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${data.analysis.score < 90 ? 'text-yellow-500' : 'text-green-500'}`}>
                  <Sparkles size={14} /> {data.analysis.score < 90 ? 'Status: Perlu Optimasi' : 'Status: Siap Tayang'}
                </h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold italic">
                  {data.analysis.score < 90 
                    ? "Skrip Anda masih mempertahankan teks asli namun skor viralitas belum maksimal. Tekan tombol 'Perbaiki Skrip' untuk membiarkan AI menulis ulang dengan teknik copywriting FYP."
                    : "Skrip Anda memiliki potensi viral yang sangat tinggi dan aman. Siap untuk diproduksi!"
                  }
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};