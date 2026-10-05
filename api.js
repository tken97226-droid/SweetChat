import { FREE_MODELS } from './config.js';

export async function sendChatMessage(apiKey, selectedModel, systemPrompt, messagesHistory) {
  // Token limit မကျော်အောင် နောက်ဆုံး message 15 ခုကိုပဲ ယူမည်
  const recentMessages = messagesHistory.slice(-15);
  
  // Prompt များအားလုံးကို Pollinations AI နားလည်သော Standard Format သို့ ပေါင်းစည်းမည်
  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
  ];

  // Selected Model အလိုက် Free Model များသို့ ညွှန်းပေးမည်
  let targetModel = 'mistral';
  if (selectedModel) {
    const lower = selectedModel.toLowerCase();
    if (lower.includes('llama')) targetModel = 'llama';
    else if (lower.includes('evil') || lower.includes('uncensored')) targetModel = 'evil';
    else if (lower.includes('qwen')) targetModel = 'qwen-coder';
    else if (lower.includes('openai') || lower.includes('gpt')) targetModel = 'openai';
    else targetModel = 'mistral';
  }

  try {
    // 402 Payment Required မတက်အောင် Pollinations OpenAI-compatible Chat Completions အခမဲ့ Endpoint သို့ ပို့မည်
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        model: targetModel,
        seed: Math.floor(Math.random() * 1000000)
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText.slice(0, 100)}`);
    }

    // Response ကို Text အဖြစ် တိုက်ရိုက်ယူခြင်း
    const replyText = await response.text();

    if (replyText && replyText.trim().length > 0) {
      return replyText.trim();
    } else {
      throw new Error('AI ထံမှ တုံ့ပြန်မှု မရရှိပါ။');
    }

  } catch (err) {
    console.error('API Call Error:', err);
    throw new Error(err.message || 'Model တုံ့ပြန်မှု မရှိပါ။ ခဏနေမှ ပြန်စမ်းကြည့်ပါ။');
  }
                                 }
