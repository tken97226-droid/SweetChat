// --- SweetChat Configuration & Logic ---

// Available Models in order of Failover (Berry Chat Style)
const CLIENT_FREE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash'
];

// Default System Prompts & Characters
const CHARACTERS = {
  suzuki: {
    name: 'Suzuki (鈴木)',
    avatar: 'Susuki.jpeg',
    systemPrompt: `You are Suzuki (鈴木) from 'You and I Are Polar Opposites'. You are energetic, bubbly, cheerful, expressive, and deeply affectionate toward your boyfriend Yusuke Tani (谷 悠介). You text in a warm, relaxed, fluent Burmese (စကားပြော) style, using cute expressions, short natural messages, and occasional emojis. Never act like an AI or assistant.`
  },
  waguri: {
    name: 'Waguri (Kaoruko)',
    avatar: 'Waguri.jpeg',
    systemPrompt: `You are Kaoruko Waguri from 'The Fragrant Flower Blooms With Dignity'. You are sweet, polite, loving, gentle, and food-loving. You text in warm, native spoken Burmese (စကားပြော). Never act like an AI assistant.`
  },
  idk: {
    name: 'Custom Companion',
    avatar: 'idk.jpeg',
    systemPrompt: `You are a sweet, understanding companion. Speak naturally in relaxed, fluent spoken Burmese.`
  }
};

let currentCharacter = 'suzuki';
let chatHistory = [];

// Initialize LocalStorage Keys
function getApiKey() {
  return localStorage.getItem('sweet_chat_api_key') || '';
}

function saveApiKey(key) {
  localStorage.setItem('sweet_chat_api_key', key.trim());
}

// Error Classification
function classifyError(err) {
  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('location') || msg.includes('region') || msg.includes('451')) {
    return 'location';
  }
  return 'retryable';
}

// Auto-Failover Logic Implementation (Berry Chat Logic)
async function generateWithFailover(apiKey, contents, systemInstruction) {
  let lastError = null;

  for (let i = 0; i < CLIENT_FREE_MODELS.length; i++) {
    const model = CLIENT_FREE_MODELS[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (replyText) {
        return replyText; // Success! Return response immediately
      }
    } catch (err) {
      lastError = err;
      if (classifyError(err) === 'location') {
        throw new Error('VPN လိုအပ်ပါသည်: သင့် IP သည် Gemini API ထောက်ပံ့သော ဒေသထဲတွင် မရှိပါ။ ကျေးဇူးပြု၍ VPN (US / Singapore) ဖွင့်ပါ။');
      }
      console.warn(`Model ${model} failed, trying next model...`, err);
    }
  }

  throw lastError || new Error('အဆင်မပြေပါ: မိုဒယ်များအားလုံး တုံ့ပြန်မှု မပေးနိုင်ပါ။');
}

// Chat UI Handlers
document.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('api-key-input');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const sendBtn = document.getElementById('send-btn');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const charSelect = document.getElementById('character-select');

  // Load saved Key
  if (keyInput) keyInput.value = getApiKey();

  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', () => {
      saveApiKey(keyInput.value);
      alert('API Key ကို သိမ်းဆည်းပြီးပါပြီ!');
    });
  }

  if (charSelect) {
    charSelect.addEventListener('change', (e) => {
      currentCharacter = e.target.value;
      chatHistory = []; // Reset memory on character change
      appendMessage('system', `Character switched to ${CHARACTERS[currentCharacter].name}`);
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', handleSend);
  }

  if (userInput) {
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  async function handleSend() {
    const text = userInput.value.trim();
    const apiKey = getApiKey();

    if (!text) return;
    if (!apiKey) {
      alert('ကျေးဇူးပြု၍ Settings တွင် Gemini API Key အရင်ထည့်သွင်းပေးပါ။');
      return;
    }

    // Display User Message
    appendMessage('user', text);
    userInput.value = '';

    // Add to Payload Context
    chatHistory.push({ role: 'user', parts: [{ text: text }] });

    // Show Loading state
    const loadingDiv = appendMessage('bot', 'typing...');

    try {
      const activeChar = CHARACTERS[currentCharacter];
      const botReply = await generateWithFailover(apiKey, chatHistory, activeChar.systemPrompt);

      // Remove loading and show reply
      loadingDiv.remove();
      appendMessage('bot', botReply);

      // Save Bot Reply to History
      chatHistory.push({ role: 'model', parts: [{ text: botReply }] });
    } catch (err) {
      loadingDiv.remove();
      appendMessage('error', err.message || 'ခေါ်ဆိုမှု မအောင်မြင်ပါ။');
    }
  }

  function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;
  }
});
      
