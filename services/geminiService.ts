import { GoogleGenAI, Type } from "@google/genai";
import { ScriptRequest, ScriptResponse } from "../types";

// Helper function to clean markdown code blocks from JSON string
const cleanJsonString = (text: string): string => {
  if (!text) return "{}";
  let clean = text.trim();
  
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  } else {
    if (clean.startsWith("```json")) {
        clean = clean.replace(/^```json/, "").replace(/```$/, "");
    } else if (clean.startsWith("```")) {
        clean = clean.replace(/^```/, "").replace(/```$/, "");
    }
  }
  
  return clean.trim();
};

const scriptSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The project title." },
    body: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING, description: "Estimated timestamp (e.g. 0:00-0:05)" },
          originalText: { type: Type.STRING, description: "The EXACT segment of text from the source script corresponding to this scene. DO NOT change words." },
          visual: { type: Type.STRING, description: "Visual direction for the scene." },
          imagePrompt: { 
            type: Type.STRING, 
            description: "Detailed image prompt. VISUAL RULES: 1. START WITH CHARACTER DESCRIPTION. 2. DYNAMIC ACTION (No static standing). 3. SINGLE SCENE (No Split Screen)." 
          },
          bubbleText: {
            type: Type.STRING,
            description: "Extract 1-3 KEYWORDS ONLY from 'originalText' for the bubble."
          },
          emotionColor: {
            type: Type.STRING,
            description: "The specific color for the speech bubble based on emotion. Ex: 'Bright Red' (Anger), 'Electric Blue' (Shock), 'Dark Grey' (Sadness), 'Vibrant Yellow' (Happy), 'White' (Neutral)."
          }
        },
        required: ["timestamp", "originalText", "visual", "imagePrompt"],
      },
    },
    imagePrompt: { type: Type.STRING, description: "Main cover thumbnail prompt." },
  },
  required: ["title", "body", "imagePrompt"],
};

export const generateScript = async (request: ScriptRequest, apiKey: string): Promise<ScriptResponse> => {
  if (!apiKey) throw new Error("API Key is missing. Please enter your Gemini API Key.");
  
  const ai = new GoogleGenAI({ apiKey });

  const bubbleInstruction = request.includeBubbleText
    ? "EXTRACT 'bubbleText' (Max 2-4 words) directly from 'originalText'. DETERMINE 'emotionColor' based on the sentiment of the text."
    : "Return empty string for 'bubbleText'.";

  const titleInstruction = request.coverTitle
    ? `IMPORTANT: The user provided a specific Cover Title: "${request.coverTitle}". You MUST set the 'title' field to "${request.coverTitle}". The 'imagePrompt' for the cover MUST explicitly ask for the text "${request.coverTitle}" to be rendered in LARGE BOLD NEON WHITE FONT in the center of the image.`
    : `Generate a punchy title based on the script. The 'imagePrompt' for the cover must include this title in LARGE BOLD NEON WHITE FONT centered.`;

  // Construct Content Parts
  const contentParts: any[] = [];
  
  // 1. Text Prompt
  let promptText = `
    You are an expert Visual Director and Storyboard Artist.
    
    TASK:
    1. Read the provided RAW SCRIPT below.
    2. Break it down into logical visual scenes.
    3. For each scene, fill the 'originalText' field with the EXACT text segment from the source.
    4. Generate a 'visual' description and an 'imagePrompt' for each scene.
    
    SOURCE SCRIPT:
    """
    ${request.scriptContent}
    """
  `;

  // 2. Handle Character Image (Consistency)
  if (request.characterImage) {
    promptText += `
    CRITICAL VISUAL INSTRUCTION:
    I have provided an image of the MAIN CHARACTER.
    1. First, ANALYZE this character's physical appearance (Gender, Age, Hair, Clothing, Distinctive features).
    2. Then, for EVERY 'imagePrompt' you generate in the 'body', you MUST START with this specific description.
    3. Example: "A young woman with blue neon hair and leather jacket [Action...]"
    4. This is to ensure CHARACTER CONSISTENCY across all scenes.
    `;
    
    // Clean base64 string
    const base64Data = request.characterImage.split(',')[1];
    
    // Add Image Part
    contentParts.push({
      inlineData: {
        mimeType: 'image/png', // Assumes PNG or compatible type from frontend
        data: base64Data
      }
    });
  }

  promptText += `
    VISUAL DIRECTIVES (STRICT):
    - ASPECT RATIO TARGET: ${request.aspectRatio}. Frame the shot accordingly.
    - DYNAMIC ACTION RULE: Characters MUST be active, showing emotion, or moving. STRICTLY FORBIDDEN: Static standing poses looking at camera.
    - SINGLE LENS PROTOCOL: Describe ONE unified camera shot. Do not describe split screens, panels, or collages.
    - FRAMING: Ensure subject is centered with negative space for text overlays.
    
    COVER RULES:
    - ${titleInstruction}

    FEATURE CONTROLS:
    - ${bubbleInstruction}

    Output format: JSON matching the schema.
  `;

  // Add the text prompt part
  contentParts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: { parts: contentParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: scriptSchema,
        systemInstruction: "You are a Cinematic Visual Director. You maintain strict character consistency based on provided reference images.",
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    const cleanJson = cleanJsonString(jsonText);
    const parsed = JSON.parse(cleanJson) as ScriptResponse;
    
    // Attach the requested aspect ratio to the response so the UI knows how to render it
    parsed.aspectRatio = request.aspectRatio;
    
    return parsed;
  } catch (error) {
    console.error("Error generating storyboard:", error);
    throw error;
  }
};

export const generateThumbnail = async (
  prompt: string, 
  aspectRatio: string = "9:16", 
  mode: 'cover' | 'scene' = 'scene',
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    let compositionRules = "";

    if (mode === 'cover') {
      // RULES FOR MAIN COVER (With Neon Title)
      compositionRules = `
      STRICT VISUAL COMPOSITION RULES (COVER):
      1. SINGLE FULL-FRAME IMAGE ONLY. NO SPLIT SCREENS. NO COLLAGES.
      2. ONE CAMERA LENS ONLY.
      3. TEXT PLACEMENT: DEAD CENTER. 20% Margin from edges.
      4. TEXT STYLE: LARGE BOLD NEON WHITE SANS-SERIF.
      5. Action: Subject must be expressive.
      `;
    } else {
      // RULES FOR SCENES (Clean or Bubble only)
      compositionRules = `
      STRICT VISUAL COMPOSITION RULES (SCENE):
      1. SINGLE FULL-FRAME IMAGE ONLY. NO SPLIT SCREENS. NO COLLAGES.
      2. ONE CAMERA LENS ONLY. One unified scene.
      3. ACTION: Subject must be expressive and dynamic. NO static poses.
      4. DO NOT add any title text or captions unless explicitly asked in the prompt.
      5. FOCUS: Cinematic lighting and character emotion.
      `;
    }

    const stablePrompt = `
    ${prompt} 
    
    ${compositionRules}
    
    ASPECT RATIO: The output must be optimized for ${aspectRatio}.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: stablePrompt }],
      },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio, // Dynamic ratio passed from UI
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    throw error;
  }
};