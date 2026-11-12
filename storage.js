// ==========================================
// SWEETCHAT - STORAGE SYSTEM
// GOOGLE GEMINI VERSION
// ==========================================

import { DEFAULT_CHARACTERS } from './defaultCharacters.js';

// ==========================================
// LOCAL STORAGE KEYS
// ==========================================

const KEYS = {
  CHARACTERS: 'sweetchat_characters_v2',
  ACTIVE: 'sweetchat_active_char_v1',
  API: 'sweetchat_api_keys_v1',
  MODEL: 'sweetchat_selected_model_v2',
  PROFILE: 'sweet_chat_user_profile'
};

// Gemini Default Model
const DEFAULT_MODEL = 'gemini-3.8-flash';

// Clone data safely
const clone = value => JSON.parse(JSON.stringify(value));


// ==========================================
// CHARACTER STORAGE
// ==========================================

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

      // Add newly created default characters
      // without deleting existing characters.

      for (const def of DEFAULT_CHARACTERS) {
        if (!merged.some(c => c.id === def.id)) {
          merged.push(clone(def));
        }
      }

      saveCharacters(merged);

      return merged;
    }

  } catch (error) {
    console.warn(
      'Character data could not be loaded:',
      error
    );
  }

  // Load default characters if storage is empty.

  const defaults = clone(DEFAULT_CHARACTERS);

  saveCharacters(defaults);

  return defaults;
}


// ==========================================
// SAVE CHARACTERS
// ==========================================

export function saveCharacters(characters) {
  try {
    localStorage.setItem(
      KEYS.CHARACTERS,
      JSON.stringify(characters)
    );

    return true;

  } catch (error) {
    console.error(
      'Could not save characters:',
      error
    );

    return false;
  }
}


// ==========================================
// ACTIVE CHARACTER
// ==========================================

export function getActiveCharacterId() {
  return (
    localStorage.getItem(KEYS.ACTIVE) ||
    'char-suzuki'
  );
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


// ==========================================
// GOOGLE GEMINI API KEY
// ==========================================

export function getApiKey() {
  return localStorage.getItem(KEYS.API) || '';
}


export function saveApiKey(key) {
  localStorage.setItem(
    KEYS.API,
    String(key || '').trim()
  );
}


// ==========================================
// GEMINI MODEL STORAGE
// ==========================================

export function getSelectedModel() {

  const savedModel = localStorage.getItem(KEYS.MODEL);

  // No saved model: use Gemini default.

  if (!savedModel) {
    localStorage.setItem(
      KEYS.MODEL,
      DEFAULT_MODEL
    );

    return DEFAULT_MODEL;
  }

  // Convert old OpenRouter model selection
  // into the Gemini default model.

  if (!savedModel.startsWith('gemini-')) {
    localStorage.setItem(
      KEYS.MODEL,
      DEFAULT_MODEL
    );

    return DEFAULT_MODEL;
  }

  return savedModel;
}


export function saveSelectedModel(model) {
  localStorage.setItem(
    KEYS.MODEL,
    model
  );
}


// ==========================================
// USER PROFILE
// ==========================================

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
