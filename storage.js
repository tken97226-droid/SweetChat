// storage.js
import { DEFAULT_CHARACTERS } from './config.js';

export function getStoredCharacters() {
  const data = localStorage.getItem('sweet_chat_characters');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing stored characters', e);
    }
  }
  return DEFAULT_CHARACTERS;
}

export function saveCharacters(characters) {
  localStorage.setItem('sweet_chat_characters', JSON.stringify(characters));
}

export function getActiveCharacterId() {
  return localStorage.getItem('sweet_chat_active_char_id');
}

export function setActiveCharacterId(id) {
  localStorage.setItem('sweet_chat_active_char_id', id);
}

export function getApiKey() {
  return localStorage.getItem('openrouter_api_key') || '';
}

export function saveApiKey(key) {
  localStorage.setItem('openrouter_api_key', key);
}

export function getSelectedModel() {
  return localStorage.getItem('selected_model') || 'google/gemini-2.0-flash-lite-preview-02-05:free';
}

export function saveSelectedModel(model) {
  localStorage.setItem('selected_model', model);
}

export function getUserName() {
  return localStorage.getItem('user_profile_name') || 'User';
}

export function saveUserName(name) {
  localStorage.setItem('user_profile_name', name);
}
