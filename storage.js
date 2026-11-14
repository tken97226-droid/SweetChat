import { DEFAULT_CHARACTERS } from './defaultCharacters.js';
import { DEFAULT_MODEL, FREE_MODELS } from './config.js';

const STORAGE_KEYS = {
  CHARACTERS: 'sweetchat_characters_v1',
  ACTIVE_CHARACTER_ID: 'sweetchat_active_char_id_v1',
  API_KEYS: 'sweetchat_gemini_api_key_v1',
  SELECTED_MODEL: 'sweetchat_selected_model_v1',
  USER_NAME: 'sweetchat_user_name_v1'
};

export function getStoredCharacters() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHARACTERS);

    if (raw) {
      let parsed = JSON.parse(raw);

      if (Array.isArray(parsed) && parsed.length > 0) {
        let updated = false;

        DEFAULT_CHARACTERS.forEach(defaultChar => {
          const exists = parsed.some(c => c.id === defaultChar.id);

          if (!exists) {
            parsed.push(defaultChar);
            updated = true;
          }
        });

        if (updated) {
          saveCharacters(parsed);
        }

        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load stored characters:', e);
  }

  saveCharacters(DEFAULT_CHARACTERS);
  return DEFAULT_CHARACTERS;
}

export function saveCharacters(characters) {
  try {
    localStorage.setItem(
      STORAGE_KEYS.CHARACTERS,
      JSON.stringify(characters)
    );
  } catch (e) {
    console.error('Failed to save characters:', e);
  }
}

export function getActiveCharacterId() {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHARACTER_ID) || 'char-suzuki';
}

export function setActiveCharacterId(id) {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_CHARACTER_ID, id);
}

export function getActiveCharacter() {
  const chars = getStoredCharacters();
  const activeId = getActiveCharacterId();

  return chars.find(c => c.id === activeId) || chars[0] || DEFAULT_CHARACTERS[0];
}

export function getApiKey() {
  return localStorage.getItem(STORAGE_KEYS.API_KEYS) || '';
}

export function saveApiKey(key) {
  localStorage.setItem(STORAGE_KEYS.API_KEYS, key.trim());
}

export function getSelectedModel() {
  const savedModel = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);

  return FREE_MODELS.includes(savedModel) ? savedModel : DEFAULT_MODEL;
}

export function saveSelectedModel(model) {
  localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model);
}
