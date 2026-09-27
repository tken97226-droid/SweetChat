// Global State
let currentCharacter = "";
let apiKey = localStorage.getItem("gemini_api_key") || "";

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

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    if (!apiKey) {
        alert("ကျေးဇူးပြု၍ ⚙️ Settings ထဲတွင် Gemini API Key အရင်ထည့်သွင်းပေးပါ!");
        settingsModal.classList.remove("hidden");
        return;
    }

    appendMessage("user", message);
    userInput.value = "";

    const loadingMsg = appendMessage("ai", "စာရိုက်နေသည်...");

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
            loadingMsg.innerText = "Error: " + data.error.message;
        } else {
            const aiReply = data.candidates[0].content.parts[0].text;
            loadingMsg.innerText = aiReply;
        }
    } catch (err) {
        loadingMsg.innerText = "အင်တာနက် သို့မဟုတ် API Key အမှားအယွင်း ရှိနေပါသည်။";
    }
}

// Modal & API Key Settings
globalSettingsBtn.addEventListener("click", () => {
    apiKeyInput.value = apiKey; // Load saved key into input
    settingsModal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
});

// Save Key
saveKeyBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        apiKey = key;
        localStorage.setItem("gemini_api_key", key);
        alert("API Key သိမ်းဆည်းပြီးပါပြီ!");
        settingsModal.classList.add("hidden");
    } else {
        alert("API Key ရေးထည့်ပေးပါ။");
    }
});

// Delete Key
deleteKeyBtn.addEventListener("click", () => {
    apiKey = "";
    localStorage.removeItem("gemini_api_key");
    apiKeyInput.value = "";
    alert("API Key ကို ဖျက်လိုက်ပါပြီ!");
});
    
