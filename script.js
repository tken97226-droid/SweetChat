const yorCharacter = {
    name: 'Yor Forger',
    avatar: './Yor Forger.jpeg',
    greeting: 'အာ... မင်္ဂလာပါရှင်! ကျမ နာမည်က Yor Forger ပါ။ အဆင်ပြေရင် စကားခဏ ပြောလို့ ရမလားဟင်?',
    prompt: `[ROLEPLAY IDENTITY]
Name: Yor Forger (Thorn Princess)
Anime: Spy x Family
Personality: သာမန်အချိန်မှာ အင်မတန် အားနာတတ်ပြီး ရှက်တတ်လွယ်တဲ့ မိန်းကလေး၊ သို့သော် လိုအပ်လာရင် အလွန် အစွမ်းထက်တဲ့ ကြေးစား လုပ်ကြံသူ (Thorn Princess) ဖြစ်သွားသူ။

[SPEAKING STYLE & TONE]
1. "ရှင်" နဲ့ "ကျမ" ကို အလွန် ယဉ်ကျေး အားနာတဲ့ လေသံနဲ့ သုံးပါ။
2. စကားပြောရင် ဖြူစင်ထွက်ပြီး "အာ.. ခွင့်လွှတ်ပါဦး!" သို့မဟုတ် "ကျမ ကြိုးစားလိုက်ပါ့မယ်!" စသည်ဖြင့် ပြောတတ်သည်။
3. *လက်ကလေးတွေ ယှက်ထားရင်း အားနာကြီး ကြည့်လိုက်ရင်း*, *မျက်နှာလေး ရဲသွားရင်း* စသည်ဖြင့် Action text များကို ထည့်ရေးပါ။
4. Speak ONLY IN BURMESE.`
};

let messageHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initChat();
});

function initChat() {
    if (messageHistory.length === 0) {
        messageHistory.push({ role: 'assistant', content: yorCharacter.greeting });
    }
    renderMessages();
}

function renderMessages() {
    const box = document.getElementById('chatMessagesBox');
    box.innerHTML = '';

    messageHistory.forEach(msg => {
        const isUser = msg.role === 'user';
        const msgEl = document.createElement('div');
        msgEl.className = `message ${isUser ? 'user' : 'model'}`;
        msgEl.innerText = msg.content;
        box.appendChild(msgEl);
    });

    box.scrollTop = box.scrollHeight;
}

window.sendMessage = async function() {
    const inputField = document.getElementById('userInputField');
    const text = inputField.value.trim();
    if (!text) return;

    const apiKey = localStorage.getItem('openrouter_key');
    if (!apiKey) {
        alert('Settings (⚙️) ကိုနှိပ်ပြီး OpenRouter API Key ကို အရင်ထည့်သွင်းပေးပါ!');
        toggleModal(true);
        return;
    }

    messageHistory.push({ role: 'user', content: text });
    inputField.value = '';
    renderMessages();

    // Loading Indicator
    const box = document.getElementById('chatMessagesBox');
    const loadingEl = document.createElement('div');
    loadingEl.className = 'message model loading';
    loadingEl.id = 'loadingIndicator';
    loadingEl.innerText = 'Yor စဉ်းစားနေပါတယ်...';
    box.appendChild(loadingEl);
    box.scrollTop = box.scrollHeight;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'SweetChat'
            },
            body: JSON.stringify({
                model: 'google/gemma-4-31b-it:free',
                messages: [
                    { role: 'system', content: yorCharacter.prompt },
                    ...messageHistory.map(m => ({ role: m.role, content: m.content }))
                ]
            })
        });

        const data = await response.json();
        document.getElementById('loadingIndicator')?.remove();

        if (data.error) {
            messageHistory.push({ role: 'assistant', content: `API Error: ${data.error.message || 'Key သို့မဟုတ် Model မှားယွင်းနေပါသည်။'}` });
        } else if (data.choices && data.choices[0]?.message?.content) {
            const reply = data.choices[0].message.content;
            messageHistory.push({ role: 'assistant', content: reply });
        } else {
            messageHistory.push({ role: 'assistant', content: 'တုံ့ပြန်မှု မရရှိပါ။ API Key ကို စစ်ဆေးပေးပါ။' });
        }

        renderMessages();

    } catch (err) {
        document.getElementById('loadingIndicator')?.remove();
        messageHistory.push({ role: 'assistant', content: 'Network Error: အင်တာနက် ချိတ်ဆက်မှု မရရှိပါ။' });
        renderMessages();
    }
}

window.toggleModal = function(show) {
    const modal = document.getElementById('settingsModal');
    if (show) {
        modal.classList.add('active');
        const savedKey = localStorage.getItem('openrouter_key');
        if (savedKey) document.getElementById('apiKeyInputField').value = savedKey;
    } else {
        modal.classList.remove('active');
    }
}

window.saveSettings = function() {
    const key = document.getElementById('apiKeyInputField').value.trim();
    if (!key) {
        alert('API Key ထည့်သွင်းပေးပါ!');
        return;
    }
    localStorage.setItem('openrouter_key', key);
    toggleModal(false);
    alert('API Key သိမ်းဆည်းပြီးပါပြီ!');
}

function loadSettings() {
    const savedKey = localStorage.getItem('openrouter_key');
    if (savedKey) document.getElementById('apiKeyInputField').value = savedKey;
}
