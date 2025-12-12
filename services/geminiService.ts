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

  // Define environment descriptions based on template
  const sceneDescriptions: Record<SceneTemplate, string> = {
    'Pakistani House Event': 'a vibrant Pakistani home event (like a Dholki or family gathering), with colorful decor, warm lighting, perhaps some floral arrangements in the background.',
    'Dhaba': 'a lively roadside Dhaba in Pakistan, with charpoys, tea cups, warm string lights, and a rustic outdoor evening atmosphere.',
    'Rooftop': 'a trendy rooftop terrace at sunset/dusk with city lights blurring in the background, cool breeze vibe.',
    'Street': 'a busy, colorful street market in Pakistan, with rickshaws or shop signs faintly visible in the bokeh background.',
    'Mall': 'a modern, bright shopping mall with glass railings and store lights in the background.',
    'New York': 'the busy streets of New York City, perhaps Times Square with blurred neon billboards or a classic NY street corner.',
    'Switzerland': 'a breathtaking Swiss landscape with snow-capped mountains, green valleys, and bright natural daylight.',
    'Movie Set': 'a busy film production set with heavy studio lights, cameras, boom mics visible in the background, possibly a green screen edge or a director chair.',
    'Press Conference': 'a formal media event with microphones in the foreground, branded backdrops behind the subjects, and camera flashes going off.',
    'Random Encounter': 'a casual, candid setting like an airport terminal, a coffee shop, or a sidewalk, looking like a genuine fan encounter.',
    'Award Show': 'a glamorous red carpet event or awards venue with golden lighting, velvet ropes, and paparazzi flashes in the background.',
    'Concert Backstage': 'a dimly lit backstage corridor or dressing room area with roadie cases, stage trusses, and pass laminates visible.'
  };

  const sceneContext = sceneDescriptions[template] || sceneDescriptions['Pakistani House Event'];

  // Prepare prompt
  const promptText = `
    Generate a hyper-realistic group selfie featuring the people from the provided reference images together.
    
    Setting: The location is ${sceneContext}

    ${customInstructions ? `**USER CUSTOM INSTRUCTIONS**: ${customInstructions}` : ''}
    
    Instructions:
    1. **CRITICAL - IDENTITY PRESERVATION**: You must preserve the exact facial features, identity, ethnicity, and likeness of the people in the provided images. **DO NOT CHANGE THEIR FACES.** The person from the first image (user) must look exactly like the reference. The celebrities must look exactly like their reference photos. Do not "beautify" or alter facial structures.
    2. Identify the person in the first image (the user).
    3. Identify the celebrities in the subsequent images.
    4. Create a single cohesive group selfie image featuring the user and the celebrities standing close together.
    5. Style: "Pakistani style selfie" - warm skin tones, vibrant but natural colors, slightly high contrast, depth of field typical of a high-end smartphone front camera.
    6. Camera Angle: The image is a Point of View (POV) shot from the front camera. **DO NOT show the phone or camera device.** The camera is invisible. Hands should be out of frame or gesturing naturally (e.g., peace sign, thumbs up) but NOT holding a visible phone.
    7. Composition: Close-up group shot, heads close together, looking directly at the "lens".
    
    Ensure extremely high fidelity to the faces provided. Blend lighting to match the '${template}' environment perfectly while keeping faces unchanged.
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
            imageSize: "1K",
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