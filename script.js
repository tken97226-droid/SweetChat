// Global State Storage
let currentCharacter = "";
let apiKeysInput = localStorage.getItem("gemini_api_key") || "";
let currentTheme = localStorage.getItem("app_theme") || "blue"; // 'blue' or 'dark'

// DOM Elements
const characterView = document.getElementById("character-view");
const chatView = document.getElementById("chat-view");
const chatBox = document.getElementById("chat-box");
const chatName = document.getElementById("chat-name");
const chatAvatarImg = document.getElementById("chat-avatar-img");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

const settingsModal = document.getElementById("settings-modal");
const globalSettingsBtn = document.getElementById("global-settings-btn");
const apiKeyInput = document.getElementById("api-key-input");
const saveKeyBtn = document.getElementById("save-key-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const closeXBtn = document.getElementById("close-x-btn");

// Init App Setup
document.addEventListener("DOMContentLoaded", () => {
    setTheme(currentTheme);
});

// Character System Prompts
const systemPrompts = {
    "Suzuki": "You are Suzuki (鈴木) from 'You and I Are Polar Opposites'. You are energetic, cheerful, friendly, and talkative. Always reply in Burmese with a sweet and lively tone.",
    "Aria": "You are Aria, a calm, wise, and helpful friend. You enjoy reading and offering thoughtful advice. Always reply in Burmese with a calm and polite tone.",
    "Waguri": "You are Waguri, a warm, sweet-natured girl who loves sweets and desserts. Always reply in Burmese with a warm and affectionate tone."
};

// UI Handlers: Theme Switcher (Blue Navy vs Pure Dark)
function setTheme(theme) {
    currentTheme = theme;
    const darkBtn = document.getElementById("theme-dark-btn");
    const lightBtn = document.getElementById("theme-light-btn");

    if (theme === "dark") {
        document.body.classList.add("dark-theme");
        if (darkBtn) darkBtn.classList.add("active");
        if (lightBtn) lightBtn.classList.remove("active");
    } else {
        document.body.classList.remove("dark-theme");
        if (lightBtn) lightBtn.classList.add("active");
        if (darkBtn) darkBtn.classList.remove("active");
    }
}

// Character Chat View Trigger
function openChat(name, avatarSrc, desc) {
    currentCharacter = name;
    chatName.innerText = name;
    chatAvatarImg.src = avatarSrc;
    chatBox.innerHTML = ""; 
    
    characterView.classList.add("hidden");
    chatView.classList.remove("hidden");

    appendMessage("ai", `ဟိုင်း! ငါက ${name} ပါ။ ဘာတွေပြောချင်လဲဟင်?`);
}

function showCharacterSelection() {
    chatView.classList.add("hidden");
    characterView.classList.remove("hidden");
}

// Append Message UI Helper
function appendMessage(sender, text) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("msg", sender);
    if (typeof text === "string") {
        msgDiv.innerText = text;
    } else {
        msgDiv.appendChild(text);
    }
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;
}

// Messenger Style Typing Indicator Component
function createTypingIndicator() {
    const container = document.createElement("div");
    container.classList.add("typing-dots");
    container.innerHTML = `<span></span><span></span><span></span>`;
    return container;
}

// Send Message Logic
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

function getApiKeys() {
    if (!apiKeysInput) return [];
    return apiKeysInput
        .split(/[\n,]+/)
        .map(k => k.trim())
        .filter(k => k.length > 5);
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    const keys = getApiKeys();
    if (keys.length === 0) {
        alert("ကျေးဇူးပြု၍ ⚙️ ဆက်တင် ထဲတွင် Gemini API Key ထည့်သွင်းပေးပါ!");
        settingsModal.classList.remove("hidden");
        return;
    }

    appendMessage("user", message);
    userInput.value = "";

    // Show Messenger ... Typing Animation
    const typingIndicatorNode = createTypingIndicator();
    const loadingMsg = appendMessage("ai", typingIndicatorNode);

    let success = false;
    let lastError = "";

    // တရားဝင် အမှန်အကန် အလုပ်လုပ်သည့် gemini-1.5-flash
    const targetModel = "gemini-1.5-flash";

    for (let i = 0; i < keys.length; i++) {
        const currentKey = keys[i];
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${currentKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: systemPrompts[currentCharacter] || "Reply nicely in Burmese." },
                                { text: message }
                            ]
                        }
                    ]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (data.error) {
                console.warn(`API Key ${i + 1} Error:`, data.error.message);
                lastError = data.error.message;
                continue;
            }

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const aiReply = data.candidates[0].content.parts[0].text;
                loadingMsg.innerHTML = "";
                loadingMsg.innerText = aiReply;
                success = true;
                break;
            }
        } catch (err) {
            console.warn(`Fetch Error:`, err);
            lastError = err.name === 'AbortError' ? 'Request Timeout (လိုင်းနှေးနေပါသည်)' : (err.message || "Network Error");
        }
    }

    if (!success) {
        loadingMsg.innerText = "Error: " + lastError;
    }
}

function checkKeys() {
    const keys = getApiKeys();
    if (keys.length > 0) {
        alert(`သော့ ${keys.length} ခု တွေ့ရှိပါသည်။ စစ်ဆေးမှု အဆင်ပြေပါသည်။`);
    } else {
        alert("မည်သည့် API သော့မှ မတွေ့ရှိပါ။ ကျေးဇူးပြု၍ API သော့ ရေးထည့်ပါ။");
    }
}

// Modal Toggle Logic
globalSettingsBtn.addEventListener("click", () => {
    apiKeyInput.value = apiKeysInput;
    settingsModal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));
if (closeXBtn) closeXBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));

// Save Settings Event
saveKeyBtn.addEventListener("click", () => {
    const keysStr = apiKeyInput.value.trim();
    
    localStorage.setItem("app_theme", currentTheme);

    if (keysStr) {
        apiKeysInput = keysStr;
        localStorage.setItem("gemini_api_key", keysStr);
        alert("ဆက်တင်များ အားလုံးကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ!");
        settingsModal.classList.add("hidden");
    } else {
        alert("API Key ရေးထည့်ပေးပါ။");
    }
});
    
