import { FREE_MODELS } from './config.js';

export async function sendChatMessage(apiKeyInputText, selectedModel, systemPrompt, messagesHistory) {
  if (!apiKeyInputText || !apiKeyInputText.trim()) {
    throw new Error('API Key မရှိပါ။ ကျေးဇူးပြု၍ Settings တွင် Key ထည့်သွင်းပေးပါ။');
  }

  // Multi-key support: Enter ခေါက်ပြီး ထည့်ထားသော Key များကို လိုင်းခွဲယူမည်
  const keys = apiKeyInputText
    .split('\n')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  if (keys.length === 0) {
    throw new Error('ထည့်သွင်းထားသော API Key များ မမှန်ကန်ပါ။');
  }

  const recentMessages = messagesHistory.slice(-20);
  const messages = [];

  if (systemPrompt && systemPrompt.trim()) {
    messages.push({ role: 'system', content: systemPrompt.trim() });
  }

  messages.push(...recentMessages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  })));

  const modelsToTry = Array.from(new Set([selectedModel, ...FREE_MODELS].filter(Boolean)));
  let lastError = null;

  for (const key of keys) {
    const isGroq = key.startsWith('gsk_');
    const endpoint = isGroq 
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';

    for (const model of modelsToTry) {
      if (isGroq && model.includes(':free')) continue;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://localhost',
            'X-Title': 'SweetChat'
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.85,
            max_tokens: 1024
          })
        });

        if (!response.ok) {
          let errText = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errText = errorData.error?.message || errText;
          } catch (e) {}

          lastError = new Error(`[${isGroq ? 'Groq' : 'OpenRouter'} | ${model}] ${errText}`);
          continue;
        }

        const data = await response.json();
        const replyText = data.choices?.[0]?.message?.content;

        if (replyText) {
          return replyText;
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw new Error(lastError ? lastError.message : 'Model/Key များ အားလုံး တုံ့ပြန်မှု မရှိပါ။');
    }
