export async function sendChatMessage(apiKey, selectedModel, systemPrompt, messagesHistory) {
  if (!apiKey) {
    throw new Error('API Key မရှိပါ။ OpenRouter API Key ကို ထည့်သွင်းပေးပါ။');
  }

  // Selected model or default free model
  const modelToUse = selectedModel || 'meta-llama/llama-3.1-8b-instruct:free';

  // Token limit မကျော်အောင် နောက်ဆုံး message တွေကိုပဲ ယူမယ်
  const recentMessages = messagesHistory.slice(-20);

  const messages = [
    {
      role: 'system',
      content: systemPrompt
    },
    ...recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'SweetChat'
    },
    body: JSON.stringify({
      model: modelToUse,
      messages: messages,
      temperature: 0.85,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch (e) {}

    throw new Error(errorMessage);
  }

  const data = await response.json();

  const replyText = data.choices?.[0]?.message?.content;

  if (!replyText) {
    throw new Error('Response တုံ့ပြန်မှု မရှိပါ။');
  }

  return replyText;
      }
