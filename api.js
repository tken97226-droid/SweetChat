import { FREE_MODELS } from './config.js';

export async function sendChatMessage(apiKey, selectedModel, systemPrompt, messagesHistory) {
  // Token limit မကျော်အောင် နောက်ဆုံး message 15 ခုကိုပဲ ယူမည်
  const recentMessages = messagesHistory.slice(-15);
  
  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
  ];

  // Pollinations API အသစ်တွင် အခမဲ့ အလုပ်လုပ်သော Model Name သို့ Mapping လုပ်ခြင်း
  let targetModel = 'openai'; // Pollinations Free API တွင် OpenAI သို့မဟုတ် Qwen သည် Stable အဖြစ်ဆုံးဖြစ်သည်
  
  if (selectedModel) {
    const lower = selectedModel.toLowerCase();
    if (lower.includes('llama')) targetModel = 'llama';
    else if (lower.includes('evil') || lower.includes('uncensored')) targetModel = 'evil';
    else if (lower.includes('qwen')) targetModel = 'qwen-coder';
    else targetModel = 'openai';
  }

  try {
    // Pollinations OpenAI Compatibility Endpoint သို့ Send လုပ်ခြင်း
    const response = await fetch('https://text.pollinations.ai/openai', {
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
      return replyText.trim();
    } else {
      throw new Error('AI ထံမှ တုံ့ပြန်မှု မရရှိပါ။');
    }

  } catch (err) {
    console.error('API Call Error:', err);
    throw new Error(err.message || 'Model တုံ့ပြန်မှု မရှိပါ။ ခဏနေမှ ပြန်စမ်းကြည့်ပါ။');
  }
  }
