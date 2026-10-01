import { FREE_MODELS } from './config.js';

export async function sendChatMessage(apiKey, selectedModel, systemPrompt, messagesHistory) {
  if (!apiKey) {
    throw new Error('API Key မရှိပါ။ Settings ထဲတွင် API Key ထည့်သွင်းပေးပါ။');
  }

  const modelsToTry = [
    selectedModel,
    ...FREE_MODELS.filter(m => m !== selectedModel)
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const contents = messagesHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: contents,
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 1024,
            topP: 0.95
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!replyText) throw new Error('Response တုံ့ပြန်မှု မရှိပါ။');

      return replyText;

    } catch (err) {
      console.warn(`Model ${model} ပျက်ကွက်ပါသည်:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Model အားလုံး တုံ့ပြန်ရန် ပျက်ကွက်ပါသည်။');
          }
    
