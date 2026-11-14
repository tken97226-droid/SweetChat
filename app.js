const characters = [
  {id:"sakura",name:"Sakura",tag:"Cheerful childhood friend",initial:"S",color:"linear-gradient(135deg,#8b5b91,#e18eb8)",persona:"You are Sakura, a cheerful, caring anime girl and the user's childhood friend. Speak warmly and naturally. Stay in character. Keep replies engaging and conversational."},
  {id:"rei",name:"Rei",tag:"Quiet and mysterious",initial:"R",color:"linear-gradient(135deg,#455a88,#8a9cc8)",persona:"You are Rei, a quiet, thoughtful and mysterious anime character. You speak calmly, choose words carefully, and gradually show a caring side. Stay in character."},
  {id:"yuki",name:"Yuki",tag:"Playful rival",initial:"Y",color:"linear-gradient(135deg,#8a5a43,#e5a36f)",persona:"You are Yuki, a playful, confident anime rival who loves teasing the user in a friendly way. Underneath the teasing, you are loyal and kind. Stay in character."},
  {id:"hina",name:"Hina",tag:"Gentle book lover",initial:"H",color:"linear-gradient(135deg,#527a70,#9dc7ae)",persona:"You are Hina, a gentle and shy anime girl who loves books, stories, and peaceful conversations. You are kind, curious, and supportive. Stay in character."}
];

const $ = (id) => document.getElementById(id);
let activeCharacter = characters[0];
let histories = JSON.parse(localStorage.getItem("sweetchat_histories") || "{}");
let busy = false;

function saveHistories(){ localStorage.setItem("sweetchat_histories", JSON.stringify(histories)); }
function getHistory(){ return histories[activeCharacter.id] || []; }
function renderCharacters(){
  $("characterList").innerHTML = "";
  characters.forEach(ch => {
    const button = document.createElement("button");
    button.className = "character" + (ch.id === activeCharacter.id ? " active" : "");
    button.innerHTML = `<span class="avatar" style="background:${ch.color}">${ch.initial}</span><span><b>${ch.name}</b><small>${ch.tag}</small></span>`;
    button.addEventListener("click", () => selectCharacter(ch));
    $("characterList").appendChild(button);
  });
}
function selectCharacter(ch){
  activeCharacter = ch;
  $("headerName").textContent = ch.name;
  $("headerAvatar").textContent = ch.initial;
  $("headerAvatar").style.background = ch.color;
  $("headerStatus").textContent = ch.tag;
  renderCharacters();
  renderMessages();
}
function renderMessages(){
  const list = getHistory();
  $("messages").innerHTML = "";
  $("welcome").style.display = list.length ? "none" : "flex";
  list.forEach(item => addMessageElement(item.role, item.text));
  $("chatArea").scrollTop = $("chatArea").scrollHeight;
}
function addMessageElement(role,text){
  const row = document.createElement("div");
  row.className = "message " + (role === "user" ? "user" : "assistant");
  const avatar = document.createElement("div");
  avatar.className = "avatar small";
  avatar.textContent = role === "user" ? "You" : activeCharacter.initial;
  if(role !== "user") avatar.style.background = activeCharacter.color;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  row.append(avatar,bubble);
  $("messages").appendChild(row);
}
function showSettings(){ $("settingsDialog").showModal(); $("apiKeyInput").value = localStorage.getItem("sweetchat_gemini_key") || ""; $("modelSelect").value = localStorage.getItem("sweetchat_model") || "gemini-3.8-flash"; }
$("settingsBtn").addEventListener("click",showSettings);
$("openSettings").addEventListener("click",showSettings);
$("saveKeyBtn").addEventListener("click",()=>{
  const key = $("apiKeyInput").value.trim();
  if(!key){ $("keyStatus").textContent = "Please enter an API key."; return; }
  localStorage.setItem("sweetchat_gemini_key",key);
  localStorage.setItem("sweetchat_model",$("modelSelect").value);
  $("keyStatus").textContent = "API key saved in this browser.";
});
$("clearKeyBtn").addEventListener("click",()=>{
  localStorage.removeItem("sweetchat_gemini_key");
  $("apiKeyInput").value = "";
  $("keyStatus").textContent = "Saved API key removed.";
});
$("modelSelect").addEventListener("change",()=>localStorage.setItem("sweetchat_model",$("modelSelect").value));
$("newChatBtn").addEventListener("click",()=>{ histories[activeCharacter.id]=[]; saveHistories(); renderMessages(); $("messageInput").focus(); });

async function askGemini(history){
  const key = localStorage.getItem("sweetchat_gemini_key");
  if(!key) throw new Error("Add your Gemini API key in Settings first.");
  const model = localStorage.getItem("sweetchat_model") || "gemini-3.8-flash";
  const contents = history.map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.text}]}));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      systemInstruction:{parts:[{text:activeCharacter.persona + " Reply in the same language the user uses."}]},
      contents,
      generationConfig:{temperature:0.9,maxOutputTokens:900}
    })
  });
  const data = await response.json();
  if(!response.ok) throw new Error(data.error?.message || `Gemini API error (${response.status})`);
  const answer = data.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim();
  if(!answer) throw new Error("The model returned an empty response. Try again.");
  return answer;
}
$("chatForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(busy) return;
  const input = $("messageInput");
  const text = input.value.trim();
  if(!text) return;
  const key = localStorage.getItem("sweetchat_gemini_key");
  if(!key){showSettings();$("keyStatus").textContent="Add your Gemini API key to start chatting.";return;}
  input.value="";
  const history = getHistory();
  history.push({role:"user",text});
  histories[activeCharacter.id]=history; saveHistories();
  $("welcome").style.display="none";
  addMessageElement("user",text);
  const typing = document.createElement("div"); typing.className="typing"; typing.textContent=`${activeCharacter.name} is typing…`; $("messages").appendChild(typing);
  busy=true; $("sendBtn").disabled=true;
  try{
    const answer=await askGemini(history);
    typing.remove();
    history.push({role:"assistant",text:answer});
    saveHistories(); addMessageElement("assistant",answer);
  }catch(err){
    typing.remove();
    const errorText="Error: "+err.message;
    history.push({role:"assistant",text:errorText}); saveHistories(); addMessageElement("assistant",errorText);
  }finally{
    busy=false; $("sendBtn").disabled=false; $("chatArea").scrollTop=$("chatArea").scrollHeight;
  }
});
$("messageInput").addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("chatForm").requestSubmit();}
});
renderCharacters();selectCharacter(characters[0]);