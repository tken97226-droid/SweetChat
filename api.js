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

  // အရင် OpenRouter Model ID အဟောင်းများ ပါလာပါက Pollinations Model များသို့ အလိုအလျောက် ပြောင်းပေးရန်
  let targetModel = selectedModel || 'mistral';
  if (targetModel.includes('/') || !FREE_MODELS.includes(targetModel)) {
    const lower = targetModel.toLowerCase();
    if (lower.includes('llama')) targetModel = 'llama';
    else if (lower.includes('evil') || lower.includes('uncensored')) targetModel = 'evil';
    else if (lower.includes('gpt') || lower.includes('openai')) targetModel = 'openai';
    else targetModel = 'mistral'; // Gemini အပါအဝင် အခြား Model များအတွက် mistral သို့ ညွှန်းမည်
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    
    // Key ထည့်ထားပါက Authorization Header ပို့မည် (မပါလျှင်လည်း Free ခေါ်ယူနိုင်သည်)
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
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
        errText = errorData.error?.message || errText;
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
