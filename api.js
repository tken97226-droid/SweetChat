import { FREE_MODELS } from './config.js';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Google Gemini API ကို အသုံးပြုပြီး Character Chat ပြုလုပ်သည်။
 * ရွေးထားသော Model မအောင်မြင်ပါက FREE_MODELS ထဲမှ နောက် Model များကို စမ်းမည်။
 */
export async function sendChatMessage(apiKey, selectedModel, systemPrompt, messagesHistory = []) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Google AI Studio Gemini API Key ကို Settings ထဲတွင် ထည့်ပေးပါ။');
  }

  const contents = messagesHistory
    .slice(-20)
    .filter(msg => msg && typeof msg.content === 'string' && msg.content.trim())
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

  while (contents.length && contents[0].role !== 'user') {
    contents.shift();
  }

  if (!contents.length) {
    throw new Error('ပို့ရန် User Message မရှိပါ။');
  }

  const modelsToTry = [...new Set([selectedModel, ...FREE_MODELS].filter(Boolean))];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey.trim()
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{
                text: systemPrompt || 'You are an anime character in a roleplay chat. Stay in character.'
              }]
            },
            contents,
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 1024
            }
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.error?.message || `HTTP ${response.status}`;
        lastError = new Error(`[${model}] ${message}`);

        if ([400, 401, 403].includes(response.status)) {
          break;
        }

        continue;
      }

      const replyText = (data.candidates?.[0]?.content?.parts || [])
        .map(part => part.text || '')
        .join('')
        .trim();

      if (replyText) return replyText;

      const finishReason = data.candidates?.[0]?.finishReason;
      lastError = new Error(
        `[${model}] စာပြန်ချက် မရရှိပါ${finishReason ? ` (${finishReason})` : ''}.`
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || 'Gemini Model များထံမှ တုံ့ပြန်မှု မရရှိပါ။');
}
