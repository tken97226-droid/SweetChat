import { MODEL_OPTIONS, DEFAULT_MODEL } from './config.js';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const FALLBACK_STATUSES = new Set([400, 404, 408, 429, 500, 502, 503, 504]);

function formatApiError(data, status) {
  return data?.error?.message || data?.error?.status || `Gemini API HTTP ${status}`;
}

export async function sendChatMessage(apiKey, selectedModel, systemPrompt, messagesHistory, options = {}) {
  if (!apiKey) {
    throw new Error('Gemini API Key မရှိသေးပါ။ Settings ထဲမှာ Google AI Studio API Key ထည့်ပေးပါ။');
  }

  const history = (messagesHistory || [])
    .slice(-24)
    .map(message => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(message.content || '') }]
    }))
    .filter(message => message.parts[0].text.trim());

  if (!history.length || history[history.length - 1].role !== 'user') {
    throw new Error('ပို့မယ့် User message မတွေ့ပါ။ ပြန်စမ်းကြည့်ပါ။');
  }

  const preferred = MODEL_OPTIONS.some(model => model.id === selectedModel)
    ? selectedModel
    : DEFAULT_MODEL;

  // Start with the user's selected model, then try each remaining configured model once.
  const modelOrder = [
    preferred,
    ...MODEL_OPTIONS.map(model => model.id).filter(id => id !== preferred)
  ];

  let lastError = 'Gemini model တစ်ခုမှ အဖြေမပေးနိုင်ပါ။';
  const attempts = [];

  for (const model of modelOrder) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(
        `${API_BASE}${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: String(systemPrompt || '') }]
            },
            contents: history,
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 900
            }
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        lastError = formatApiError(data, response.status);
        attempts.push(`${model}: ${lastError}`);

        // Invalid credentials or key permissions cannot be fixed by changing models.
        if (
          response.status === 401 ||
          response.status === 403 ||
          /API_KEY_INVALID|invalid api key|API key not valid/i.test(lastError)
        ) {
          throw new Error(lastError);
        }

        if (FALLBACK_STATUSES.has(response.status)) continue;
        throw new Error(lastError);
      }

      const candidate = data.candidates?.[0];
      const reply = (candidate?.content?.parts || [])
        .map(part => part.text || '')
        .join('')
        .trim();

      if (reply) {
        return reply;
      }

      lastError = candidate?.finishReason
        ? `Model ${model}: အဖြေမပြန်နိုင်ပါ (${candidate.finishReason})`
        : `Model ${model}: စာသားအဖြေ မရရှိပါ။`;
      attempts.push(`${model}: ${lastError}`);

    } catch (error) {
      if (error.name === 'AbortError') {
        lastError = `${model}: တုံ့ပြန်ချိန် ၆၀ စက္ကန့်ကျော်သွားပါတယ်။`;
        attempts.push(lastError);
        continue;
      }

      // Network failures may be temporary; try the next configured model.
      if (error instanceof TypeError) {
        lastError = `${model}: Network error — ${error.message}`;
        attempts.push(lastError);
        continue;
      }

      // Credential and other non-fallback errors are surfaced immediately.
      if (/API key|API_KEY_INVALID|permission|unauthorized|forbidden/i.test(error.message)) {
        throw error;
      }

      lastError = error.message || lastError;
      attempts.push(`${model}: ${lastError}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(
    `Gemini Model ၆ မျိုးလုံး စမ်းပြီးပါပြီ။ နောက်ဆုံးအမှား: ${lastError}`
  );
}

export async function checkGeminiModels(apiKey) {
  if (!apiKey) throw new Error('Gemini API Key အရင်ထည့်ပါ။');

  const response = await fetch(`${API_BASE.replace('/models/', '/models')}`, {
    headers: { 'x-goog-api-key': apiKey }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(formatApiError(data, response.status));
  }

  const available = new Set(
    (data.models || [])
      .filter(model => (model.supportedGenerationMethods || []).includes('generateContent'))
      .map(model => model.name?.replace(/^models\//, ''))
  );

  return MODEL_OPTIONS.map(model => ({
    ...model,
    available: available.has(model.id)
  }));
}
