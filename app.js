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
        openChatSession(charId, false); // History မဖျက်ဘဲ Chat ဖွင့်မည်
      });
    });
  }

  // Chat Screen ကို ဖွင့်ပေးမည့် Function (isNewChat = true ဖြစ်မှသာ History ရှင်းမည်)
  function openChatSession(charId, isNewChat = false) {
    setActiveCharacterId(charId);
    currentChar = getActiveCharacter();

    if (!currentChar.messages) {
      currentChar.messages = [];
    }

    // New Chat Button ကို နှိပ်မှသာ မက်ဆေ့ချ်များ ရှင်းမည်
    if (isNewChat) {
      currentChar.messages = [];
      saveCurrentCharState();
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
        openChatSession(currentChar.id, true);
      }
    }
  });

  renderCharDropdown();
  renderHomeCards();

  currentChar = getActiveCharacter();
  if (currentChar) charSelect.value = currentChar.id;

  charSelect.addEventListener('change', (e) => {
    openChatSession(e.target.value, false);
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

    // History မရှိသေးပါက သာ နဂို မူလ Greeting ပြမည်
    if (!currentChar.messages || currentChar.messages.length === 0) {
      appendMessage('model', currentChar.initialChatGreeting);
    } else {
      // History ရှိပါက ရှိခဲ့သမျှ မက်ဆေ့ချ်များကို UI ပေါ်ပြန်ထုတ်ပြမည်
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

    // User မက်ဆေ့ချ် ရိုက်ပြီးသည်နှင့် LocalStorage ထဲ ချက်ချင်းသိမ်းမည်
    saveCurrentCharState();

    const loadingElem = appendMessage('model', 'ရိုက်နေသည်...');

    try {
      const rawReply = await sendChatMessage(key, currentChar.model, currentChar.systemPrompt, currentChar.messages);
      const { cleanText, affectionDelta } = evaluateAffection(rawReply, text);

      loadingElem.innerText = cleanText;
      currentChar.messages.push({ role: 'model', content: cleanText });

      currentChar.affection = (currentChar.affection || 0) + affectionDelta;
      affectionBadge.innerText = `Affection: ${currentChar.affection}`;

      // AI တုံ့ပြန်ပြီးချိန်တွင်လည်း LocalStorage ထဲ ပြန်သိမ်းမည်
      saveCurrentCharState();

    } catch (err) {
      loadingElem.innerText = `Error: ${err.message}`;
      loadingElem.classList.add('error');
    }
  }

  // Active ဖြစ်နေသော Character ၏ Data ကို LocalStorage သို့ သိမ်းမည့် Function
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
});
        
