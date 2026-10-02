export async function sendChatMessage(apiKey, selectedModel, systemPrompt, messagesHistory) {
  if (!apiKey) {
    throw new Error('API Key မရှိပါ။ OpenRouter API Key ကို ထည့်သွင်းပေးပါ။');
  }

  // OpenRouter Free Roleplay Model ( သို့မဟုတ် ကြိုက်နှစ်သက်ရာ Model နာမည် )
  const modelToUse = selectedModel || 'meta-llama/llama-3.1-8b-instruct:free';

  const messages = [
    { role: 'system', content: systemPrompt },
    ...messagesHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin, // GitHub Pages domain
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
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const replyText = data.choices?.[0]?.message?.content;

  if (!replyText) throw new Error('Response တုံ့ပြန်မှု မရှိပါ။');

  return replyText;
}
