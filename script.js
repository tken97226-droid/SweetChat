// Global State
let currentCharacter = "";
let apiKeysInput = localStorage.getItem("gemini_api_key") || "";
let selectedModel = localStorage.getItem("gemini_model") || "gemini-1.5-flash";

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
const modelSelect = document.getElementById("model-select");
const apiKeyInput = document.getElementById("api-key-input");
const saveKeyBtn = document.getElementById("save-key-btn");
const deleteKeyBtn = document.getElementById("delete-key-btn");
const closeModalBtn = document.getElementById("close-modal-btn");

// Character System Prompts
const systemPrompts = {
    "Suzuki": "You are Suzuki (鈴木) from 'You and I Are Polar Opposites'. You are energetic, cheerful, friendly, and talkative. Always reply in Burmese with a sweet and lively tone.",
    "Aria": "You are Aria, a calm, wise, and helpful friend. You enjoy reading and offering thoughtful advice. Always reply in Burmese with a calm and polite tone.",
    "Waguri": "You are Waguri, a warm, sweet-natured girl who loves sweets and desserts. Always reply in Burmese with a warm and affectionate tone."
};

// Character Chat Functions
function openChat(name, avatarSrc, desc) {
    currentCharacter = name;
    chatName.innerText = name;
    chatAvatarImg.src = avatarSrc;
    chatBox.innerHTML = ""; // Clear previous chat
    
    characterView.classList.add("hidden");
    chatView.classList.remove("hidden");

    // Welcome message
    appendMessage("ai", `ဟိုင်း! ငါက ${name} ပါ။ ဘာတွေပြောချင်လဲဟင်?`);
}

function showCharacterSelection() {
    chatView.classList.add("hidden");
    characterView.classList.remove("hidden");
}

// Append Message to UI
function appendMessage(sender, text) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("msg", sender);
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;
}

// Send Message Logic
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

// Helper function to get array of keys
function getApiKeys() {
    if (!apiKeysInput) return [];
    return apiKeysInput.split(/[\n,]+/).map(k => k.trim()).filter(k => k.length > 0);
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    const keys = getApiKeys();
    if (keys.length === 0) {
        alert("ကျေးဇူးပြု၍ ⚙️ Settings ထဲတွင် Gemini API Key အနည်းဆုံး တစ်ခု ထည့်သွင်းပေးပါ!");
        settingsModal.classList.remove("hidden");
        return;
    }

    appendMessage("user", message);
    userInput.value = "";

    const loadingMsg = appendMessage("ai", "စာရိုက်နေသည်...");

    let success = false;
    let lastError = "";

    for (let i = 0; i < keys.length; i++) {
        const currentKey = keys[i];
        
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${currentKey}`, {
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
                })
            });

            const data = await response.json();

            if (data.error) {
                console.warn(`Key ${i + 1} Error:`, data.error.message);
                lastError = data.error.message;
                continue;
            }

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const aiReply = data.candidates[0].content.parts[0].text;
                loadingMsg.innerText = aiReply;
                success = true;
                break;
            }
        } catch (err) {
            console.warn(`Key ${i + 1} Network Error:`, err);
            lastError = err.message || "Network Error";
        }
    }

    if (!success) {
        loadingMsg.innerText = "Error: " + lastError;
    }
}

// Modal & API Key Settings
globalSettingsBtn.addEventListener("click", () => {
    apiKeyInput.value = apiKeysInput;
    modelSelect.value = selectedModel;
    settingsModal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
});

// Save Settings
saveKeyBtn.addEventListener("click", () => {
    const keysStr = apiKeyInput.value.trim();
    selectedModel = modelSelect.value;
    
    localStorage.setItem("gemini_model", selectedModel);

    if (keysStr) {
        apiKeysInput = keysStr;
        localStorage.setItem("gemini_api_key", keysStr);
        alert("Settings သို့မဟုတ် API Key(များ) ကို သိမ်းဆည်းပြီးပါပြီ!");
        settingsModal.classList.add("hidden");
    } else {
        alert("API Key ရေးထည့်ပေးပါ။");
    }
});

// Delete Key
deleteKeyBtn.addEventListener("click", () => {
    apiKeysInput = "";
    localStorage.removeItem("gemini_api_key");
    apiKeyInput.value = "";
    alert("API Key များကို ဖျက်လိုက်ပါပြီ!");
});
