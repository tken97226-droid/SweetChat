import { FREE_MODELS } from './config.js';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export async function sendChatMessage(apiKey, selectedModel, systemPrompt, messagesHistory, options = {}) {
  if (!apiKey) throw new Error('OpenRouter API Key မရှိသေးပါ။ Settings ထဲမှာ ထည့်ပေးပါ။');

  const history = (messagesHistory || []).slice(-24).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content || '')
  })).filter(m => m.content.trim());

  const messages = [{ role: 'system', content: systemPrompt }, ...history];

  const preferred = selectedModel || 'openrouter/free';

  const models = preferred === 'openrouter/free'
    ? ['openrouter/free', ...FREE_MODELS]
    : [preferred, ...FREE_MODELS, 'openrouter/free'];

  const uniqueModels = [...new Set(models)];

  let lastError = 'Model တစ်ခုမှ အဖြေမပေးနိုင်ပါ။';

  for (const model of uniqueModels) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'SweetChat'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.9,
          max_tokens: 900,
          ...(options.provider ? { provider: options.provider } : {})
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        lastError = data.error?.message || `HTTP ${response.status}`;

        if ([400, 401, 403].includes(response.status)) break;

        continue;
      }

      const content = data.choices?.[0]?.message?.content;

      const reply = Array.isArray(content)
        ? content.map(part => part.text || '').join('')
        : content;

      if (typeof reply === 'string' && reply.trim()) {
        return reply.trim();
      }

      lastError = 'Model က စာသားအဖြေ မပြန်လာပါ။';

    } catch (error) {
      lastError = error.name === 'AbortError'
        ? 'တုံ့ပြန်ချိန် ၆၀ စက္ကန့်ကျော်သွားပါတယ်။'
        : error.message;

    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(lastError);
}
