import { FREE_MODELS } from './config.js';

export async function sendChatMessage(apiKey, selectedModel, systemPrompt, messagesHistory) {
  // Api.Airforce အတွက် API Key မရှိလည်း အလုပ်လုပ်နိုင်အောင် အောက်ပါအတိုင်း ပြင်ဆင်ထားသည်
  const airforceKey = apiKey || 'free';

  // Token limit မကျော်အောင် နောက်ဆုံး message 20 ကိုပဲ ယူမည်
  const recentMessages = messagesHistory.slice(-20);

  // Romance Roleplay စကားပြော ပိုမိုသဘာဝကျပြီး လူဆန်စေရန် Directive ထည့်သွင်းခြင်း
  const humanRoleplayPrompt = `

[STRICT ROLEPLAY INSTRUCTION:
1. Speak 100% naturally in fluent Burmese as your character.
2. Do NOT output foreign text or bracketed translation notes.
3. Use brackets like (ပြုံးပြလိုက်သည်) or (ရှက်သွားသည်) for emotions and actions.
4. Stay strictly in character and react authentically like a real human.]`;

  const messages = [
    { role: 'system', content: systemPrompt + humanRoleplayPrompt },
    ...recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
  ];

  // Romance/Uncensored အတွက် အကောင်းဆုံး မော်ဒယ်များကို အဓိကထား၍ ရွေးချယ်စမ်းသပ်မည်
  const airforceModels = [
    selectedModel,
    'llama-3.3-70b',
    'hermes-3-llama-3.1-8b',
    'mistral-7b-instruct',
    ...FREE_MODELS
  ];

  const modelsToTry = Array.from(new Set(airforceModels.filter(Boolean)));

  let lastError = null;

  // Api.Airforce Endpoint သို့ Loop ပတ်ပြီး စမ်းသပ်ခေါ်ယူမည်
  for (const model of modelsToTry) {
    try {
      const response = await fetch('https://api.airforce/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airforceKey}`,
          'Content-Type': 'application/json'
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
        continue; // နောက် Model တစ်ခုဖြင့် ထပ်မံ ကြိုးစားမည်
      }

      const data = await response.json();
      const replyText = data.choices?.[0]?.message?.content;

      if (replyText) {
        return replyText.trim(); // အောင်မြင်စွာ စာပြန်ပါက စကားပြန်ကို ထုတ်ပေးမည်
      }
    } catch (err) {
      lastError = err;
    }
  }

  // Models အားလုံး Error တက်မှသာ Error ပြမည်
  throw new Error(lastError ? lastError.message : 'Api.Airforce မော်ဒယ်များ တုံ့ပြန်မှု မရှိပါ။');
          }
