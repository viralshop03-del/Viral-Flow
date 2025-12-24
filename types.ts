
export interface ScriptRequest {
  scriptContent: string;
  coverTitle?: string; // Optional manual title for the cover
  includeBubbleText: boolean; // Toggle for comic bubbles
  characterImage?: string | null; // Base64 string of the reference character
  aspectRatio: string; // "9:16", "16:9", "1:1", etc.
  optimizationMode: 'strict' | 'viral'; // 'strict' = keep original text, 'viral' = rewrite for FYP
}

export interface ScriptScene {
  timestamp: string; // Estimated timing
  originalText: string; // The EXACT segment from the user's script
  visual: string; // Description of the scene
  imagePrompt: string; // The prompt for the image generator
  bubbleText: string; // Extracted keyword from originalText
  emotionColor: string; // Color mood
  mangaExpression?: string; // Facial and body action detail
  transition: string; // New field for transition effects
}

export interface ViralAnalysis {
  score: number; // 0-100
  hookStrength: string;
  emotionalAppeal: string;
  retentionPrediction: string;
  improvementTips: string[];
}

export interface ScriptResponse {
  title: string; // Inferred title from script
  body: ScriptScene[]; // The storyboard
  imagePrompt: string; // The prompt for the main cover
  aspectRatio: string; // Store the ratio used for this generation
  analysis: ViralAnalysis; // Viral potential breakdown
}

export interface ThumbnailRequest {
  prompt: string;
}

export interface SavedProject {
  id: string;
  timestamp: number;
  title: string;
  data: {
    scriptContent: string;
    coverTitle: string;
    includeBubble: boolean;
    characterImage: string | null;
    aspectRatio: string;
    result: ScriptResponse | null;
  };
}
