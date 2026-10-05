import { FREE_MODELS } from './config.js';

export async function sendChatMessage(apiKey, selectedModel, systemPrompt, messagesHistory) {
  // Token limit မကျော်အောင် နောက်ဆုံး message 20 ကိုပဲ ယူမည်
  const recentMessages = messagesHistory.slice(-20);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
  ];

  // OpenRouter Model Name များကို Pollinations အခမဲ့ Model မျိုးသို့ အလိုအလျောက် ပြောင်းပေးခြင်း
  let targetModel = 'mistral'; // Default မော်ဒယ်
  
  if (selectedModel) {
    const lowerModel = selectedModel.toLowerCase();
    if (lowerModel.includes('llama')) {
      targetModel = 'llama';
    } else if (lowerModel.includes('evil') || lowerModel.includes('uncensored')) {
      targetModel = 'evil';
    } else if (lowerModel.includes('gpt') || lowerModel.includes('openai')) {
      targetModel = 'openai';
    } else if (lowerModel.includes('qwen')) {
      targetModel = 'qwen-coder';
    } else {
      targetModel = 'mistral';
    }
  }

  try {
    // API Key အဟောင်း ပို့မိပါက Paid Pollen Error တက်နိုင်သဖြင့် Header တွင် Authorization မထည့်ဘဲ ရိုးရိုးခေါ်ယူမည်
    const headers = {
      'Content-Type': 'application/json'
    };

    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: targetModel,
        messages: messages,
        temperature: 0.85
      })
    });

    if (!response.ok) {
      let errText = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errText = errorData.error?.message || errorData.message || errText;
      } catch (e) {}
      throw new Error(`[Pollinations AI Error] ${errText}`);
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content;

    if (replyText) {
      return replyText;
    } else {
      throw new Error('AI ထံမှ တုံ့ပြန်မှု မရရှိပါ။');
    }

  } catch (err) {
    console.error('API Call Error:', err);
    throw new Error(err.message || 'Model တုံ့ပြန်မှု မရှိပါ။ ခဏနေမှ ပြန်စမ်းကြည့်ပါ။');
  }
        }
