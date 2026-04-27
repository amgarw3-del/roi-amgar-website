import { GoogleGenerativeAI } from "@google/generative-ai";

// סדר עדיפויות — מנסה כל מודל עד שאחד עובד
const MODEL_FALLBACKS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-001"];

export async function callGemini(
  systemInstruction: string,
  userPrompt: string,
  options: { maxOutputTokens?: number; temperature?: number; json?: boolean } = {}
): Promise<string> {
  const { maxOutputTokens = 4000, temperature = 0.7, json = true } = options;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY לא מוגדר");

  const genai = new GoogleGenerativeAI(apiKey);
  let lastError: unknown;

  for (const modelName of MODEL_FALLBACKS) {
    try {
      const model = genai.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          ...(json ? { responseMimeType: "application/json" } : {}),
          maxOutputTokens,
          temperature,
        },
      });
      const result = await model.generateContent(userPrompt);
      return result.response.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes("503") || msg.includes("429") || msg.includes("overloaded") || msg.includes("unavailable");
      lastError = err;
      if (!isRetryable) throw err;
      // המשך לנסות מודל הבא
    }
  }

  throw lastError;
}
