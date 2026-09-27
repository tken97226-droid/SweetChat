let currentCharacter = "";

function openChat(name, avatar, desc) {
    currentCharacter = name;
    document.getElementById("chat-name").innerText = name;
    document.getElementById("chat-avatar").innerText = avatar;
    
    document.getElementById("character-view").classList.add("hidden");
    document.getElementById("chat-view").classList.remove("hidden");
    
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = `<div class="message bot-message">မင်္ဂလာပါ! ငါက ${name} ပါ။ မင်းနဲ့ စကားပြောရတာ ဝမ်းသာပါတယ်။</div>`;
}

function showCharacterSelection() {
    document.getElementById("chat-view").classList.add("hidden");
    document.getElementById("character-view").classList.remove("hidden");
}

// Settings Modal Logic
const modal = document.getElementById("settings-modal");
document.getElementById("global-settings-btn").onclick = () => modal.classList.remove("hidden");
document.getElementById("close-modal-btn").onclick = () => modal.classList.add("hidden");

document.getElementById("save-key-btn").onclick = () => {
    const key = document.getElementById("api-key-input").value;
    if(key) {
        localStorage.setItem("gemini_api_key", key);
        alert("API Key Saved Successfully!");
        modal.classList.add("hidden");
    }
};
