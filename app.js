// ==========================================
// SWEETCHAT - GEMINI API HANDLER
// ==========================================

export async function sendChatMessage(apiKey, modelName, systemPrompt, messages) {
    // Gemini API Endpoint (v1beta)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // 1. System Prompt / Instruction ကို Gemini format ဖြင့် တည်ဆောက်ခြင်း
    const systemInstruction = {
        parts: [{ text: systemPrompt }]
    };

    // 2. Chat History များကို Gemini ပုံစံ (role: 'user' သို့မဟုတ် 'model') သို့ ပြောင်းလဲခြင်း
    const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    // 3. API Payload တည်ဆောက်ခြင်း
    const requestData = {
        system_instruction: systemInstruction,
        contents: contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        // Error စစ်ဆေးခြင်း
        if (result.error) {
            throw new Error(result.error.message || "Gemini API Error");
        }

        // Gemini ဆီက ပြန်လာတဲ့ ဖြေကြားချက် စာသားကို ထုတ်ယူခြင်း
        if (
            result.candidates &&
            result.candidates[0].content &&
            result.candidates[0].content.parts &&
            result.candidates[0].content.parts[0].text
        ) {
            return result.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Unexpected response structure from Gemini API.");
        }

    } catch (error) {
        console.error("API Fetch Failed:", error);
        throw error;
    }
}
