import { GoogleGenAI, Type } from "@google/genai";
import { UploadedImage, SceneTemplate } from "../types";

const MODEL_NAME_IMAGE = 'gemini-3-pro-image-preview'; 
const MODEL_NAME_VISION = 'gemini-2.5-flash'; // Good for receipt analysis

export const generateSelfie = async (
  userImage: UploadedImage,
  celebImages: UploadedImage[],
  template: SceneTemplate,
  customInstructions?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Define environment descriptions with "Raw/Amateur" context descriptors
  const sceneDescriptions: Record<SceneTemplate, string> = {
    'Pakistani House Event': 'a chaotic but happy Pakistani wedding/dholki event. Lighting is a mix of warm yellow decorative bulbs and harsh camera flash. Background has floral garlands (marigold).',
    'Dhaba': 'a roadside Dhaba at night. Lighting is harsh fluorescent tube lights and warm tungsten bulbs. Background has steam, charpoys, and steel cups.',
    'Rooftop': 'a windy rooftop at night. Direct flash photography style. Background is dark city bokeh with grain/noise.',
    'Street': 'a busy street in Lahore or Karachi during the day. Harsh natural sunlight, hard shadows, realistic street dust/haze.',
    'Mall': 'inside a bright shopping mall. Cool white fluorescent lighting. Reflections on glass behind.',
    'New York': 'Times Square or NYC street. Ambient neon lighting reflecting on skin. Slightly grainy night shot.',
    'Switzerland': 'Outdoor mountain sunlight. High contrast, sharp shadows, wind in hair. Authentic travel photo vibe.',
    'Movie Set': 'Behind the scenes on a set. Lighting is messy, mix of studio lights and shadows. Industrial background.',
    'Press Conference': 'Media wall background. Harsh, direct flash lighting on faces. High contrast.',
    'Random Encounter': 'Inside a coffee shop or airport. Overhead ceiling lights. Casual, impromptu vibe.',
    'Award Show': 'Red carpet event. Intense flash photography causing "red eye" effect or shiny skin. Dark background.',
    'Concert Backstage': 'Dimly lit corridor. High ISO noise, grainy, low light environment with red/blue ambient hues.'
  };

  const sceneContext = sceneDescriptions[template] || sceneDescriptions['Pakistani House Event'];

  // Prepare prompt
  const promptText = `
    Generate a photorealistic, raw, amateur photo from the perspective of a front-facing smartphone camera (Selfie POV).
    
    Subject: The people from the reference images.
    Setting: ${sceneContext}

    ${customInstructions ? `**USER CUSTOM INSTRUCTIONS**: ${customInstructions}` : ''}
    
    --------------------------------------------------------------------------------
    CRITICAL CONSTRAINT: NO VISIBLE PHONES OR CAMERAS
    --------------------------------------------------------------------------------
    1. The camera is INVISIBLE. It is the "eye" of the viewer.
    2. DO NOT render the phone itself.
    3. DO NOT render a mirror reflection showing a phone.
    4. To prevent the "holding phone" look, make sure the user's hands are either:
       - Doing a Peace Sign (V sign)
       - Thumbs up
       - Hugging the celebrity (arm around shoulder)
       - Resting at their side (out of frame)
    5. If a hand is raised, it MUST be empty and making a gesture.
    --------------------------------------------------------------------------------

    STYLE GUIDE (RAW & REALISTIC):
    - **Style**: "iPhone Front Camera" quality. The image must look like a real photo taken by a human, NOT digital art.
    - **Imperfections**: Add digital noise, film grain, and slight JPEG artifacts. Skin texture must be visible (pores, slight unevenness). DO NOT airbrush or smooth the skin.
    - **Lighting**: Use realistic, somewhat "messy" lighting. If indoors/night, simulate "Direct Flash" look (hard shadows behind the head, shiny skin highlights).
    - **Composition**: Intimate, close-up, wide-angle distortion typical of front cameras.
    
    IDENTITY PRESERVATION:
    - The first image provided is the USER (Selfie taker). They must be in the foreground, closest to the camera.
    - The other images are CELEBRITIES. They should be right next to the user.
    - You MUST preserve the exact facial identity of all subjects. Do not beautify them. Keep their natural features.

    Final Output: A realistic, slightly imperfect, grainy social media photo.
  `;

  // Prepare parts
  const parts: any[] = [
    { text: promptText },
    {
      inlineData: {
        mimeType: userImage.mimeType,
        data: userImage.base64,
      },
    },
    ...celebImages.map((img) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    })),
  ];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME_IMAGE,
      contents: { parts: parts },
      config: {
        imageConfig: {
            aspectRatio: "3:4",
            imageSize: "1K", // 1K often yields sharper, less 'AI-smoothed' textures than higher res for this specific model
        },
      },
    });

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data found in response.");
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export interface VerificationResult {
    verified: boolean;
    confidence: number;
    reason: string;
    transactionId: string;
    senderName: string;
    timestamp: string;
    isEdited: boolean;
}

export const verifyPaymentReceipt = async (
  receiptImage: UploadedImage, 
  expectedAmount: number
): Promise<VerificationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const minAmount = expectedAmount - 100;
  const maxAmount = expectedAmount + 100;

  const prompt = `
    Act as a Forensic Document Examiner. Analyze this payment receipt screenshot (JazzCash, Easypaisa, Nayapay, or Bank) for approximately ${expectedAmount} PKR.
    
    Step 1: Validation
    - Check if the amount is between ${minAmount} and ${maxAmount}.
    - Extract the Transaction ID (TID/Trx ID).
    - Extract the Sender Name (if visible).
    - Extract the precise Date and Time string shown on the receipt.

    Step 2: Forensic Analysis for Forgery
    - **Font Consistency**: Check if the Transaction ID font matches exactly with other numbers/text on the screen. Edited IDs often use a slightly different font weight or size.
    - **Alignment**: Is the Transaction ID perfectly aligned?
    - **Artifacts**: Look at the background specifically behind the Transaction ID. Is there pixelation, blurring, or color inconsistency that suggests someone erased the old ID and typed a new one?
    
    Return JSON:
    - verified: boolean (true ONLY if amount is correct AND it looks authentic).
    - confidence: number (0-100).
    - reason: string (Explanation).
    - transactionId: string (The ID found, or "UNKNOWN").
    - senderName: string (Or "UNKNOWN").
    - timestamp: string (The date/time string found, e.g. "23 Oct, 10:30 PM", or "UNKNOWN").
    - isEdited: boolean (Set to true if you detect ANY signs of digital manipulation, font mismatch, or background patching around the ID).
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME_VISION,
      contents: {
        parts: [
          { text: prompt },
          {
             inlineData: {
               mimeType: receiptImage.mimeType,
               data: receiptImage.base64
             }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verified: { type: Type.BOOLEAN },
            confidence: { type: Type.INTEGER },
            reason: { type: Type.STRING },
            transactionId: { type: Type.STRING },
            senderName: { type: Type.STRING },
            timestamp: { type: Type.STRING },
            isEdited: { type: Type.BOOLEAN }
          },
          required: ["verified", "confidence", "reason", "transactionId", "senderName", "timestamp", "isEdited"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from verification AI");
    return JSON.parse(text);
  } catch (e) {
    console.error("Verification failed", e);
    return { 
        verified: false, 
        confidence: 0, 
        reason: "AI Analysis failed", 
        transactionId: "UNKNOWN",
        senderName: "UNKNOWN",
        timestamp: "UNKNOWN",
        isEdited: false
    };
  }
};