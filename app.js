import { CHARACTERS, getCurrentChapter } from './chapters.js';
import { generateWithFailover } from './api.js';

let currentCharacterKey = 'suzuki';
let messageCount = 0;
let chatHistory = [];

function getApiKey() {
  return localStorage.getItem('sweet_chat_api_key') || '';
}

function saveApiKey(key) {
  localStorage.setItem('sweet_chat_api_key', key.trim());
}

document.addEventListener('DOMContentLoaded', () => {
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const chatBox = document.getElementById('chat-box');
  const chapterBadge = document.getElementById('chapter-badge');
  const keyInput = document.getElementById('api-key-input');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const settingsModal = document.getElementById('settings-modal');

  if (keyInput) keyInput.value = getApiKey();

  if (settingsBtn) settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  if (closeModalBtn) closeModalBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', () => {
      saveApiKey(keyInput.value);
      alert('API Key ကို သိမ်းဆည်းပြီးပါပြီ!');
      settingsModal.classList.add('hidden');
    });
  }

  const charCards = document.querySelectorAll('.char-card');
  charCards.forEach(card => {
    card.addEventListener('click', (e) => {
      charCards.forEach(c => c.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');

      currentCharacterKey = target.getAttribute('data-character') || 'suzuki';
      messageCount = 0;
      chatHistory = [];
      updateChapterUI();
      
      const char = CHARACTERS[currentCharacterKey];
      appendMessage('system', `${char.name} သို့ ပြောင်းလဲလိုက်ပါပြီ။`);
    });
  });

  if (sendBtn) sendBtn.addEventListener('click', handleSend);
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
      alert('ကျေးဇူးပြု၍ Settings တွင် API Key ထည့်ပေးပါ။');
      settingsModal.classList.remove('hidden');
      return;
    }

    appendMessage('user', text);
    userInput.value = '';

    messageCount++;
    updateChapterUI();

    const activeChapter = getCurrentChapter(currentCharacterKey, messageCount);
    chatHistory.push({ role: 'user', parts: [{ text: text }] });

    const loadingDiv = appendMessage('bot', 'typing...');

    try {
      const reply = await generateWithFailover(apiKey, chatHistory, activeChapter.systemPrompt);
      loadingDiv.remove();
      appendMessage('bot', reply);
      chatHistory.push({ role: 'model', parts: [{ text: reply }] });
    } catch (err) {
      loadingDiv.remove();
      appendMessage('error', err.message || 'တုံ့ပြန်မှု မရရှိပါ။');
    }
  }

  function updateChapterUI() {
    const ch = getCurrentChapter(currentCharacterKey, messageCount);
    if (chapterBadge) {
      chapterBadge.innerText = `${ch.title} (Messages: ${messageCount})`;
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

  updateChapterUI();
});
                          
