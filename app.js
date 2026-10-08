import { 
  getStoredCharacters, 
  saveCharacters, 
  getActiveCharacter, 
  setActiveCharacterId, 
  getApiKey, 
  saveApiKey, 
  getSelectedModel, 
  saveSelectedModel 
} from './storage.js';
import { sendChatMessage } from './api.js';
import { evaluateAffection } from './affectionEngine.js';

let characters = [];
let activeCharacter = null;

// User Profile State & Helper Functions
let userProfile = {
  name: 'User',
  avatar: 'https://via.placeholder.com/90',
  about: '',
  gender: 'Male'
};

function loadUserProfile() {
  const saved = localStorage.getItem('sweet_chat_user_profile');
  if (saved) {
    try {
      userProfile = { ...userProfile, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
  }
}

function saveUserProfileData(data) {
  userProfile = { ...userProfile, ...data };
  localStorage.setItem('sweet_chat_user_profile', JSON.stringify(userProfile));
}

// DOM Elements
const chatsView = document.getElementById('chats-view');
const profileView = document.getElementById('profile-view');
const settingsView = document.getElementById('settings-view');
const chatScreenView = document.getElementById('chat-screen-view');

const characterCardsList = document.getElementById('character-cards-list');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

const backBtn = document.getElementById('back-btn');
const charAvatar = document.getElementById('char-avatar');
const headerTitle = document.getElementById('header-title');
const headerStatus = document.getElementById('header-status');
const newChatBtn = document.getElementById('new-chat-btn');
const bottomNav = document.getElementById('bottom-nav');

// Profile DOM Elements
const userAvatarPreview = document.getElementById('user-avatar-preview');
const userAvatarInput = document.getElementById('user-avatar-input');
const userNameInput = document.getElementById('user-name-input');
const userAboutInput = document.getElementById('user-about-input');
const userGenderSelect = document.getElementById('user-gender-select');
const saveProfileBtn = document.getElementById('save-profile-btn');

// Settings DOM Elements
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const modelSelect = document.getElementById('model-select');

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  characters = getStoredCharacters();
  loadUserProfile();

  // Populate Profile Form Data
  if (userAvatarPreview && userProfile.avatar) userAvatarPreview.src = userProfile.avatar;
  if (userNameInput) userNameInput.value = userProfile.name || '';
  if (userAboutInput) userAboutInput.value = userProfile.about || '';
  if (userGenderSelect) userGenderSelect.value = userProfile.gender || 'Male';

  // Settings Initial Load
  const savedKey = getApiKey();
  if (savedKey && apiKeyInput) apiKeyInput.value = savedKey;

  const savedModel = getSelectedModel();
  if (savedModel && modelSelect) modelSelect.value = savedModel;

  renderCharacterList();
  setupNavigation();

  // Profile Image Upload Listener
  if (userAvatarInput) {
    userAvatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          userAvatarPreview.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Save Profile Handler
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
      saveUserProfileData({
        name: userNameInput.value.trim() || 'User',
        avatar: userAvatarPreview.src,
        about: userAboutInput.value.trim(),
        gender: userGenderSelect.value
      });
      alert('Profile သိမ်းဆည်းပြီးပါပြီ!');
    });
  }

  // Settings Handlers
  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', () => {
      const key = apiKeyInput.value.trim();
      saveApiKey(key);
      alert('API Key သိမ်းဆည်းပြီးပါပြီ!');
    });
  }

  if (modelSelect) {
    modelSelect.addEventListener('change', (e) => {
      saveSelectedModel(e.target.value);
    });
  }

  // Chat Event Listeners
  if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSendMessage();
    });
  }

  if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
      if (activeCharacter && confirm(`${activeCharacter.name} နှင့် စကားပြောထားသည်များကို ဖျက်ပြီး စကားစတင်လိုပါသလား?`)) {
        activeCharacter.messages = [];
        saveCharacters(characters);
        renderMessages();
      }
    });
  }

  if (backBtn) backBtn.addEventListener('click', showChatsTab);
});

// Render List of Characters
function renderCharacterList() {
  if (!characterCardsList) return;
  characterCardsList.innerHTML = '';

  characters.forEach(char => {
    const lastMsgObj = char.messages && char.messages.length > 0 ? char.messages[char.messages.length - 1] : null;
    const lastMsg = lastMsgObj ? lastMsgObj.content : (char.initialChatGreeting || "နှုတ်ဆက်လိုက်ပါ...");

    const card = document.createElement('div');
    card.className = 'chat-list-item';
    card.innerHTML = `
      <img src="${char.avatar}" alt="${char.name}" onerror="this.src='https://via.placeholder.com/50'">
      <div class="chat-info">
        <div class="chat-info-top">
          <h3>${char.name}</h3>
          <span class="badge">Affection: ${char.affection || 0}</span>
        </div>
        <div class="chat-last-msg">${lastMsg}</div>
      </div>
    `;
    card.addEventListener('click', () => openChatScreen(char));
    characterCardsList.appendChild(card);
  });
}

// Bottom Navigation Setup
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      if (targetTab === 'chats-view') {
        showChatsTab();
      } else if (targetTab === 'profile-view') {
        showProfileTab();
      } else if (targetTab === 'settings-view') {
        showSettingsTab();
      }
    });
  });
}

function showChatsTab() {
  chatsView.classList.add('active');
  if (profileView) profileView.classList.remove('active');
  settingsView.classList.remove('active');
  chatScreenView.classList.remove('active');

  backBtn.style.display = 'none';
  charAvatar.style.display = 'none';
  headerTitle.textContent = 'SweetChat';
  headerStatus.style.display = 'none';
  newChatBtn.style.display = 'none';
  bottomNav.style.display = 'flex';

  activeCharacter = null;
  renderCharacterList();
}

function showProfileTab() {
  chatsView.classList.remove('active');
  if (profileView) profileView.classList.add('active');
  settingsView.classList.remove('active');
  chatScreenView.classList.remove('active');

  backBtn.style.display = 'none';
  charAvatar.style.display = 'none';
  headerTitle.textContent = 'My Profile';
  headerStatus.style.display = 'none';
  newChatBtn.style.display = 'none';
  bottomNav.style.display = 'flex';
}

function showSettingsTab() {
  chatsView.classList.remove('active');
  if (profileView) profileView.classList.remove('active');
  settingsView.classList.add('active');
  chatScreenView.classList.remove('active');

  backBtn.style.display = 'none';
  charAvatar.style.display = 'none';
  headerTitle.textContent = 'Settings';
  headerStatus.style.display = 'none';
  newChatBtn.style.display = 'none';
  bottomNav.style.display = 'flex';
}

function openChatScreen(character) {
  activeCharacter = character;
  setActiveCharacterId(character.id);

  chatsView.classList.remove('active');
  if (profileView) profileView.classList.remove('active');
  settingsView.classList.remove('active');
  chatScreenView.classList.add('active');

  // App Bar Setup
  backBtn.style.display = 'block';
  charAvatar.style.display = 'block';
  charAvatar.src = character.avatar;
  headerTitle.textContent = character.name;
  headerStatus.style.display = 'block';
  headerStatus.textContent = `Affection: ${character.affection || 0}`;
  newChatBtn.style.display = 'block';
  bottomNav.style.display = 'none';

  // Chat Box Initializing
  if (!character.messages || character.messages.length === 0) {
    if (character.initialChatGreeting) {
      character.messages = [{ role: 'assistant', content: character.initialChatGreeting }];
      saveCharacters(characters);
    }
  }

  renderMessages();
}

function renderMessages() {
  if (!chatBox || !activeCharacter) return;
  chatBox.innerHTML = '';
  
  (activeCharacter.messages || []).forEach(msg => {
    appendMessageUI(msg.role, msg.content);
  });
  scrollToBottom();
}

function appendMessageUI(role, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role === 'user' ? 'user' : 'model'}`;
  msgDiv.textContent = text;
  chatBox.appendChild(msgDiv);
  scrollToBottom();
}

function scrollToBottom() {
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

// Message Dispatch & Affection Handling Logic
async function handleSendMessage() {
  const text = chatInput.value.trim();
  if (!text || !activeCharacter) return;

  const apiKey = getApiKey();
  if (!apiKey) {
    alert('ကျေးဇူးပြု၍ Settings ထဲတွင် OpenRouter API Key ကို အရင်ထည့်သွင်းပေးပါ!');
    return;
  }

  // 1. User Message Push
  if (!activeCharacter.messages) activeCharacter.messages = [];
  activeCharacter.messages.push({ role: 'user', content: text });
  appendMessageUI('user', text);
  chatInput.value = '';
  saveCharacters(characters);

  // 2. Typing Indicator Render
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message model';
  typingDiv.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
  chatBox.appendChild(typingDiv);
  scrollToBottom();

  try {
    const selectedModel = getSelectedModel();

    // Dynamically Inject User Profile into System Prompt
    const fullSystemPrompt = `${activeCharacter.systemPrompt}

USER PROFILE INFORMATION:
- Name: ${userProfile.name}
- Gender: ${userProfile.gender}
- About User: ${userProfile.about || 'Not provided'}`;

    // 3. API Request
    const rawReply = await sendChatMessage(
      apiKey,
      selectedModel,
      fullSystemPrompt,
      activeCharacter.messages
    );

    // Typing Animation Remove
    if (chatBox.contains(typingDiv)) {
      chatBox.removeChild(typingDiv);
    }

    // 4. Affection Sentiment Analysis
    const { cleanText, affectionDelta } = evaluateAffection(rawReply, text);

    // Affection Update
    activeCharacter.affection = (activeCharacter.affection || 0) + affectionDelta;
    headerStatus.textContent = `Affection: ${activeCharacter.affection}`;

    // 5. Assistant Response Push
    activeCharacter.messages.push({ role: 'assistant', content: cleanText });
    appendMessageUI('model', cleanText);

    saveCharacters(characters);
  } catch (error) {
    if (chatBox.contains(typingDiv)) {
      chatBox.removeChild(typingDiv);
    }
    appendMessageUI('model', ` Error: ${error.message}`);
  }
  }
    
