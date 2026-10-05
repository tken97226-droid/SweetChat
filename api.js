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

  // Pollinations AI Endpoint သို့ ပို့မည်
  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    // API Key ရှိပါက Authorization Header ထည့်မည်
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: selectedModel || 'mistral', // 'mistral' သို့မဟုတ် 'evil' သုံးနိုင်သည်
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
      return replyText; // အောင်မြင်စွာ စာပြန်ပါက စကားပြန်ကို တန်းထုတ်ပေးမည်
    } else {
      throw new Error('AI ထံမှ တုံ့ပြန်မှု မရရှိပါ။');
    }

  } catch (err) {
    console.error('API Call Error:', err);
    throw new Error(err.message || 'Model တုံ့ပြန်မှု မရှိပါ။ ခဏနေမှ ပြန်စမ်းကြည့်ပါ။');
  }
          }
