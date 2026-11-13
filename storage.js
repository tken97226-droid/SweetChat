export const SUPPORTED_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
];

export function getSelectedModel() {
  const saved = localStorage.getItem(
    STORAGE_KEYS.SELECTED_MODEL
  );

  if (SUPPORTED_MODELS.includes(saved)) {
    return saved;
  }

  // Migrate old model IDs
  localStorage.setItem(
    STORAGE_KEYS.SELECTED_MODEL,
    'gemini-3.5-flash-lite'
  );

  return 'gemini-3.5-flash-lite';
}

export function saveSelectedModel(model) {
  if (!SUPPORTED_MODELS.includes(model)) {
    throw new Error('Unsupported Gemini model: ' + model);
  }

  localStorage.setItem(
    STORAGE_KEYS.SELECTED_MODEL,
    model
  );
}
