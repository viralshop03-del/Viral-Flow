import React, { useState, useEffect } from 'react';
import { ScriptResponse, ScriptScene } from '../types';
import { generateThumbnail } from '../services/geminiService';
import { Download, Image as ImageIcon, Copy, Check, Loader2, Layers, MessageSquare, ToggleLeft, ToggleRight, Mic } from 'lucide-react';

interface ScriptOutputProps {
  data: ScriptResponse;
}

export const ScriptOutput: React.FC<ScriptOutputProps> = ({ data }) => {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loadingCover, setLoadingCover] = useState(false);
  const [sceneNarrationCopied, setSceneNarrationCopied] = useState<Record<number, boolean>>({});
  
  // State for scene images: index -> url
  const [sceneImages, setSceneImages] = useState<Record<number, string>>({});
  const [loadingScenes, setLoadingScenes] = useState<Record<number, boolean>>({});

  // Manga Bubble Toggle State
  const [useBubbles, setUseBubbles] = useState(false);

  // Determine if features are active based on the first scene
  const hasBubbles = data.body && data.body.length > 0 && !!data.body[0]?.bubbleText;

  // Auto-enable bubble mode if data exists
  useEffect(() => {
    if (hasBubbles) {
        setUseBubbles(true);
    } else {
        setUseBubbles(false);
    }
  }, [data, hasBubbles]);

  const handleGenerateCover = async () => {
    if (!data.imagePrompt) return;
    setLoadingCover(true);
    try {
      // Pass 'cover' mode to ensure Neon Text is applied
      const url = await generateThumbnail(data.imagePrompt, data.aspectRatio, 'cover');
      setCoverUrl(url);
    } catch (e) {
      alert("Failed to generate cover image. Please check API Key quota.");
    } finally {
      setLoadingCover(false);
    }
  };

  const handleGenerateSceneImage = async (index: number, scene: ScriptScene) => {
    setLoadingScenes(prev => ({...prev, [index]: true}));
    try {
      let prompt = scene.imagePrompt;
      
      if (useBubbles && scene.bubbleText) {
        const bubbleColor = scene.emotionColor || "White";
        
        // DYNAMIC MANGA BUBBLE LOGIC
        prompt += `
        
        CRITICAL OVERLAY INSTRUCTION:
        Add a MANGA SPEECH BUBBLE containing exactly the text: "${scene.bubbleText}".
        
        BUBBLE STYLE RULES:
        1. COLOR & MOOD: The bubble background color MUST BE ${bubbleColor} to match the emotion.
        2. SHAPE: If color is Red/Warm -> Use "JAGGED/SPIKY" shape. If color is Blue/White/Cool -> Use "ROUNDED CLOUD" shape.
        3. BORDER: THICK BLACK INK OUTLINE around the bubble for contrast.
        4. TEXT: Bold Black or White font (whichever is most readable on ${bubbleColor}).
        5. POSITION: Floating clearly BESIDE the character's head.
        6. SIZE: MEDIUM SIZE (approx 15% of image). Must be readable but DO NOT dominate or cover the face.
        `;
      }

      // Pass 'scene' mode to ensure NO Neon Title Text is applied (fixing the double text issue)
      const url = await generateThumbnail(prompt, data.aspectRatio, 'scene');
      setSceneImages(prev => ({...prev, [index]: url}));
    } catch (e) {
      console.error(e);
      alert("Failed to generate scene image.");
    } finally {
      setLoadingScenes(prev => ({...prev, [index]: false}));
    }
  };

  const copySceneText = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setSceneNarrationCopied(prev => ({...prev, [index]: true}));
    setTimeout(() => setSceneNarrationCopied(prev => ({...prev, [index]: false})), 2000);
  };

  if (!data || !data.body) return null;

  // Dynamic aspect ratio class mapping
  const getAspectRatioClass = (ratio: string) => {
      switch(ratio) {
          case '16:9': return 'aspect-video';
          case '1:1': return 'aspect-square';
          case '4:3': return 'aspect-[4/3]';
          case '3:4': return 'aspect-[3/4]';
          default: return 'aspect-[9/16]';
      }
  };

  const ratioClass = getAspectRatioClass(data.aspectRatio);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-20 relative">
      
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{data.title}</h2>
            <p className="text-zinc-500 text-sm">Visual Storyboard Plan</p>
          </div>
          <div className="bg-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-400 font-mono border border-zinc-700">
            {data.aspectRatio || "9:16"}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-4">
            
            {/* Storyboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                    <Layers className="text-purple-500" size={20} />
                    <h3 className="font-bold text-xl text-white">Shot List</h3>
                </div>
                
                {/* Manga Bubble Toggle */}
                {hasBubbles && (
                    <button 
                        onClick={() => setUseBubbles(!useBubbles)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all ${useBubbles ? 'bg-yellow-400/10 border-yellow-400/50' : 'bg-zinc-900 border-zinc-700'}`}
                    >
                        <div className={`p-1.5 rounded-full ${useBubbles ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                            <MessageSquare size={14} className={useBubbles ? 'animate-bounce' : ''} />
                        </div>
                        <div className="text-left">
                            <span className={`block text-xs font-bold ${useBubbles ? 'text-yellow-400' : 'text-zinc-500'}`}>
                                Manga Bubbles
                            </span>
                        </div>
                        {useBubbles ? <ToggleRight className="text-yellow-400" size={24} /> : <ToggleLeft className="text-zinc-600" size={24} />}
                    </button>
                )}
            </div>

            {/* Scenes List */}
            <div className="space-y-8">
                {data.body.map((scene, idx) => (
                    // Changed layout to flex-col (Vertical) for bigger images
                    <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors shadow-md">
                        <div className="flex flex-col w-full">
                            
                            {/* Image Section - NOW FULL WIDTH AT TOP */}
                            <div className={`w-full bg-black relative border-b border-zinc-800 flex flex-col`}>
                                <div className={`w-full relative ${ratioClass} bg-black/50 mx-auto`}> 
                                    {sceneImages[idx] ? (
                                        <div className="relative w-full h-full group">
                                            <img 
                                                src={sceneImages[idx]} 
                                                alt={`Scene ${idx + 1}`} 
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <a href={sceneImages[idx]} download={`scene-${idx+1}.png`} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors">
                                                    <Download size={20} />
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center absolute inset-0">
                                            <div className="text-zinc-500 text-xs font-mono mb-4 absolute top-4 left-4">Scene {idx + 1}</div>
                                            
                                            {/* Preview of Bubble Text (Only shown before generation) */}
                                            {useBubbles && scene.bubbleText && (
                                                <div className="mb-4 px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-lg max-w-[80%]">
                                                    <p className="text-[10px] text-yellow-500 uppercase font-bold mb-1">Target Bubble</p>
                                                    <p className="text-sm text-yellow-200 font-bold">"{scene.bubbleText}"</p>
                                                </div>
                                            )}

                                            <button 
                                                onClick={() => handleGenerateSceneImage(idx, scene)}
                                                disabled={loadingScenes[idx]}
                                                className={`px-6 py-3 border rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2 group transform hover:scale-105 ${
                                                    useBubbles && scene.bubbleText
                                                    ? 'bg-yellow-400/10 hover:bg-yellow-400/20 border-yellow-400/30' 
                                                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'
                                                }`}
                                            >
                                                {loadingScenes[idx] ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <ImageIcon size={18} className={useBubbles && scene.bubbleText ? "text-yellow-400" : "text-purple-400"} />
                                                )}
                                                {loadingScenes[idx] ? 'Visualizing...' : 'Generate Visual'}
                                            </button>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-xs font-mono text-white border border-white/10 z-10 shadow-lg">
                                        {scene.timestamp}
                                    </div>
                                </div>
                            </div>

                            {/* Content Section - NOW BELOW THE IMAGE */}
                            <div className="w-full flex flex-col bg-zinc-900">
                                <div className="p-6 space-y-4">
                                    
                                    {/* Script Text */}
                                    <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <Mic size={16} className="text-zinc-400" />
                                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Script Segment</span>
                                            </div>
                                            <button 
                                                onClick={() => copySceneText(idx, scene.originalText)}
                                                className="text-[10px] flex items-center gap-1 text-zinc-500 hover:text-white transition-colors bg-zinc-800 px-3 py-1.5 rounded-md hover:bg-zinc-700"
                                            >
                                                {sceneNarrationCopied[idx] ? <Check size={12} /> : <Copy size={12} />} Copy Text
                                            </button>
                                        </div>
                                        <p className="text-base text-white font-medium font-sans leading-relaxed whitespace-pre-wrap">
                                            "{scene.originalText}"
                                        </p>
                                    </div>

                                    {/* Visual Description */}
                                    <div className="pl-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Layers size={16} className="text-blue-500"/>
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Visual Direction</span>
                                        </div>
                                        <p className="text-sm text-zinc-400 leading-relaxed pl-4 border-l-2 border-zinc-800">{scene.visual}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Sidebar: Cover Generator */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-1 overflow-hidden shadow-lg sticky top-24">
                {coverUrl ? (
                    <div className={`relative group w-full ${ratioClass}`}>
                        <img src={coverUrl} alt="Main Cover" className="w-full h-full object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={coverUrl} download="cover.png" className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform">
                                <Download size={16} /> Save Cover
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className={`w-full ${ratioClass} bg-zinc-950 rounded-xl flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-zinc-800 group hover:border-purple-500/30 transition-colors`}>
                        <ImageIcon size={48} className="text-zinc-700 mb-4 group-hover:text-purple-500/50 transition-colors" />
                        <p className="text-zinc-500 text-sm mb-6">Generate a cinematic cover ({data.aspectRatio}).</p>
                        <button 
                            onClick={handleGenerateCover}
                            disabled={loadingCover}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg"
                        >
                            {loadingCover ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <ImageIcon size={16} />
                            )}
                            Generate Cover
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};