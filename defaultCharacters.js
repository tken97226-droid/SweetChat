Const POSITIVE_TERMS_EN = [
  'love', 'adore', 'miss you', 'cute', 'sweet', 'beautiful', 'handsome', 'kind', 'thank', 'thanks', 'appreciate', 'hug', 'kiss', 'warm', 'caring', 'like you', 'best', 'wonderful', 'amazing'
];

const POSITIVE_TERMS_MY = [
  'ချစ်', 'သတိရ', 'ကြိုက်', 'ကျေးဇူး', 'လှတယ်', 'ချောတယ်', 'နမ်း', 'ဖက်', 'အနားမှာ', 'ဂရုစိုက်', 'စိတ်ချမ်းသာ', 'အားပေး', 'အဆင်ပြေ', 'ကောင်းတယ်', 'ပျော်တယ်', 'ချစ်စရာ', 'ချစ်တယ်'
];

const NEGATIVE_TERMS_EN = [
  'hate', 'shut up', 'ugly', 'stupid', 'idiot', 'dumb', 'annoying', 'boring', 'get lost', 'leave me', 'useless', 'trash'
];

const NEGATIVE_TERMS_MY = [
  'မုန်း', 'ရုပ်ဆိုး', 'ပါးစပ်ပိတ်', 'အရူး', 'ငတုံး', 'စိတ်ပျက်', 'ထွက်သွား', 'အသုံးမကျ', 'ရွံ', 'တောက်', 'နားငြီး', 'မုန်းတယ်'
];

export function evaluateAffection(rawReplyText = '', userMessageText = '') {
  let affectionDelta = 0;
  let cleanText = rawReplyText;

  const tagMatch = rawReplyText.match(/\[AFFECTION:\s*([+-]?\d+)\]/i) ||
                   rawReplyText.match(/<!--\s*affection:\s*([+-]?\d+)\s*-->/i);

  if (tagMatch) {
    const parsed = parseInt(tagMatch[1], 10);
    if (!isNaN(parsed)) {
      affectionDelta = parsed;
    }
    cleanText = rawReplyText
      .replace(/\[AFFECTION:\s*[+-]?\d+\]/gi, '')
      .replace(/<!--\s*affection:\s*[+-]?\d+\s*-->/gi, '')
      .trim();
  }

  if (affectionDelta === 0 && userMessageText && userMessageText.trim().length > 0) {
    const lowerUser = userMessageText.toLowerCase().trim();
    let posScore = 0;
    let negScore = 0;

    for (const term of POSITIVE_TERMS_EN) if (lowerUser.includes(term)) posScore += 1;
    for (const term of POSITIVE_TERMS_MY) if (lowerUser.includes(term)) posScore += 1;
    for (const term of NEGATIVE_TERMS_EN) if (lowerUser.includes(term)) negScore += 1;
    for (const term of NEGATIVE_TERMS_MY) if (lowerUser.includes(term)) negScore += 1;

    if (negScore > 0 && negScore >= posScore) {
      affectionDelta = -Math.min(3, negScore);
    } else if (posScore > 0) {
      affectionDelta = Math.min(3, posScore);
    } else {
      affectionDelta = 1;
    }
  }

  affectionDelta = Math.max(-5, Math.min(5, affectionDelta));
  return { cleanText, affectionDelta };
}
