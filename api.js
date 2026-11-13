// ==========================================
// SWEETCHAT - GEMINI AUTO FALLBACK API
// Uses Google's Gemini Interactions API
// ==========================================

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/interactions';

// Supported Gemini models
export const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
];

// Fallback order
const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash'
];

// ==========================================
// ERROR CHECK
// ==========================================

function shouldFallback(status, errorMessage = '') {
  const message = errorMessage.toLowerCase();

  // Quota / rate limit
  if (
    status === 429 ||
    message.includes('resource_exhausted') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  ) {
    return true;
  }

  // Temporary server overload
  if ([500, 502, 503, 504].includes(status)) {
    return true;
  }

  // Model unavailable
  if (
    status === 404 ||
    message.includes('model is not available') ||
    message.includes('model not found') ||
    message.includes('not available to new users') ||
    message.includes('unsupported model')
  ) {
    return true;
  }

  return false;
}

// ==========================================
// EXTRACT MESSAGE TEXT
// ==========================================

function getMessageText(message) {
  if (typeof message === 'string') {
    return message;
  }

  if (typeof message.content === 'string') {
    return message.content;
  }

  if (typeof message.text === 'string') {
    return message.text;
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .map(part => part.text || '')
      .join('');
  }

  return '';
}

// ==========================================
// CONVERT CHAT HISTORY
// ==========================================

function prepareHistory(messagesHistory = []) {
  return messagesHistory
    .map(message => {
      const role = message.role || 'user';
      const content = getMessageText(message);

      if (!content.trim()) {
        return null;
      }

      // Gemini Interactions API format
      return {
        type:
          role === 'user'
            ? 'user_input'
            : 'model_output',

        content: [
          {
            type: 'text',
            text: content
          }
        ]
      };
    })
    .filter(Boolean);
}

// ==========================================
// SEND REQUEST
// ==========================================

async function requestGemini(
  apiKey,
  model,
  systemPrompt,
  messagesHistory
) {
  const history = prepareHistory(messagesHistory);

  if (!history.length) {
    throw new Error('Chat history is empty.');
  }

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },

    body: JSON.stringify({
      model: model,

      system_instruction: systemPrompt,

      input: history,

      store: false,

      generation_config: {
        temperature: 0.9,
        max_output_tokens: 2048
      }
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      data?.error?.message ||
      data?.message ||
      `HTTP ${response.status}`;

    const error = new Error(errorMessage);

    error.status = response.status;

    throw error;
  }

  // Extract generated text
  let answer = '';

  if (typeof data.output_text === 'string') {
    answer = data.output_text;
  }

  if (!answer && Array.isArray(data.steps)) {
    answer = data.steps
      .filter(step => step.type === 'model_output')
      .flatMap(step => step.content || [])
      .filter(item => item.type === 'text')
      .map(item => item.text || '')
      .join('');
  }

  if (!answer.trim()) {
    throw new Error(
      'Gemini returned an empty response.'
    );
  }

  return answer.trim();
}

// ==========================================
// MAIN CHAT FUNCTION
// ==========================================

export async function sendChatMessage(
  apiKey,
  selectedModel,
  systemPrompt,
  messagesHistory
) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please enter your Gemini API Key.');
  }

  const selected =
    GEMINI_MODELS.includes(selectedModel)
      ? selectedModel
      : 'gemini-3.5-flash-lite';

  // Selected model first
  const modelsToTry = [
    selected,

    ...FALLBACK_MODELS.filter(
      model => model !== selected
    )
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      console.log(
        `[SweetChat] Trying Gemini model: ${model}`
      );

      const answer = await requestGemini(
        apiKey.trim(),
        model,
        systemPrompt,
        messagesHistory
      );

      console.log(
        `[SweetChat] Success: ${model}`
      );

      return answer;

    } catch (error) {
      lastError = error;

      console.error(
        `[SweetChat] ${model} failed:`,
        error.message
      );

      if (
        shouldFallback(
          error.status,
          error.message
        )
      ) {
        console.warn(
          `[SweetChat] Switching to next model...`
        );

        continue;
      }

      // Invalid API key or other non-retryable error
      throw new Error(
        `Gemini Error [${model}]: ${error.message}`
      );
    }
  }

  throw new Error(
    'All Gemini models failed. Last error: ' +
    (lastError?.message || 'Unknown error')
  );
}
