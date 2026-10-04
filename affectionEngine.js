// affectionEngine.js
export function evaluateAffection(replyText, userMessage) {
  let affectionDelta = 0;
  let cleanText = replyText;

  // AI response ထဲတွင် [AFFECTION: +2] သို့မဟုတ် [AFFECTION: -1] ပါမပါ စစ်ဆေးခြင်း
  const match = replyText.match(/\[AFFECTION:\s*([+-]?\d+)\]/i);
  if (match) {
    affectionDelta = parseInt(match[1], 10) || 0;
    cleanText = replyText.replace(/\[AFFECTION:\s*[+-]?\d+\]/gi, '').trim();
  } else {
    // စာသား အမူအရာအပေါ် မူတည်၍ ရမှတ် တွက်ချက်ခြင်း
    const lowerUserMsg = userMessage.toLowerCase();
    const sweetWords = ['ချစ်တယ်', 'ကြိုက်တယ်', 'လှတယ်', 'သဘောကျတယ်', 'မိုက်တယ်', 'cute', 'love'];
    const rudeWords = ['မုန်းတယ်', 'နုံတယ်', 'ရုပ်ဆိုး', 'ဆိုးတယ်', 'hate', 'stupid'];

    if (sweetWords.some(w => lowerUserMsg.includes(w))) {
      affectionDelta = 2;
    } else if (rudeWords.some(w => lowerUserMsg.includes(w))) {
      affectionDelta = -2;
    }
  }

  return { cleanText, affectionDelta };
}
