import { DeepgramClient } from "@deepgram/sdk";

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

if (!deepgramApiKey) {
  throw new Error("DEEPGRAM_API_KEY is not set in the environment variables.");
}

// In @deepgram/sdk v5, the client is initialized via the DeepgramClient class
const deepgram = new DeepgramClient({ apiKey: deepgramApiKey });

/**
 * Transcribes an audio blob/buffer using Deepgram's Nova-2 model.
 */
export async function transcribeAudio(buffer: Buffer, mimetype: string): Promise<string> {
  // In @deepgram/sdk v5, the structure is listen.v1.media.transcribeFile
  // Awaiting transcribeFile returns the body directly (MediaTranscribeResponse)
  const result = await deepgram.listen.v1.media.transcribeFile(
    buffer,
    {
      model: "nova-2",
      smart_format: true,
      filler_words: false,
      punctuate: true,
    }
  );

  // Type guard or cast to access results, as MediaTranscribeResponse is a union
  // with ListenV1AcceptedResponse (which doesn't have results).
  if (result && 'results' in result) {
    const transcript = (result as any).results?.channels[0]?.alternatives[0]?.transcript || "";
    return transcript;
  }

  return "";
}
