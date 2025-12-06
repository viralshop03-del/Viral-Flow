import React, { useState, useEffect, useRef } from 'react';
import { Clapperboard, FileText, Trash2, Type, Folder, History, MessageSquare, CheckCircle2, Circle, X, User, Upload, Ratio, Key, Settings } from 'lucide-react';
import { ScriptResponse, SavedProject } from './types';
import { generateScript } from './services/geminiService';
import { ScriptOutput } from './components/ScriptOutput';

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScriptResponse | null>(null);
  
  // API Key State
  const [apiKey, setApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  
  // Form State
  const [scriptContent, setScriptContent] = useState('');
  const [coverTitle, setCoverTitle] = useState('');
  const [includeBubble, setIncludeBubble] = useState(false);
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');

  // Project Library State
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available Ratios
  const ratios = ["9:16", "16:9", "1:1", "4:3", "3:4"];

  // 1. Load Data & API Key on Startup
  useEffect(() => {
    // API KEY CHECK
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
        setApiKey(storedKey);
    } else {
        setShowKeyModal(true);
    }

    // Load Current Workspace
    try {
      const currentData = localStorage.getItem('viralFlowData_Visualizer');
      if (currentData) {
        const parsed = JSON.parse(currentData);
        setScriptContent(parsed.scriptContent || '');
        setCoverTitle(parsed.coverTitle || '');
        setIncludeBubble(parsed.includeBubble ?? false);
        setCharacterImage(parsed.characterImage || null);
        setAspectRatio(parsed.aspectRatio || '9:16');
        setResult(parsed.result || null);
      }
    } catch (e) { 
      console.error("Workspace load error - clearing corrupt data", e); 
      localStorage.removeItem('viralFlowData_Visualizer');
    }

    // Load History (Folder)
    try {
      const historyData = localStorage.getItem('viralFlowHistory');
      if (historyData) {
        setSavedProjects(JSON.parse(historyData));
      }
    } catch (e) { 
      console.error("History load error", e); 
      localStorage.removeItem('viralFlowHistory');
    }
  }, []);

  // 2. Auto-Save Current Workspace
  useEffect(() => {
    try {
      const dataToSave = { scriptContent, coverTitle, includeBubble, characterImage, aspectRatio, result };
      localStorage.setItem('viralFlowData_Visualizer', JSON.stringify(dataToSave));
    } catch (e) {
      console.error("Auto-save error:", e);
    }
  }, [scriptContent, coverTitle, includeBubble, characterImage, aspectRatio, result]);

  // 3. Auto-Save History
  useEffect(() => {
    try {
      localStorage.setItem('viralFlowHistory', JSON.stringify(savedProjects));
    } catch (e) {
      console.error("History save error:", e);
    }
  }, [savedProjects]);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowKeyModal(false);
  };

  const handleClearText = () => {
    setScriptContent('');
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCharacterImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setCharacterImage(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleNewProject = () => {
    if (scriptContent.trim() || result) {
      const newProject: SavedProject = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        title: coverTitle || result?.title || "Untitled Project",
        data: {
            scriptContent,
            coverTitle,
            includeBubble,
            characterImage,
            aspectRatio,
            result
        }
      };
      setSavedProjects(prev => [newProject, ...prev]);
    }

    setResult(null);
    setScriptContent('');
    setCoverTitle('');
    setIncludeBubble(false);
    setCharacterImage(null);
    setAspectRatio('9:16');
  };

  const loadProject = (project: SavedProject) => {
    setScriptContent(project.data.scriptContent);
    setCoverTitle(project.data.coverTitle);
    setIncludeBubble(project.data.includeBubble);
    setCharacterImage(project.data.characterImage);
    setAspectRatio(project.data.aspectRatio || '9:16');
    setResult(project.data.result);
  };

  const deleteProject = (id: string) => {
    setSavedProjects(prev => prev.filter(p => p.id !== id));
  };

  const clearAllHistory = () => {
    if(confirm("Delete all project history?")) {
        setSavedProjects([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptContent) return;
    if (!apiKey) {
        setShowKeyModal(true);
        return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await generateScript({
        scriptContent,
        coverTitle,
        includeBubbleText: includeBubble,
        characterImage,
        aspectRatio
      }, apiKey); 
      setResult(data);
    } catch (error: any) {
      console.error("Generation Error:", error);
      alert(error.message || "Failed to generate storyboard. Check API Key quota.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-zinc-100 selection:bg-purple-500/30 selection:text-purple-200 relative overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
                        <Key className="text-purple-500" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Enter Gemini API Key</h2>
                    <p className="text-sm text-zinc-400">
                        To use this app publicly, you must provide your own API Key. It is stored locally in your browser and never sent to our servers.
                    </p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); const val = (e.target as any).keyInput.value; if(val) saveApiKey(val); }}>
                    <input 
                        name="keyInput"
                        type="password" 
                        placeholder="AIzaSy..." 
                        className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white mb-4 focus:border-purple-500 focus:outline-none"
                        autoFocus
                    />
                    <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors">
                        Save Key & Continue
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-purple-400 hover:text-purple-300 underline">
                        Get a free Gemini API Key here
                    </a>
                </div>
            </div>
        </div>
      )}

      <nav className="relative z-10 border-b border-zinc-800 bg-[#0f0f11]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg">
                <Clapperboard size={20} className="text-white" />
            </div>
            <span className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              Viral Flow
            </span>
          </div>
          <div className="flex gap-2 md:gap-4 items-center">
             <button onClick={() => setShowKeyModal(true)} className="p-2 text-zinc-400 hover:text-white transition-colors" title="API Key Settings">
                <Settings size={20} />
             </button>
             {(result || scriptContent.length > 0) && (
                <button 
                    onClick={handleNewProject}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors shadow-lg shadow-green-900/20 whitespace-nowrap"
                >
                    <Folder size={14} /> <span className="hidden sm:inline">New Project</span>
                </button>
             )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        
        {!result && (
            <div className="text-center mb-12 space-y-4 animate-fade-in-up">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                    Turn Your Script into a <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Visual Storyboard</span>
                </h1>
                <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto px-2">
                    Paste your script and upload a character reference. We'll generate a cinematic shot list with consistent visuals.
                </p>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          <div className={`lg:col-span-4 ${result ? 'lg:sticky lg:top-24 h-fit' : 'lg:col-start-5 lg:col-span-4'}`}>
            <div className="space-y-6">
                
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                    <FileText size={16} />
                                    Paste Your Script
                                </label>
                                {scriptContent && (
                                    <button
                                        type="button"
                                        onClick={handleClearText}
                                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                                    >
                                        <Trash2 size={12} /> Clear Text
                                    </button>
                                )}
                            </div>
                            <textarea
                                value={scriptContent}
                                onChange={(e) => setScriptContent(e.target.value)}
                                placeholder="Paste your full script here..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all h-[160px] resize-none font-mono text-sm leading-relaxed"
                                required
                            />
                        </div>

                        {/* ROW: CHARACTER UPLOAD + ASPECT RATIO */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            
                            {/* LEFT: CHARACTER (65%) */}
                            <div className="flex-[1.5] space-y-2">
                                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                    <User size={16} />
                                    Character Ref
                                </label>
                                {!characterImage ? (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-24 border-2 border-dashed border-zinc-800 hover:border-purple-500/50 bg-zinc-950/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group"
                                    >
                                        <Upload size={18} className="text-zinc-500 group-hover:text-purple-400 mb-1" />
                                        <span className="text-[10px] text-zinc-500 font-medium">Upload Image</span>
                                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                    </div>
                                ) : (
                                    <div className="h-24 relative group rounded-xl overflow-hidden border border-zinc-700">
                                        <img src={characterImage} alt="Ref" className="w-full h-full object-cover opacity-80" />
                                        <button 
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: RATIO (35%) */}
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                    <Ratio size={16} />
                                    Aspect
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ratios.map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setAspectRatio(r)}
                                            className={`h-11 rounded-lg text-[10px] font-bold border transition-all ${
                                                aspectRatio === r 
                                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30' 
                                                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Type size={16} />
                                Cover Title <span className="text-zinc-500 text-xs font-normal">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={coverTitle}
                                onChange={(e) => setCoverTitle(e.target.value)}
                                placeholder="e.g. RAHASIA FYP 2024"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm font-bold tracking-wide"
                            />
                        </div>

                        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setIncludeBubble(!includeBubble)}
                                className="w-full flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg transition-colors ${includeBubble ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-800 text-zinc-600'}`}>
                                        <MessageSquare size={14} />
                                    </div>
                                    <div className="text-left">
                                        <div className={`text-xs font-bold transition-colors ${includeBubble ? 'text-zinc-200' : 'text-zinc-500'}`}>Manga Bubbles</div>
                                    </div>
                                </div>
                                {includeBubble ? <CheckCircle2 size={16} className="text-yellow-500" /> : <Circle size={16} className="text-zinc-700" />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !scriptContent}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Visualizing...
                                </>
                            ) : (
                                <>
                                    <Clapperboard size={20} className="fill-white/20" />
                                    Generate Storyboard
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {savedProjects.length > 0 && (
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xl animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-zinc-400 font-bold text-sm flex items-center gap-2">
                                <History size={16} /> Project History
                            </h3>
                            <button onClick={clearAllHistory} className="text-xs text-red-500 hover:text-red-400 transition-colors">
                                Clear All
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {savedProjects.map((proj) => (
                                <div key={proj.id} className="group bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 flex items-center justify-between transition-all">
                                    <button 
                                        onClick={() => loadProject(proj)}
                                        className="flex-1 text-left"
                                    >
                                        <div className="font-bold text-sm text-zinc-300 group-hover:text-purple-400 transition-colors truncate max-w-[180px] md:max-w-[200px]">
                                            {proj.title}
                                        </div>
                                        <div className="text-[10px] text-zinc-600 flex items-center gap-2">
                                            {new Date(proj.timestamp).toLocaleString()}
                                            <span className="bg-zinc-800 px-1 rounded text-zinc-400">{proj.data.aspectRatio || '9:16'}</span>
                                        </div>
                                    </button>
                                    <button 
                                        onClick={() => deleteProject(proj.id)}
                                        className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>

          {result && (
            <div className="lg:col-span-8">
                <ScriptOutput data={result} apiKey={apiKey} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;