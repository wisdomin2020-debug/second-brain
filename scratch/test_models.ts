import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    console.log("Testing gemini-1.5-flash...");
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: 'Hello, are you there?',
    });
    console.log("Response:", text);
  } catch (err) {
    console.error("Error with gemini-1.5-flash:", err);
  }
}

main();
