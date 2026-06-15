import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// shared/ is agents/shared/, .env is at casper-rwa-court/.env (3 levels up)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function askJuror(systemPrompt: string, userPrompt: string) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    temperature: 0.2, // Low temperature for consistent reasoning
  });

  const content = chatCompletion.choices[0]?.message?.content || '{}';
  console.log(`[DEBUG Groq] Content: >>>${content}<<<`);
  
  try {
    return JSON.parse(content);
  } catch (err: any) {
    console.error(`[DEBUG Groq] JSON parse error: ${err.message}`);
    throw err;
  }
}
