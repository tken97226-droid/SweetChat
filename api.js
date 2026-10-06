import { FREE_MODELS } from './config.js';

export async function sendChatMessage(apiKeyInput, selectedModel, systemPrompt, messagesHistory) {
  // Textarea ထဲက စာကြောင်းများ (Enter ခေါက်ထားသော Keys များ) ကို Split လုပ်၍ ခွဲယူမည်
  const keys = apiKeyInput
    ? apiKeyInput.split('\n').map(k => k.trim()).filter(Boolean)
    : [];

  if (keys.length === 0) {
    throw new Error('API Key မရှိပါ။ Settings တွင် OpenRouter API Key ထည့်သွင်းပေးပါ။');
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

  // User ရွေးထားသော primary model ကို အဓိကထားပြီး၊ မရပါက FREE_MODELS ထဲမှ အခြား မော်ဒယ်များကို အစဉ်လိုက် စမ်းသပ်မည်
  const modelsToTry = Array.from(new Set([selectedModel, ...FREE_MODELS].filter(Boolean)));

  let lastError = null;

  // ၁။ ထည့်သွင်းထားသော Key တစ်ခုစီကို Loop ပတ်မည်
  for (const currentKey of keys) {
    // ၂။ Key တစ်ခုစီအတွက် Model များကို တစ်ခုပြီးတစ်ခု Loop ပတ်စမ်းသပ်မည်
    for (const model of modelsToTry) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentKey}`,
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
          
          // Error ဖြစ်ပါက နောက် Model သို့မဟုတ် နောက် Key သို့ ကူးရန် သိမ်းထားမည်
          lastError = new Error(`[Model: ${model}] ${errText}`);
          continue; 
        }

        const data = await response.json();
        const replyText = data.choices?.[0]?.message?.content;

        if (replyText) {
          return replyText.trim(); // အောင်မြင်စွာ စာပြန်ပါက စကားပြန်ကို တန်းထုတ်ပေးမည်
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  // Keys နှင့် Models အားလုံး Limit ကုန် သို့မဟုတ် Error တက်မှသာ Error ပြမည်
  throw new Error(lastError ? lastError.message : 'ထည့်သွင်းထားသော API Keys သို့မဟုတ် Models များ အားလုံး အဆင်မပြေပါ။');
                                     }
