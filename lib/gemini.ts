import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Get Gemini model instance for recipe generation
 */
export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

/**
 * Generate recipes using Gemini AI
 * @param prompt - The formatted prompt for recipe generation
 * @returns Generated recipe content
 */
export async function generateRecipe(prompt: string): Promise<string> {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to generate recipe: ${errorMessage}`);
  }
}

/**
 * Test Gemini API connection
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const testPrompt =
      "Generate a simple recipe for scrambled eggs in JSON format with ingredients and instructions.";
    const result = await generateRecipe(testPrompt);
    return result.length > 0;
  } catch (error) {
    console.error("Gemini connection test failed:", error);
    return false;
  }
}
