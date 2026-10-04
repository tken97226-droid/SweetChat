// api.js
import { FREE_MODELS } from './config.js';
import { getUserName } from './storage.js';

export async function sendChatMessage(apiKey, selectedModel, systemPrompt, messagesHistory) {
  if (!apiKey) {
    throw new Error('API Key မရှိပါ။ OpenRouter API Key ကို ထည့်သွင်းပေးပါ။');
  }

  const userName = getUserName();
  const modifiedSystemPrompt = `${systemPrompt}\n\n[USER INFO]: The user's name is "${userName}". Address the user by this name naturally when talking.`;

  const recentMessages = messagesHistory.slice(-20);
  const messages = [
    {
      role: 'system',
      content: modifiedSystemPrompt
    },
    ...recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
  ];

  const modelsToTry = Array.from(new Set([selectedModel, ...FREE_MODELS].filter(Boolean)));
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
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
        
        lastError = new Error(`[Model: ${model}] ${errText}`);
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

  throw new Error(lastError ? lastError.message : 'Model အားလုံး တုံ့ပြန်မှု မရှိပါ။');
      }
      
