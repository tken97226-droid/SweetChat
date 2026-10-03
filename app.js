import { getStoredCharacters, saveCharacters, getActiveCharacter, setActiveCharacterId, getApiKey, saveApiKey, getSelectedModel, saveSelectedModel } from './storage.js';
import { sendChatMessage } from './api.js';
import { evaluateAffection } from './affectionEngine.js';

let currentChar = null;

document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chat-box');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const apiKeyInput = document.getElementById('api-key-input');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const modelSelect = document.getElementById('model-select');
  
  const headerTitle = document.getElementById('header-title');
  const headerStatus = document.getElementById('header-status');
  const charAvatar = document.getElementById('char-avatar');
  const backBtn = document.getElementById('back-btn');
  const newChatBtn = document.getElementById('new-chat-btn');
  const bottomNav = document.getElementById('bottom-nav');

  const chatsView = document.getElementById('chats-view');
  const settingsView = document.getElementById('settings-view');
  const chatScreenView = document.getElementById('chat-screen-view');
  const cardsList = document.getElementById('character-cards-list');

  apiKeyInput.value = getApiKey();
  modelSelect.value = getSelectedModel();

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      document.querySelectorAll('.view-content').forEach(view => view.classList.remove('active'));
      
      item.classList.add('active');
      const targetTab = item.getAttribute('data-tab');
      document.getElementById(targetTab).classList.add('active');

      if (targetTab === 'chats-view') {
        headerTitle.innerText = 'SweetChat';
        headerStatus.style.display = 'none';
        backBtn.style.display = 'none';
        charAvatar.style.display = 'none';
        newChatBtn.style.display = 'none';
        renderHomeCards();
      } else if (targetTab === 'settings-view') {
        headerTitle.innerText = 'Settings';
        headerStatus.style.display = 'none';
        backBtn.style.display = 'none';
        charAvatar.style.display = 'none';
        newChatBtn.style.display = 'none';
      }
    });
  });

  function renderHomeCards() {
    const chars = getStoredCharacters();
    cardsList.innerHTML = '';

    chars.forEach(c => {
      const lastMsg = (c.messages && c.messages.length > 0) 
        ? c.messages[c.messages.length - 1].content 
        : c.initialChatGreeting;

      const item = document.createElement('div');
      item.className = 'chat-list-item';
      item.innerHTML = `
        <img src="${c.avatar || 'Susuki.jpeg'}" alt="${c.name}">
        <div class="chat-info">
          <div class="chat-info-top">
            <h3>${c.name}</h3>
            <span class="badge">Affection: ${c.affection || 0}</span>
          </div>
          <div class="chat-last-msg">${lastMsg}</div>
        </div>
      `;
      item.addEventListener('click', () => openChatSession(c.id, false));
      cardsList.appendChild(item);
    });
  }

  function openChatSession(charId, isNewChat = false) {
    setActiveCharacterId(charId);
    currentChar = getActiveCharacter();

    if (!currentChar.messages) currentChar.messages = [];

    if (isNewChat) {
      currentChar.messages = [];
      saveCurrentCharState();
    }

    document.querySelectorAll('.view-content').forEach(view => view.classList.remove('active'));
    chatScreenView.classList.add('active');

    headerTitle.innerText = currentChar.name;
    headerStatus.style.display = 'block';
    headerStatus.innerText = 'online';
    charAvatar.src = currentChar.avatar || 'Susuki.jpeg';
    charAvatar.style.display = 'block';
    backBtn.style.display = 'block';
    newChatBtn.style.display = 'block';
    bottomNav.style.display = 'none';

    updateUI();
  }

  backBtn.addEventListener('click', () => {
    chatScreenView.classList.remove('active');
    chatsView.classList.add('active');
    
    headerTitle.innerText = 'SweetChat';
    headerStatus.style.display = 'none';
    backBtn.style.display = 'none';
    charAvatar.style.display = 'none';
    newChatBtn.style.display = 'none';
    bottomNav.style.display = 'flex';
    
    renderHomeCards();
  });

  newChatBtn.addEventListener('click', () => {
    if (confirm('စကားပြောထားတာတွေကို ဖျက်ပြီး New Chat ပြန်စမလားဟင်?')) {
      if (currentChar) openChatSession(currentChar.id, true);
    }
  });

  saveKeyBtn.addEventListener('click', () => {
    saveApiKey(apiKeyInput.value);
    alert('API Key သိမ်းဆည်းပြီးပါပြီ!');
  });

  modelSelect.addEventListener('change', (e) => {
    saveSelectedModel(e.target.value);
  });

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

  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    const key = getApiKey();
    if (!key) {
      alert('ကျေးဇူးပြု၍ Settings ထဲသို့သွားပြီး API Key အရင်ထည့်ပေးပါ!');
      return;
    }

    appendMessage('user', text);
    chatInput.value = '';

    if (!currentChar.messages) currentChar.messages = [];
    currentChar.messages.push({ role: 'user', content: text });

    saveCurrentCharState();

    const loadingElem = appendMessage('model', '');
    loadingElem.innerHTML = `
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    try {
      const selectedModel = getSelectedModel();
      const rawReply = await sendChatMessage(key, selectedModel, currentChar.systemPrompt, currentChar.messages);
      const { cleanText, affectionDelta } = evaluateAffection(rawReply, text);

      loadingElem.innerText = cleanText;
      currentChar.messages.push({ role: 'model', content: cleanText });

      currentChar.affection = (currentChar.affection || 0) + affectionDelta;
      saveCurrentCharState();

    } catch (err) {
      loadingElem.innerText = `Error: ${err.message}`;
      loadingElem.classList.add('error');
    }
  }

  function saveCurrentCharState() {
    const allChars = getStoredCharacters();
    const index = allChars.findIndex(c => c.id === currentChar.id);
    if (index !== -1) {
      allChars[index] = currentChar;
      saveCharacters(allChars);
    }
  }

  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  renderHomeCards();
});
      
