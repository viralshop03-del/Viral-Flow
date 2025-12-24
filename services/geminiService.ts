import { GoogleGenAI, Type } from "@google/genai";
import { ScriptRequest, ScriptResponse, ScriptScene } from "../types";

// FITUR PENGUAT JARINGAN: Smart Retry Logic
// Jika koneksi internet pengguna tidak stabil atau server sibuk, 
// fungsi ini akan otomatis mencoba ulang permintaan hingga 3x.
const withNetworkRetry = async <T>(
  operation: () => Promise<T>, 
  retries: number = 3, 
  delay: number = 2000
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (retries <= 0) throw error;
    
    // Deteksi error jaringan atau overload
    console.warn(`Gangguan jaringan terdeteksi. Mencoba menghubungkan ulang... Sisa percobaan: ${retries}`);
    
    // Tunggu sejenak sebelum mencoba lagi (Backoff strategy)
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return withNetworkRetry(operation, retries - 1, delay * 1.5);
  }
};

const cleanJsonString = (text: string): string => {
  if (!text) return "{}";
  let clean = text.trim();
  // PERBAIKAN: Menggunakan indexOf yang benar (bukan index4Of)
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  return clean;
};

const scriptSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Judul proyek yang viral dan clickbait." },
    body: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING, description: "Waktu (detik) yang cepat dan padat." },
          originalText: { type: Type.STRING, description: "Isi narasi." },
          visual: { type: Type.STRING, description: "Deskripsi visual sinematik." },
          imagePrompt: { type: Type.STRING },
          bubbleText: { type: Type.STRING, description: "Kata kunci penarik perhatian (1-3 kata)." },
          emotionColor: { type: Type.STRING },
          mangaExpression: { type: Type.STRING },
          transition: { type: Type.STRING }
        },
        required: ["timestamp", "originalText", "visual", "imagePrompt", "bubbleText", "emotionColor", "mangaExpression", "transition"],
      },
    },
    imagePrompt: { type: Type.STRING },
    analysis: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "Skor Viralitas (0-100)." },
        hookStrength: { type: Type.STRING, description: "Analisis kekuatan hook." },
        emotionalAppeal: { type: Type.STRING },
        retentionPrediction: { type: Type.STRING },
        improvementTips: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "hookStrength", "emotionalAppeal", "retentionPrediction", "improvementTips"]
    }
  },
  required: ["title", "body", "imagePrompt", "analysis"],
};

export const generateScript = async (request: ScriptRequest): Promise<ScriptResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const mode = request.optimizationMode || 'strict';

  const contentParts: any[] = [];
  let promptText = `
    Anda adalah Pakar Algoritma TikTok & Script Doctor Kelas Dunia.
    
    INPUT USER:
    "${request.scriptContent}"

    TUGAS UTAMA: Analisis skrip dan buat storyboard.

    MODE OPERASI: ${mode === 'strict' ? 'PERTAHANKAN TEKS ASLI (STRICT)' : 'OPTIMASI VIRAL (REWRITE)'}

    ${mode === 'strict' 
      ? `
        INSTRUKSI KHUSUS (STRICT MODE):
        1. **JANGAN UBAH TEKS NARASI PENGGUNA**. Gunakan teks input user secara VERBATIM (kata per kata) di kolom 'originalText'.
        2. Tugas Anda HANYA memecah teks tersebut menjadi scene (timestamp), menambahkan deskripsi visual, dan menganalisis skor.
        3. Jika ada kata kasar/terlarang, JANGAN sensor di mode ini, tapi beri peringatan di bagian 'analysis.improvementTips'.
        4. Berikan SKOR JUJUR. Jika skrip membosankan, beri skor rendah.
      ` 
      : `
        INSTRUKSI KHUSUS (VIRAL MODE):
        1. **TULIS ULANG (REWRITE)** skrip pengguna agar Potensi FYP mencapai 100%.
        2. GANTI Hook yang lemah dengan Hook yang menohok.
        3. PERBAIKI Pacing agar cepat dan padat.
        4. **SAFETY GUARD**: Deteksi kata terlarang (Bunuh, Mati, Darah, dll) dan ganti dengan bahasa halus (Algospeak) agar aman dari banned.
        5. **VISUAL UPGRADE**: Ubah total deskripsi 'visual' dan 'imagePrompt'. Buat visual menjadi lebih DRAMATIS, MAHAL, dan SINEMATIK. Jangan gunakan visual standar dari input asli jika membosankan.
        6. Pastikan skrip akhir jauh lebih menarik dari input asli.
      `
    }

    OUTPUT JSON STRUCTURE:
    - 'originalText': Teks narasi (Asli atau Rewritten tergantung Mode).
    - 'analysis.score': Skor Viralitas (0-100).
    - 'visual': Deskripsi visual level film 8K.
    
    Pastikan output valid JSON dan ikuti schema.
  `;

  if (request.characterImage) {
    const matches = request.characterImage.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
      contentParts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
      promptText += `\nIkuti penampilan karakter ini secara ketat dalam gaya sinematik realistis.`;
    }
  }

  contentParts.push({ text: promptText });

  try {
    // Menggunakan withNetworkRetry untuk memperkuat koneksi saat request ke AI
    const response = await withNetworkRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: { parts: contentParts },
        config: {
          responseMimeType: "application/json",
          responseSchema: scriptSchema as any,
          temperature: mode === 'strict' ? 0.3 : 0.85, 
        },
      });
    });

    const jsonText = response.text || "{}";
    const parsed = JSON.parse(cleanJsonString(jsonText)) as ScriptResponse;
    
    if (parsed.body) {
      parsed.body = parsed.body.map((scene: any) => ({
        ...scene,
        bubbleText: typeof scene.bubbleText === 'object' ? (scene.bubbleText.text || JSON.stringify(scene.bubbleText)) : String(scene.bubbleText || ""),
        emotionColor: typeof scene.emotionColor === 'object' ? (scene.emotionColor.hex || scene.emotionColor.color || "#ffffff") : String(scene.emotionColor || "#ffffff"),
      }));
    }
    
    parsed.aspectRatio = request.aspectRatio;
    return parsed;
  } catch (error: any) {
    console.error("Kesalahan Pembuatan Skrip:", error);
    throw error;
  }
};

export const generateThumbnail = async (
  prompt: string, 
  aspectRatio: string = "1:1", 
  mode: 'cover' | 'scene' = 'scene',
  referenceImage?: string | null,
  cinematicMode: boolean = true // Mode default ON
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const parts: any[] = [];

    // RULES VISUAL CINEMATIC
    const cinematicRules = cinematicMode 
      ? "cinematic long exposure, heavy motion blur on moving objects, high-speed blur, dynamic streaks of light, fast-paced action style, motion lines."
      : "clean, sharp focus, static image, no blur, crystal clear, high detailed still photography, freeze frame, perfect focus.";
    
    // BASE PROMPT - KUALITAS
    let fullPrompt = `
      [MASTERPIECE] [8K UHD] [RAW PHOTO]
      Style: Cinematic, Ultra-Realistic, Hasselblad X2D 100C quality.
      Visual Effect: ${cinematicRules}
      
      SCENE DESCRIPTION:
      ${prompt}
    `.trim();

    // LOGIKA KHUSUS JIKA ADA GAMBAR REFERENSI
    if (referenceImage) {
      const matches = referenceImage.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
        
        // INSTRUKSI AGRESIF UNTUK MENGABAIKAN POSE
        fullPrompt = `
          *** INSTRUKSI PENTING: REFERENSI WAJAH SAJA ***
          Gambar yang dilampirkan HANYA untuk referensi wajah/identitas karakter.
          
          DILARANG KERAS meniru pose, sudut pandang, atau background dari gambar referensi.
          
          WAJIB IKUTI AKSI DI TEKS:
          Jika teks berkata "BERLARI", karakter HARUS berlari (jangan diam).
          Jika teks berkata "MENANGIS", karakter HARUS menangis.
          Jika teks berkata "BERTARUNG", karakter HARUS dalam pose tempur dinamis.
          
          Gunakan struktur wajah dari gambar, tapi tempelkan pada tubuh yang sedang melakukan aksi: "${prompt}".
          Buat Pori-pori kulit terlihat nyata (Hyper-detailed skin texture).
        `;
      }
    } else {
      // Jika tidak ada referensi, tambahkan detail umum
      fullPrompt += `\nBuat terlihat SEPERTI HIDUP (LIFELIKE). Fokus Mata Tajam. Depth of Field sinematik.`;
    }
    
    // Bubble Logic - UPDATED: LOCKED STYLE (LEDAKAN/PIJAR) & POSITION (TENGAH)
    if (prompt.includes("Bubble") || prompt.includes("Gelembung") || prompt.includes("LEDAKAN PIJAR")) {
      fullPrompt += `
        . INSTRUKSI BUBBLE MANGA (WAJIB):
        1. BENTUK: Gunakan bentuk "LEDAKAN PIJAR" (Jagged/Spiky Manga Shout Bubble) yang ekstrim dan tajam.
        2. POSISI: Letakkan di TENGAH (CENTER), sangat dekat dengan kepala/mulut karakter. JANGAN di pojok/pinggir layar.
        3. WARNA: Warna background bubble HARUS MENCOLOK (Vibrant) sesuai emosi adegan (Merah=Marah, Biru=Sedih, Kuning=Kaget).
        4. ESTETIKA: Terlihat seperti halaman Manga Premium berwarna.
      `;
    }

    parts.push({ text: fullPrompt });

    // Menggunakan withNetworkRetry untuk memperkuat koneksi saat generate gambar
    const response = await withNetworkRetry(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts },
        config: { 
          imageConfig: { 
            aspectRatio: aspectRatio as any
          } 
        },
      });
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Tidak ada data gambar dalam respons");
  } catch (error: any) {
    console.error("Kesalahan Gambar:", error);
    throw error;
  }
};