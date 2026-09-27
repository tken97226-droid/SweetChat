// Global State & Settings
let apiKey = localStorage.getItem('sweetchat_api_key') || '';
let currentCharacter = null;
let chatHistory = [];

// ==========================================
// 🎭 ဇာတ်ကောင် (၃) ယောက်၏ စရိုက်နှင့် System Prompts များ
// ==========================================
const characterPrompts = {
    'Suzuki': `မင်းက 'You and I Are Polar Opposites' (正反対な君と僕) မန်ဂါထဲက မင်းသမီး Suzuki (鈴木) ဖြစ်တယ်။
စရိုက်လက္ခဏာ: အမြဲတမ်း တက်ကြွတယ်၊ ချိုသာတယ်၊ စွမ်းအင်အပြည့်ရှိတယ်၊ ရိုးသားပြီး ခင်းမင်စရာကောင်းတယ်။ ပွင့်လင်းစွာ ပြောဆိုတတ်တယ်။
စကားပြောပုံစံ: မြန်မာလို စကားပြောတဲ့အခါ ပေါ့ပါးပျော်ရွှင်တဲ့ လှိုင်းအပြည့်နဲ့ "ဟာ!"၊ "အင်း!"၊ "တကယ်လား!" စတဲ့ စကားလုံးလေးတွေ သုံးပြီး သူငယ်ချင်းရင်းလို ချစ်စနိုး ပေါ့ပေါ့ပါးပါး စကားပြောပေးပါ။`,

    'Aria': `မင်းက အေးဆေးတည်ငြိမ်ပြီး ဗဟုသုတကြွယ်ဝတဲ့ Aria ဖြစ်တယ်။
စရိုက်လက္ခဏာ: စာအုပ်ဖတ်ရတာ ကြိုက်တယ်၊ ကူညီတတ်တယ်၊ နွေးထွေးပြီး အားကိုးရတယ်။
စကားပြောပုံစံ: ယဉ်ကျေးစူစိုက်စွာနဲ့ အေးဆေးနွေးထွေးစွာ "ရှင်"၊ "ပါနော်" စသည့် စကားလုံးများဖြင့် စကားပြန်ပြောပေးပါ။`,

    'Waguri': `မင်းက 'The Fragrant Flower Blooms With Dignity' (薫る花は凛と咲く) မန်ဂါထဲက Kaoruko Waguri (和栗薫子) ဖြစ်တယ်။
စရိုက်လက္ခဏာ: အစားအသောက် (အထူးသဖြင့် မုန့်နှင့် အချိုပွဲများ) ကြိုက်နှစ်သက်တယ်၊ အမြဲတမ်း နွေးထွေးဖော်ရွေပြီး တခြားသူတွေကို အကဲခတ်ညှာတာပေးတတ်တယ်။ ပြုံးပြုံးလေးနဲ့ ချစ်စရာကောင်းသူ ဖြစ်တယ်။
စကားပြောပုံစံ: မြန်မာလို စကားပြောတဲ့အခါ အလွန်ယဉ်ကျေးဖော်ရွေပြီး ချိုသာတဲ့ အသုံးအနှုန်းများဖြင့် "မုန့်" သို့မဟုတ် အစားအသောက်အကြောင်း ပါဝင်အောင် သဘာဝကျကျ ချစ်စနိုး စကားပြန်ပြောပေးပါ။`
};

// ==========================================
// 🚀 DOM Loaded Events & Logic
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('global-settings-btn');
    const apiModal = document.getElementById('api-modal');
    const saveApiBtn = document.getElementById('save-api-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');

    if (apiKeyInput && apiKey) {
        apiKeyInput.value = apiKey;
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            apiModal.classList.remove('hidden');
        });
    }

    if (saveApiBtn) {
        saveApiBtn.addEventListener('click', () => {
            apiKey = apiKeyInput.value.trim();
            localStorage.setItem('sweetchat_api_key', apiKey);
            apiModal.classList.add('hidden');
            alert('API Key ကို သိမ်းဆည်းပြီးပါပြီ!');
        });
    }

    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            document.getElementById('chat-view').classList.add('hidden');
            document.getElementById('character-view').classList.remove('hidden');
            document.getElementById('chat-messages').innerHTML = '';
            chatHistory = [];
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});

// ==========================================
// 💬 Chat Window ဖွင့်ခြင်း
// ==========================================
function openChat(charName, avatarUrl, charTitle) {
    if (!apiKey) {
        alert('ကျေးဇူးပြု၍ အပေါ်ညာဘက်က Settings (⚙️) ကိုနှိပ်ပြီး Gemini API Key ကို အရင်ထည့်သွင်းပေးပါ။');
        document.getElementById('api-modal').classList.remove('hidden');
        return;
    }

    currentCharacter = charName;
    document.getElementById('chat-char-name').innerText = charName;
    document.getElementById('chat-char-avatar').src = avatarUrl;
    
    document.getElementById('character-view').classList.add('hidden');
    document.getElementById('chat-view').classList.remove('hidden');

    chatHistory = [];
    
    // ဇာတ်ကောင်အလိုက် နှုတ်ဆက်စကားများ
    let greetingMsg = "မင်္ဂလာပါ!";
    if (charName === 'Suzuki') greetingMsg = "ဟေးးး! မင်္ဂလာပါ! ငါ Suzuki ပါနော်၊ နင်နဲ့ စကားပြောရတာ ဝမ်းသာပါတယ်! ✨";
    else if (charName === 'Aria') greetingMsg = "မင်္ဂလာပါ၊ ကျွန်မ Aria ပါ။ ဘာများ ကူညီပေးရမလဲရှင်။";
    else if (charName === 'Waguri') greetingMsg = "မင်္ဂလာပါရှင်! ကျွန်မ Waguri ပါ၊ တွေ့ရတာ ဝမ်းသာပါတယ်! မုန့်လေး ဘာလေး စားပြီးပြီလားဟင်? 🍰";

    addMessageToUI(greetingMsg, 'bot');
}

// ==========================================
// ✉️ Gemini API သို့ မက်ဆေ့ဂျ် ပို့ခြင်း
// ==========================================
async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const text = inputField.value.trim();
    if (!text) return;

    addMessageToUI(text, 'user');
    inputField.value = '';

    const typingId = addMessageToUI('စာရိုက်နေသည်...', 'bot-typing');

    try {
        const systemPrompt = characterPrompts[currentCharacter] || "မင်းက ကူညီတတ်တဲ့ AI မိတ်ဆွေတစ်ယောက်ဖြစ်ပါတယ်။";
        
        const contents = [
            { role: "user", parts: [{ text: `[System Instruction/Roleplay Prompt: ${systemPrompt}]` }] },
            ...chatHistory.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            })),
            { role: "user", parts: [{ text: text }] }
        ];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: contents })
        });

        const data = await response.json();
        
        const typingElem = document.getElementById(typingId);
        if (typingElem) typingElem.remove();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const reply = data.candidates[0].content.parts[0].text;
            addMessageToUI(reply, 'bot');
            
            chatHistory.push({ sender: 'user', text: text });
            chatHistory.push({ sender: 'bot', text: reply });
        } else {
            addMessageToUI("တောင်းပန်ပါတယ်၊ API Key သို့မဟုတ် တောင်းဆိုမှု မှားယွင်းနေပါသည်။ ပြန်စစ်ပေးပါရှင်။", 'bot');
        }

    } catch (error) {
        console.error(error);
        const typingElem = document.getElementById(typingId);
        if (typingElem) typingElem.remove();
        addMessageToUI("ကွန်ရက် ချိတ်ဆက်မှု အဆင်မပြေပါ။", 'bot');
    }
}

function addMessageToUI(text, type) {
    const messagesContainer = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    const msgId = 'msg-' + Date.now();
    msgDiv.id = msgId;
    
    msgDiv.className = `message ${type}-message`;
    msgDiv.innerText = text;

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return msgId;
                }
    
