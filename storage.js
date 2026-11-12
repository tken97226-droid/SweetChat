// ==========================================
// SWEETCHAT - STORAGE HANDLER
// ==========================================

const STORAGE_KEYS = {
    CHARACTERS: 'sweetchat_characters_v1',
    API_KEY: 'sweetchat_gemini_api_key',
    SELECTED_MODEL: 'sweetchat_selected_model',
    USER_PROFILE: 'sweetchat_user_profile',
    ACTIVE_CHAR: 'sweetchat_active_char_id'
};

export function getStoredCharacters() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
        return data ? JSON.parse(data) : getDefaultCharacters();
    } catch (e) {
        return getDefaultCharacters();
    }
}

export function saveCharacters(characters) {
    try {
        localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
        return true;
    } catch (e) {
        return false;
    }
}

export function getApiKey() {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
}

export function saveApiKey(key) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
}

export function getSelectedModel() {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || 'gemini-1.5-flash';
}

export function saveSelectedModel(model) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model);
}

export function getUserProfile() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        return data ? JSON.parse(data) : { name: 'User', about: '', gender: 'Other', avatar: '' };
    } catch (e) {
        return { name: 'User', about: '', gender: 'Other', avatar: '' };
    }
}

export function saveUserProfile(profile) {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function setActiveCharacterId(id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAR, id);
}

export function getActiveCharacterId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAR);
}

// မူလ Character နမူနာအချို့ (ပထမအကြိမ် ဖွင့်ချိန်တွင် သုံးရန်)
function getDefaultCharacters() {
    return [
        {
            id: 'default-1',
            name: 'Mitsuri Kanroji',
            avatar: '',
            personality: 'Cheerful, affectionate, and loving Demon Slayer Hashira.',
            speakingStyle: 'Sweet, enthusiastic, uses lots of exclamation marks.',
            systemPrompt: 'You are Mitsuri Kanroji from Demon Slayer. You love everyone and get excited easily.',
            initialChatGreeting: 'ဟ่มလို! ကိုရှမ်းရေ၊ ဒီနေ့ ဘာတွေပျော်စရာရှိလဲ ပြောပြပါဦးရှင်!',
            affection: 10,
            messages: [],
            createdByUser: false
        }
    ];
}
