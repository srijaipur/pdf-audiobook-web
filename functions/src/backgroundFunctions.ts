import * as admin from "firebase-admin";

/**
 * Lazy-load OpenAI in a way compatible with:
 * - TypeScript CommonJS output
 * - Firebase Functions
 * - Node 24
 */
async function getOpenAIClient() {
  const OpenAIModule = await import("openai");

  const OpenAI =
    OpenAIModule.default || OpenAIModule;

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Example background processing function
 */
export async function testOpenAIConnection() {
  try {
    const openai = await getOpenAIClient();

    const models = await openai.models.list();

    console.log("✅ OpenAI connected");
    console.log(models.data[0]);

    return true;
  } catch (err) {
    console.error("❌ OpenAI connection failed:", err);
    return false;
  }
}