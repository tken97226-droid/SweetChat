import { defaultCharacters } from './defaultCharacters.js';

let currentChar = null;

function getStoredCharacters() {
  const stored = localStorage.getItem('sweet_chat_chars');
  if (!stored) {
    localStorage.setItem('sweet_chat_chars', JSON.stringify(defaultCharacters));
    return defaultCharacters;
  }
  return JSON.parse(stored);
}

function saveCharacters(chars) {
  localStorage.setItem('sweet_chat_chars', JSON.stringify(chars));
}

function getApiKey() {
  return localStorage.getItem('openrouter_api_key') || '';
}

function saveApiKey(key) {
  localStorage.setItem('openrouter_api_key', key);
}

document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chat-box');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const apiKeyInput = document.getElementById('api-key-input');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const homeView = document.getElementById('home-view');
  const cardsList = document.getElementById('character-cards-list');
  const inputArea = document.getElementById('input-area');
  const backBtn = document.getElementById('back-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const headerTitle = document.getElementById('header-title');

  apiKeyInput.value = getApiKey();

  settingsBtn.onclick = () => { settingsModal.style.display = 'flex'; };
  closeModalBtn.onclick = () => { settingsModal.style.display = 'none'; };
  saveKeyBtn.onclick = () => {
    saveApiKey(apiKeyInput.value.trim());
    settingsModal.style.display = 'none';
    alert('OpenRouter API Key Saved Successfully!');
  };

  function renderHomeCards() {
    const chars = getStoredCharacters();
    cardsList.innerHTML = '';

    chars.forEach(c => {
      const card = document.createElement('div');
      card.className = 'char-card';

      card.innerHTML = `
        <div class="card-top">
          <img src="${c.avatar}" class="card-avatar" alt="${c.name}">
          <div class="card-meta">
            <div class="char-name-row">
              <h3 class="char-name">${c.name}</h3>
              <span class="char-badge">Lv.${c.level || 1}</span>
            </div>
            <div class="char-relation">${c.relationship}</div>
            <p class="char-desc">${c.description}</p>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn-chat" data-id="${c.id}">Chat</button>
        </div>
      `;
      cardsList.appendChild(card);
    });

    document.querySelectorAll('.btn-chat').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openChat(id);
      };
    });
  }

  function openChat(charId) {
    const chars = getStoredCharacters();
    currentChar = chars.find(c => c.id === charId);

    homeView.style.display = 'none';
    chatBox.style.display = 'flex';
    inputArea.style.display = 'flex';
    backBtn.style.display = 'flex';
    headerTitle.innerText = currentChar.name;

    updateUI();
  }

  backBtn.onclick = () => {
    chatBox.style.display = 'none';
    inputArea.style.display = 'none';
    backBtn.style.display = 'none';
    homeView.style.display = 'block';
    headerTitle.innerText = 'SweetChat';
    renderHomeCards();
  };

  function updateUI() {
    chatBox.innerHTML = '';
    if (!currentChar.messages || currentChar.messages.length === 0) {
      appendMessage('model', currentChar.initialChatGreeting);
    } else {
      currentChar.messages.forEach(msg => appendMessage(msg.role, msg.content));
    }
  }

  function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;
  }

  function showTypingIndicator() {
    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = 'message model typing-indicator';
    indicatorDiv.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
    chatBox.appendChild(indicatorDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return indicatorDiv;
  }

  // OpenRouter API Fetch Logic
  async function sendChatMessage(key, modelName, systemPrompt, messagesHistory) {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    
    // OpenRouter / OpenAI format payload
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messagesHistory.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin || 'https://github.io',
        'X-Title': 'SweetChat'
      },
      body: JSON.stringify({
        model: modelName || 'google/gemini-2.0-flash-001',
        messages: formattedMessages
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'OpenRouter API Error');
    }
    return data.choices[0].message.content;
  }

  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    const key = getApiKey();
    if (!key) {
      alert('ကျေးဇူးပြု၍ Settings (⚙️) ထဲမှာ OpenRouter API Key အရင်ထည့်ပေးပါ!');
      return;
    }

    appendMessage('user', text);
    chatInput.value = '';

    if (!currentChar.messages) currentChar.messages = [];
    currentChar.messages.push({ role: 'user', content: text });

    const indicatorElem = showTypingIndicator();

    try {
      const reply = await sendChatMessage(key, currentChar.model, currentChar.systemPrompt, currentChar.messages);
      const cleanReply = reply.replace(/\*/g, '');

      indicatorElem.remove();
      appendMessage('model', cleanReply);

      currentChar.messages.push({ role: 'model', content: cleanReply });
      
      const chars = getStoredCharacters();
      const idx = chars.findIndex(c => c.id === currentChar.id);
      if (idx !== -1) {
        chars[idx] = currentChar;
        saveCharacters(chars);
      }

    } catch (err) {
      indicatorElem.remove();
      const errElem = appendMessage('model', `Error: ${err.message}`);
      errElem.style.color = '#ef4444';
    }
  }

  sendBtn.onclick = handleSend;
  chatInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };

  renderHomeCards();
});
                                              
