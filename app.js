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
  const charSelect = document.getElementById('char-select');
  const affectionBadge = document.getElementById('affection-badge');
  const charAvatar = document.getElementById('char-avatar');
  
  const homeView = document.getElementById('home-view');
  const cardsList = document.getElementById('character-cards-list');
  const inputArea = document.getElementById('input-area');
  const backBtn = document.getElementById('back-btn');
  const newChatBtn = document.getElementById('new-chat-btn');

  apiKeyInput.value = getApiKey();

  function renderCharDropdown() {
    const chars = getStoredCharacters();
    charSelect.innerHTML = '';
    chars.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.innerText = c.name;
      charSelect.appendChild(opt);
    });
  }

  function renderHomeCards() {
    const chars = getStoredCharacters();
    cardsList.innerHTML = '';

    chars.forEach(c => {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.innerHTML = `
        <img src="${c.avatar || 'Susuki.jpeg'}" alt="${c.name}">
        <div class="char-card-info">
          <h3>${c.name}</h3>
          <p>${c.personality || ''}</p>
          <button class="btn-chat-start" data-id="${c.id}">စကားပြောမည်</button>
        </div>
      `;
      cardsList.appendChild(card);
    });

    document.querySelectorAll('.btn-chat-start').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const charId = e.target.getAttribute('data-id');
        openChatAndResetHistory(charId);
      });
    });
  }

  function openChatAndResetHistory(charId) {
    setActiveCharacterId(charId);
    currentChar = getActiveCharacter();

    // Clear history on starting new chat session
    currentChar.messages = [];
    
    const allChars = getStoredCharacters();
    const idx = allChars.findIndex(c => c.id === currentChar.id);
    if (idx !== -1) {
      allChars[idx] = currentChar;
      saveCharacters(allChars);
    }

    homeView.style.display = 'none';
    chatBox.style.display = 'flex';
    inputArea.style.display = 'flex';
    backBtn.style.display = 'block';
    newChatBtn.style.display = 'block';

    charSelect.value = currentChar.id;
    updateUI();
  }

  backBtn.addEventListener('click', () => {
    chatBox.style.display = 'none';
    inputArea.style.display = 'none';
    backBtn.style.display = 'none';
    newChatBtn.style.display = 'none';
    homeView.style.display = 'flex';
    renderHomeCards();
  });

  newChatBtn.addEventListener('click', () => {
    if (confirm('စကားပြောထားတာတွေကို ဖျက်ပြီး New Chat ပြန်စမလားဟင်?')) {
      if (currentChar) {
        openChatAndResetHistory(currentChar.id);
      }
    }
  });

  renderCharDropdown();
  renderHomeCards();

  currentChar = getActiveCharacter();
  if (currentChar) charSelect.value = currentChar.id;

  charSelect.addEventListener('change', (e) => {
    openChatAndResetHistory(e.target.value);
  });

  saveKeyBtn.addEventListener('click', () => {
    saveApiKey(apiKeyInput.value);
    alert('API Key သိမ်းဆည်းပြီးပါပြီ!');
  });

  function updateUI() {
    chatBox.innerHTML = '';
    affectionBadge.innerText = `Affection: ${currentChar.affection || 0}`;
    if (charAvatar && currentChar.avatar) {
      charAvatar.src = currentChar.avatar;
    }

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

  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    const key = getApiKey();
    if (!key) {
      alert('ကျေးဇူးပြု၍ API Key ကို ထည့်သွင်းပါ!');
      return;
    }

    appendMessage('user', text);
    chatInput.value = '';

    if (!currentChar.messages) currentChar.messages = [];
    currentChar.messages.push({ role: 'user', content: text });

    const loadingElem = appendMessage('model', 'ရိုက်နေသည်...');

    try {
      const rawReply = await sendChatMessage(key, currentChar.model, currentChar.systemPrompt, currentChar.messages);
      const { cleanText, affectionDelta } = evaluateAffection(rawReply, text);

      loadingElem.innerText = cleanText;
      currentChar.messages.push({ role: 'model', content: cleanText });

      currentChar.affection = (currentChar.affection || 0) + affectionDelta;
      affectionBadge.innerText = `Affection: ${currentChar.affection}`;

      const allChars = getStoredCharacters();
      const index = allChars.findIndex(c => c.id === currentChar.id);
      if (index !== -1) {
        allChars[index] = currentChar;
        saveCharacters(allChars);
      }

    } catch (err) {
      loadingElem.innerText = `Error: ${err.message}`;
      loadingElem.classList.add('error');
    }
  }

  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
});
  
