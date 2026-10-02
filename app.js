import { getStoredCharacters, saveCharacters, getActiveCharacter, setActiveCharacterId, getApiKey, saveApiKey } from './storage.js';
import { sendChatMessage } from './api.js';
import { evaluateAffection } from './affectionEngine.js';

let currentChar = null;

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
  const navNewChat = document.getElementById('nav-new-chat');
  const bottomNav = document.getElementById('bottom-nav');
  const headerTitle = document.getElementById('header-title');

  apiKeyInput.value = getApiKey() || '';

  // Settings Modal Controls
  settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
  closeModalBtn.addEventListener('click', () => settingsModal.style.display = 'none');
  saveKeyBtn.addEventListener('click', () => {
    saveApiKey(apiKeyInput.value.trim());
    settingsModal.style.display = 'none';
    alert('API Key သိမ်းဆည်းပြီးပါပြီ!');
  });

  // Home Screen Character List Rendering
  function renderHomeCards() {
    const chars = getStoredCharacters();
    cardsList.innerHTML = '';

    chars.forEach(c => {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.innerHTML = `
        <div class="card-top">
          <img src="${c.avatar || 'Susuki.jpeg'}" class="card-avatar" alt="${c.name}">
          <div class="card-meta">
            <div class="char-name">
              ${c.name}
              <span class="char-badge">Lv.${c.level || 1}</span>
            </div>
            <div class="char-relation">${c.relationship || 'Companion'}</div>
            <p class="char-desc">${c.personality || ''}</p>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-chat" data-id="${c.id}">Chat</button>
        </div>
      `;
      cardsList.appendChild(card);
    });

    document.querySelectorAll('.btn-chat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const charId = e.target.getAttribute('data-id');
        openChat(charId);
      });
    });
  }

  function openChat(charId) {
    setActiveCharacterId(charId);
    currentChar = getActiveCharacter();

    homeView.style.display = 'none';
    bottomNav.style.display = 'none';
    chatBox.style.display = 'flex';
    inputArea.style.display = 'flex';
    backBtn.style.display = 'flex';
    headerTitle.innerText = currentChar.name;

    updateUI();
  }

  backBtn.addEventListener('click', () => {
    chatBox.style.display = 'none';
    inputArea.style.display = 'none';
    backBtn.style.display = 'none';
    homeView.style.display = 'flex';
    bottomNav.style.display = 'flex';
    headerTitle.innerText = 'SweetChat';
    renderHomeCards();
  });

  navNewChat.addEventListener('click', () => {
    if (currentChar && confirm('လက်ရှိ စကားပြောထားတာတွေကို ရှင်းထုတ်ပြီး New Chat ပြန်စမလား?')) {
      currentChar.messages = [];
      saveCurrentCharState();
      updateUI();
    }
  });

  function saveCurrentCharState() {
    const allChars = getStoredCharacters();
    const idx = allChars.findIndex(c => c.id === currentChar.id);
    if (idx !== -1) {
      allChars[idx] = currentChar;
      saveCharacters(allChars);
    }
  }

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

  // Messenger-style Typing Animation
  function showTypingIndicator() {
    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = 'message model typing-indicator';
    indicatorDiv.id = 'typing-indicator';
    indicatorDiv.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    chatBox.appendChild(indicatorDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return indicatorDiv;
  }

  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    const key = getApiKey();
    if (!key) {
      alert('ကျေးဇူးပြု၍ Settings (⚙️) ထဲမှာ API Key အရင်ထည့်ပေးပါ!');
      return;
    }

    appendMessage('user', text);
    chatInput.value = '';

    if (!currentChar.messages) currentChar.messages = [];
    currentChar.messages.push({ role: 'user', content: text });

    const indicatorElem = showTypingIndicator();

    try {
      const rawReply = await sendChatMessage(key, currentChar.model, currentChar.systemPrompt, currentChar.messages);
      const { cleanText, affectionDelta } = evaluateAffection(rawReply, text);

      indicatorElem.remove(); // Typing animation ကို ဖျက်ပြီး စာအမှန်ထည့်မည်
      appendMessage('model', cleanText);

      currentChar.messages.push({ role: 'model', content: cleanText });
      currentChar.affection = (currentChar.affection || 0) + affectionDelta;
      saveCurrentCharState();

    } catch (err) {
      indicatorElem.remove();
      const errElem = appendMessage('model', `Error: ${err.message}`);
      errElem.style.color = '#ff4757';
    }
  }

  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  renderHomeCards();
});
        
