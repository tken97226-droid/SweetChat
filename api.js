async function sendMessageToAI(userMessage) {
  // Pollinations AI Key
  const apiKey = "sk_6vL8FztED6bHCkx5NSQ5SFC95tEvQDyR"; 
  
  const payload = {
    model: "mistral", // Romance/Uncensored Roleplay အတွက် 'mistral' သို့မဟုတ် 'evil' သုံးနိုင်ပါတယ်
    messages: [
      {
        role: "system",
        content: currentCharacter.systemPrompt || "Speak naturally in Burmese language."
      },
      ...chatHistory, // အရင် စကားပြောထားသည့် ရာဇဝင်
      { role: "user", content: userMessage }
    ]
  };

  try {
    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("Error:", error);
    return "ခဏနေမှ ပြန်စမ်းကြည့်ပေးပါနော်။";
  }
}
