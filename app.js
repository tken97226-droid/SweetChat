// ==========================================
// SWEETCHAT - MAIN APPLICATION
// Gemini + Gemma Auto Fallback System
// ==========================================


// ==========================================
// 1. CHARACTER CONFIGURATION
// ==========================================

const characters = [
  {
    id: "sakura",
    name: "Sakura",
    tag: "Cheerful childhood friend",
    initial: "S",
    color: "linear-gradient(135deg,#8b5b91,#e18eb8)",

    persona: `
You are Sakura, a cheerful and caring anime girl.
You are the user's childhood friend.

Personality:
- Sweet and friendly
- Sometimes shy
- Playful and affectionate
- Loves talking with the user

Stay in character.
Speak naturally.
Reply in the same language as the user.
`
  },

  {
    id: "rei",
    name: "Rei",
    tag: "Quiet and mysterious",
    initial: "R",
    color: "linear-gradient(135deg,#455a88,#8a9cc8)",

    persona: `
You are Rei, a quiet and mysterious anime character.

Personality:
- Calm and intelligent
- Quiet but caring
- Sometimes mysterious
- Does not talk too much

Stay in character.
Speak naturally.
Reply in the same language as the user.
`
  },

  {
    id: "yuki",
    name: "Yuki",
    tag: "Playful rival",
    initial: "Y",
    color: "linear-gradient(135deg,#8a5a43,#e5a36f)",

    persona: `
You are Yuki, a playful and confident anime rival.

Personality:
- Teasing
- Competitive
- Funny
- Secretly caring

Stay in character.
Speak naturally.
Reply in the same language as the user.
`
  },

  {
    id: "hina",
    name: "Hina",
    tag: "Gentle book lover",
    initial: "H",
    color: "linear-gradient(135deg,#527a70,#9dc7ae)",

    persona: `
You are Hina, a gentle and shy anime girl.

Personality:
- Soft-spoken
- Loves books
- Kind and supportive
- Enjoys peaceful conversations

Stay in character.
Speak naturally.
Reply in the same language as the user.
`
  }
];


// ==========================================
// 2. GEMINI MODEL CONFIGURATION
// ==========================================

const AVAILABLE_MODELS = [

  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash"
  },

  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash"
  },

  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite"
  },

  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash"
  },

  {
    id: "gemma-4-31b-it",
    name: "Gemma 4 31B"
  },

  {
    id: "gemma-4-26b-a4b-it",
    name: "Gemma 4 26B MoE"
  }

];


// ==========================================
// 3. STORAGE
// ==========================================

function getStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    return value ? JSON.parse(value) : fallback;

  } catch (error) {
    return fallback;
  }
}


let histories = getStorage(
  "sweetchat_histories",
  {}
);


let activeCharacter = characters[0];

let busy = false;


function saveHistories() {

  try {

    localStorage.setItem(
      "sweetchat_histories",
      JSON.stringify(histories)
    );

  } catch (error) {

    console.error("History save failed:", error);

  }

}


function getHistory() {

  return histories[activeCharacter.id] || [];

}


// ==========================================
// 4. HTML ELEMENTS
// ==========================================

const $ = (id) => document.getElementById(id);


// ==========================================
// 5. CHARACTER LIST
// ==========================================

function renderCharacters() {

  const list = $("characterList");

  list.innerHTML = "";

  characters.forEach(character => {

    const button = document.createElement("button");

    button.className =
      "character" +
      (
        character.id === activeCharacter.id
          ? " active"
          : ""
      );

    const avatar = document.createElement("span");

    avatar.className = "avatar";

    avatar.style.background = character.color;

    avatar.textContent = character.initial;


    const info = document.createElement("span");

    const name = document.createElement("b");

    name.textContent = character.name;

    const tag = document.createElement("small");

    tag.textContent = character.tag;


    info.append(name, tag);

    button.append(avatar, info);


    button.addEventListener("click", () => {

      selectCharacter(character);

    });


    list.appendChild(button);

  });

}


// ==========================================
// 6. SELECT CHARACTER
// ==========================================

function selectCharacter(character) {

  activeCharacter = character;

  $("headerName").textContent = character.name;

  $("headerAvatar").textContent = character.initial;

  $("headerAvatar").style.background =
    character.color;

  $("headerStatus").textContent =
    character.tag;

  renderCharacters();

  renderMessages();

}


// ==========================================
// 7. CHAT MESSAGE RENDERING
// ==========================================

function renderMessages() {

  const messages = getHistory();

  $("messages").innerHTML = "";

  $("welcome").style.display =
    messages.length ? "none" : "flex";


  messages.forEach(message => {

    addMessageElement(
      message.role,
      message.text
    );

  });


  scrollToBottom();

}


function addMessageElement(role, text) {

  const row = document.createElement("div");

  row.className =
    "message " + role;


  const avatar = document.createElement("div");

  avatar.className = "avatar small";


  if (role === "user") {

    avatar.textContent = "You";

  } else {

    avatar.textContent =
      activeCharacter.initial;

    avatar.style.background =
      activeCharacter.color;

  }


  const bubble = document.createElement("div");

  bubble.className = "bubble";

  bubble.textContent = text;


  row.append(avatar, bubble);

  $("messages").appendChild(row);

}


function scrollToBottom() {

  const area = $("chatArea");

  area.scrollTop = area.scrollHeight;

}


// ==========================================
// 8. SETTINGS
// ==========================================

function showSettings() {

  const dialog = $("settingsDialog");

  $("apiKeyInput").value =
    localStorage.getItem("sweetchat_gemini_key") || "";


  const savedModel =
    localStorage.getItem("sweetchat_model") ||
    "gemini-3.8-flash";


  $("modelSelect").value = savedModel;

  $("keyStatus").textContent = "";

  dialog.showModal();

}


$("settingsBtn").addEventListener(
  "click",
  showSettings
);


$("openSettings").addEventListener(
  "click",
  showSettings
);


// SAVE API KEY

$("saveKeyBtn").addEventListener("click", () => {

  const key = $("apiKeyInput").value.trim();

  if (!key) {

    $("keyStatus").textContent =
      "Please enter your Gemini API Key.";

    return;

  }


  localStorage.setItem(
    "sweetchat_gemini_key",
    key
  );


  localStorage.setItem(
    "sweetchat_model",
    $("modelSelect").value
  );


  $("keyStatus").textContent =
    "API Key saved successfully!";


});


// REMOVE API KEY

$("clearKeyBtn").addEventListener("click", () => {

  localStorage.removeItem(
    "sweetchat_gemini_key"
  );

  $("apiKeyInput").value = "";

  $("keyStatus").textContent =
    "API Key removed.";

});


// SAVE MODEL

$("modelSelect").addEventListener(
  "change",
  () => {

    localStorage.setItem(
      "sweetchat_model",
      $("modelSelect").value
    );

  }
);


// ==========================================
// 9. API ERROR HANDLING
// ==========================================

class GeminiError extends Error {

  constructor(message, status, code) {

    super(message);

    this.name = "GeminiError";

    this.status = status;

    this.code = code;

  }

}


function getErrorMessage(data, status) {

  return (
    data?.error?.message ||
    `Gemini API request failed (${status})`
  );

}


function isRegionError(error) {

  const message = (
    error.message || ""
  ).toLowerCase();


  return (
    message.includes("location is not supported") ||
    message.includes("user location") ||
    message.includes("region is not supported")
  );

}


function shouldFallback(error) {

  if (isRegionError(error)) {

    return false;

  }


  const status = error.status || 0;


  return (

    status === 400 ||
    status === 404 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504

  );

}


// ==========================================
// 10. GEMINI API REQUEST
// ==========================================

async function requestModel(model, history, key) {

  const contents = history.map(message => ({

    role:
      message.role === "assistant"
        ? "model"
        : "user",

    parts: [
      {
        text: message.text
      }
    ]

  }));


  const systemInstruction = {

    parts: [
      {
        text: activeCharacter.persona
      }
    ]

  };


  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;


  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    60000
  );


  try {

    const response = await fetch(url, {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

        "x-goog-api-key": key

      },

      signal: controller.signal,

      body: JSON.stringify({

        systemInstruction,

        contents,

        generationConfig: {

          temperature: 0.9,

          maxOutputTokens: 1000

        }

      })

    });


    const data = await response.json();


    if (!response.ok) {

      throw new GeminiError(

        getErrorMessage(data, response.status),

        response.status,

        data?.error?.status

      );

    }


    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();


    if (!answer) {

      throw new GeminiError(
        "The model returned an empty response.",
        200,
        "EMPTY_RESPONSE"
      );

    }


    return answer;


  } catch (error) {

    if (error.name === "AbortError") {

      throw new GeminiError(
        "Request timed out. Please try again.",
        408,
        "TIMEOUT"
      );

    }

    throw error;

  } finally {

    clearTimeout(timeout);

  }

}


// ==========================================
// 11. AUTO MODEL FALLBACK
// ==========================================

async function askGemini(history) {

  const key =
    localStorage.getItem("sweetchat_gemini_key");


  if (!key) {

    throw new Error(
      "Please add your Gemini API Key in Settings."
    );

  }


  const selectedModel =
    localStorage.getItem("sweetchat_model") ||
    "gemini-3.8-flash";


  const selectedIndex =
    AVAILABLE_MODELS.findIndex(
      model => model.id === selectedModel
    );


  const orderedModels = [

    ...AVAILABLE_MODELS.slice(
      selectedIndex >= 0 ? selectedIndex : 0
    ),

    ...AVAILABLE_MODELS.slice(
      0,
      selectedIndex >= 0 ? selectedIndex : 0
    )

  ];


  let lastError = null;


  for (let i = 0; i < orderedModels.length; i++) {

    const model = orderedModels[i];


    try {

      $("headerStatus").textContent =
        `Using ${model.name}`;


      const answer = await requestModel(
        model.id,
        history,
        key
      );


      $("headerStatus").textContent =
        activeCharacter.tag;


      if (model.id !== selectedModel) {

        console.info(
          `Auto fallback successful: ${model.id}`
        );

      }


      return answer;


    } catch (error) {

      lastError = error;

      console.error(
        `${model.name} failed:`,
        error
      );


      // Region and invalid API key errors
      // cannot be fixed by switching models.

      if (
        isRegionError(error) ||
        error.status === 401 ||
        error.status === 403
      ) {

        break;

      }


      // Continue only for recoverable errors.

      if (!shouldFallback(error)) {

        break;

      }


      // Small delay before trying another model.

      if (i < orderedModels.length - 1) {

        await new Promise(resolve =>
          setTimeout(resolve, 700)
        );

      }

    }

  }


  $("headerStatus").textContent =
    activeCharacter.tag;


  if (lastError && isRegionError(lastError)) {

    throw new Error(
      "Google Gemini API does not support your current location. Changing models cannot fix this restriction."
    );

  }


  if (lastError?.status === 401) {

    throw new Error(
      "Invalid API Key. Please check your Gemini API Key."
    );

  }


  if (lastError?.status === 403) {

    throw new Error(
      "API access denied. Check your API Key, project permissions and regional availability."
    );

  }


  if (lastError?.status === 429) {

    throw new Error(
      "All available models are currently rate-limited or over quota. Please wait and try again."
    );

  }


  throw new Error(
    lastError?.message ||
    "All available models failed. Please try again later."
  );

}


// ==========================================
// 12. TYPING INDICATOR
// ==========================================

function showTyping() {

  const typing = document.createElement("div");

  typing.className = "typing";

  typing.id = "typingIndicator";

  typing.textContent =
    `${activeCharacter.name} is typing…`;


  $("messages").appendChild(typing);

  scrollToBottom();

}


function removeTyping() {

  const typing =
    $("typingIndicator");

  if (typing) {

    typing.remove();

  }

}


// ==========================================
// 13. NEW CHAT
// ==========================================

$("newChatBtn").addEventListener("click", () => {

  histories[activeCharacter.id] = [];

  saveHistories();

  renderMessages();

  $("messageInput").focus();

});


// ==========================================
// 14. SEND MESSAGE
// ==========================================

$("chatForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    if (busy) return;


    const input = $("messageInput");

    const message = input.value.trim();


    if (!message) return;


    const key =
      localStorage.getItem("sweetchat_gemini_key");


    if (!key) {

      showSettings();

      $("keyStatus").textContent =
        "Add your API Key before chatting.";

      return;

    }


    input.value = "";


    const history = getHistory();


    // Save user message.

    history.push({

      role: "user",

      text: message

    });


    histories[activeCharacter.id] = history;

    saveHistories();


    $("welcome").style.display = "none";


    addMessageElement(
      "user",
      message
    );


    // Keep the request history manageable.

    const requestHistory = history.slice(-30);


    busy = true;

    $("sendBtn").disabled = true;


    showTyping();


    try {

      const answer = await askGemini(
        requestHistory
      );


      removeTyping();


      history.push({

        role: "assistant",

        text: answer

      });


      saveHistories();


      addMessageElement(
        "assistant",
        answer
      );


    } catch (error) {

      removeTyping();


      console.error("Chat Error:", error);


      // Show error without saving it as
      // an assistant conversation message.

      addMessageElement(
        "assistant",
        "Error: " + error.message
      );

    } finally {

      busy = false;

      $("sendBtn").disabled = false;

      scrollToBottom();

    }

  }
);


// ==========================================
// 15. ENTER TO SEND
// ==========================================

$("messageInput").addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      $("chatForm").requestSubmit();

    }

  }
);


// ==========================================
// 16. INITIALIZE APP
// ==========================================

function initializeApp() {

  renderCharacters();

  selectCharacter(characters[0]);


  const savedModel =
    localStorage.getItem("sweetchat_model");


  if (
    savedModel &&
    !AVAILABLE_MODELS.some(
      model => model.id === savedModel
    )
  ) {

    localStorage.removeItem(
      "sweetchat_model"
    );

  }


  console.log(
    "SweetChat initialized successfully."
  );

}


initializeApp();


// ==========================================
// END OF SWEETCHAT APP
// ==========================================
