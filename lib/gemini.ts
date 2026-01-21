import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 4,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

// Error codes that should trigger a retry
const RETRYABLE_ERROR_CODES = [
  503, // Service Unavailable
  429, // Too Many Requests (Rate Limit)
  500, // Internal Server Error
  502, // Bad Gateway
  504, // Gateway Timeout
];

/**
 * Check if an error is retryable based on its message or status code
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  // Check for specific status codes in the error message
  for (const code of RETRYABLE_ERROR_CODES) {
    if (message.includes(`${code}`) || message.includes(`[${code}`)) {
      return true;
    }
  }

  // Check for common retryable error messages
  const retryableMessages = [
    'overloaded',
    'rate limit',
    'too many requests',
    'service unavailable',
    'temporarily unavailable',
    'try again later',
    'timeout',
    'econnreset',
    'enotfound',
    'etimedout',
  ];

  return retryableMessages.some(msg => message.includes(msg));
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number): number {
  // Exponential backoff
  const exponentialDelay = RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, RETRY_CONFIG.maxDelayMs);

  // Add jitter (±25% randomization to avoid thundering herd)
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);

  return Math.round(cappedDelay + jitter);
}

/**
 * Get Gemini model instance for recipe generation
 */
export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * Generate recipes using Gemini AI with retry logic
 * @param prompt - The formatted prompt for recipe generation
 * @returns Generated recipe content
 */
export async function generateRecipe(prompt: string): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const model = getGeminiModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Log Gemini token usage
      const usageMetadata = response.usageMetadata;
      if (usageMetadata) {
        console.log("🔢 Gemini Token Usage:");
        console.log(`   Input tokens:  ${usageMetadata.promptTokenCount}`);
        console.log(`   Output tokens: ${usageMetadata.candidatesTokenCount}`);
        console.log(`   Total tokens:  ${usageMetadata.totalTokenCount}`);
      }

      // Log success after retry
      if (attempt > 0) {
        console.log(`✅ Gemini API succeeded on attempt ${attempt + 1}`);
      }

      return text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < RETRY_CONFIG.maxRetries && isRetryableError(error)) {
        const delay = calculateDelay(attempt);
        console.warn(`⚠️ Gemini API error (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}): ${lastError.message}`);
        console.log(`   Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      // No more retries or non-retryable error
      break;
    }
  }

  // All retries exhausted or non-retryable error
  console.error("❌ Gemini API Error (all retries exhausted):", lastError);
  const errorMessage = lastError?.message || "Unknown error";
  throw new Error(`Failed to generate recipe: ${errorMessage}`);
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
