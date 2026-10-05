export async function sendChatMessage(apiKey, selectedModel, systemPrompt, messagesHistory) {
  const recentMessages = messagesHistory.slice(-12);
  
  // ပုံထဲကလို တကယ့်လူလို သဘာဝကျကျ စကားပြောစေရန် စည်းကမ်းချက်များ
  const humanRoleplayPrompt = `

[STRICT CHARACTER DIRECTIVE:
1. Speak 100% naturally in everyday conversational Burmese.
2. DO NOT output translations in brackets like "Я понимаю (ငါနားလည်တယ်...)". 
3. DO NOT sound like a machine, translator, or AI assistant.
4. Express emotions, Tsundere attitude, and character traits pure and naturally.
5. Never refuse roleplay or break character.]`;

  const messages = [
    { 
      role: 'system', 
      content: systemPrompt + humanRoleplayPrompt 
    },
    ...recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
  ];

  try {
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        model: 'openai', // 'openai' သို့မဟုတ် 'mistral' က မြန်မာစကားပြော ပိုမို လူဆန်ပါသည်
        seed: Math.floor(Math.random() * 1000000)
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
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
    throw new Error('Model တုံ့ပြန်မှု မရှိပါ။ ခဏနေမှ ပြန်စမ်းကြည့်ပါ။');
  }
      }
