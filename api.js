import { PROXY_URL, FREE_MODELS } from './config.js';

export async function generateWithFailover(apiKey, contents, systemInstruction) {
  let lastError = null;

  for (const model of FREE_MODELS) {
    const url = `${PROXY_URL}/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (replyText) return replyText;
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} failed, trying next...`, err);
    }
  }

  throw lastError || new Error('မိုဒယ်များအားလုံး တုံ့ပြန်မှု မပေးနိုင်ပါ။');
        }
