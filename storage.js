import { DEFAULT_CHARACTERS } from './defaultCharacters.js';\nimport { DEFAULT_MODEL } from './config.js';

const KEYS = {
  CHARACTERS: 'sweetchat_characters_v2',
  ACTIVE: 'sweetchat_active_char_v1',
  API: 'sweetchat_gemini_api_key_v1',
  MODEL: 'sweetchat_selected_model_v2',
  PROFILE: 'sweet_chat_user_profile'
};

const clone = value => JSON.parse(JSON.stringify(value));

export function getStoredCharacters() {
  try {
    const raw =
      localStorage.getItem(KEYS.CHARACTERS) ||
      localStorage.getItem('sweetchat_characters_v1');

    const stored = raw ? JSON.parse(raw) : [];

    if (Array.isArray(stored) && stored.length) {
      const merged = stored
        .filter(c => c && c.id)
        .map(c => ({
          level: 1,
          affection: 0,
          messages: [],
          memory: '',
          tags: [],
          ...c,
          messages: Array.isArray(c.messages)
            ? c.messages
            : []
        }));

      for (const def of DEFAULT_CHARACTERS) {
        if (!merged.some(c => c.id === def.id)) {
          merged.push(clone(def));
        }
      }

      saveCharacters(merged);
      return merged;
    }
  } catch (error) {
    console.warn('Character data could not be loaded:', error);
  }

  const defaults = clone(DEFAULT_CHARACTERS);
  saveCharacters(defaults);

  return defaults;
}

export function saveCharacters(characters) {
  try {
    localStorage.setItem(
      KEYS.CHARACTERS,
      JSON.stringify(characters)
    );

    return true;
  } catch (error) {
    console.error('Could not save characters:', error);
    return false;
  }
}

export function getActiveCharacterId() {
  return localStorage.getItem(KEYS.ACTIVE) || 'char-suzuki';
}

export function setActiveCharacterId(id) {
  localStorage.setItem(KEYS.ACTIVE, id);
}

export function getActiveCharacter() {
  const list = getStoredCharacters();

  return (
    list.find(c => c.id === getActiveCharacterId()) ||
    list[0] ||
    null
  );
}

export function getApiKey() {
  return localStorage.getItem(KEYS.API) || '';
}

export function saveApiKey(key) {
  localStorage.setItem(
    KEYS.API,
    String(key || '').trim()
  );
}

export function getSelectedModel() {
  const saved = localStorage.getItem(KEYS.MODEL) || '';
  // Migrate the old OpenRouter selection without touching any saved character data.
  if (!saved || saved === 'openrouter/free' || saved.includes(':free') || saved.includes('/')) {
    return DEFAULT_MODEL;
  }
  return saved;
}

export function saveSelectedModel(model) {
  localStorage.setItem(KEYS.MODEL, model);
}

export function getUserProfile() {
  try {
    return {
      name: 'User',
      avatar: '',
      about: '',
      gender: 'Other',
      ...JSON.parse(
        localStorage.getItem(KEYS.PROFILE) || '{}'
      )
    };
  } catch {
    return {
      name: 'User',
      avatar: '',
      about: '',
      gender: 'Other'
    };
  }
}

export function saveUserProfile(profile) {
  localStorage.setItem(
    KEYS.PROFILE,
    JSON.stringify(profile)
  );
}
