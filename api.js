import { FREE_MODELS } from './config.js';

export async function sendChatMessage(apiKey, selectedModel, systemPrompt, messagesHistory) {
  if (!apiKey) {
    throw new Error('API Key မရှိပါ။ OpenRouter API Key ကို ထည့်သွင်းပေးပါ။');
  }

  // Token limit မကျော်အောင် နောက်ဆုံး message 20 ကိုပဲ ယူမည်
  const recentMessages = messagesHistory.slice(-20);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
  ];

  // User ရွေးထားသော model ကို အရင်စမ်းမည်၊ ထို့နောက် အခြား Free models များကို အဆင်လိုက် စမ်းမည်
  const modelsToTry = Array.from(new Set([selectedModel, ...FREE_MODELS].filter(Boolean)));

  let lastError = null;

  // Model တစ်ခုပြီးတစ်ခု Loop ပတ်ပြီး စမ်းသပ်ခေါ်ယူမည်
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
        
        // Error ဖြစ်ပါက နောက် Model တစ်ခုသို့ ကူးရန် သိမ်းထားမည်
        lastError = new Error(`[Model: ${model}] ${errText}`);
        continue; // နောက် Model တစ်ခုဖြင့် ထပ်မံ ကြိုးစားမည်
      }

      const data = await response.json();
      const replyText = data.choices?.[0]?.message?.content;

      if (replyText) {
        return replyText; // အောင်မြင်စွာ စာပြန်ပါက စကားပြန်ကို တန်းထုတ်ပေးမည်
      }
    } catch (err) {
      lastError = err;
    }
  }

  // Models အားလုံး Limit ကုန် သို့မဟုတ် Error တက်မှသာ Error ပြမည်
  throw new Error(lastError ? lastError.message : 'Model အားလုံး တုံ့ပြန်မှု မရှိပါ။');
            }
