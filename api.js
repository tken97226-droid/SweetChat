import {
  DEFAULT_MODEL,
  FREE_MODELS,
  MODEL_COOLDOWN_MS
} from './config.js';

const COOLDOWN_KEY = 'sweetchat_gemini_cooldowns';

function getCooldowns() {
  try {
    return JSON.parse(localStorage.getItem(COOLDOWN_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCooldowns(data) {
  localStorage.setItem(COOLDOWN_KEY, JSON.stringify(data));
}

function isQuotaError(status, message) {
  const text = String(message || '').toLowerCase();

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    text.includes('quota') ||
    text.includes('resource_exhausted') ||
    text.includes('rate limit') ||
    text.includes('too many requests')
  );
}

function getModels(selectedModel) {
  const first = FREE_MODELS.includes(selectedModel)
    ? selectedModel
    : DEFAULT_MODEL;

  const models = [...new Set([first, ...FREE_MODELS])];

  const cooldowns = getCooldowns();
  const now = Date.now();

  Object.keys(cooldowns).forEach(model => {
    if (cooldowns[model] <= now) {
      delete cooldowns[model];
    }
  });

  saveCooldowns(cooldowns);

  const available = models.filter(
    model => !cooldowns[model]
  );

  return available.length ? available : models;
}

export async function sendChatMessage(
  apiKey,
  selectedModel,
  systemPrompt,
  messagesHistory
) {
  if (!apiKey) {
    throw new Error('Gemini API Key ထည့်ပေးပါ။');
  }

  const models = getModels(selectedModel);
  const cooldowns = getCooldowns();

  let lastError = null;

  let contents = (messagesHistory || [])
    .slice(-20)
    .filter(msg =>
      msg &&
      typeof msg.content === 'string' &&
      msg.content.trim()
    )
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

  // Gemini conversation ကို user message နဲ့ စတင်စေမယ်
  while (contents.length && contents[0].role === 'model') {
    contents.shift();
  }

  if (!contents.length || contents[contents.length - 1].role !== 'user') {
    throw new Error('Message မတွေ့ပါ။');
  }

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },

          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: systemPrompt || ''
                }
              ]
            },

            contents: contents,

            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 1024
            }
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          data.error?.message || `HTTP ${response.status}`;

        lastError = new Error(
          `[${model}] ${errorMessage}`
        );

        if (isQuotaError(response.status, errorMessage)) {
          cooldowns[model] =
            Date.now() + MODEL_COOLDOWN_MS;

          saveCooldowns(cooldowns);

          continue;
        }

        if (
          response.status === 404 ||
          response.status === 400
        ) {
          continue;
        }

        throw lastError;
      }

      const reply = (
        data.candidates?.[0]?.content?.parts || []
      )
        .map(part => part.text || '')
        .join('')
        .trim();

      if (reply) {
        delete cooldowns[model];
        saveCooldowns(cooldowns);

        return reply;
      }

      lastError = new Error(
        `[${model}] AI Response မရရှိပါ။`
      );

    } catch (error) {

      if (error === lastError) {
        throw error;
      }

      lastError = error;

      continue;
    }
  }

  throw new Error(
    lastError?.message ||
    'Gemini Models အားလုံး ယာယီအသုံးမပြုနိုင်ပါ။'
  );
}
