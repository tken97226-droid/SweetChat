const POSITIVE_WORDS = [
  'ချစ်တယ်',
  'ချစ်တယ်နော်',
  'လွမ်းတယ်',
  'သတိရတယ်',
  'လှတယ်',
  'ချစ်စရာလေး',
  'ကျေးဇူးတင်တယ်',
  'ဂရုစိုက်တယ်',
  'မင်းကိုချစ်',
  'kiss',
  'love',
  'beautiful',
  'cute',
  'sweet'
];

const NEGATIVE_WORDS = [
  'မုန်းတယ်',
  'မကြိုက်ဘူး',
  'စိတ်ဆိုးတယ်',
  'မင်းကိုမုန်း',
  'hate',
  'annoying',
  'stupid'
];

export function evaluateAffection(reply, userMessage) {
  const text = String(userMessage || '').toLowerCase();

  let affectionDelta = 0;

  for (const word of POSITIVE_WORDS) {
    if (text.includes(word.toLowerCase())) {
      affectionDelta += 2;
    }
  }

  for (const word of NEGATIVE_WORDS) {
    if (text.includes(word.toLowerCase())) {
      affectionDelta -= 3;
    }
  }

  affectionDelta = Math.max(-5, Math.min(5, affectionDelta));

  return {
    affectionDelta,
    cleanText: String(reply || '').trim()
  };
}

export function relationshipFor(affection = 0) {
  const score = Math.max(0, Math.min(100, Number(affection) || 0));

  if (score >= 90) return 'Soulmate 💍';
  if (score >= 75) return 'Deeply in Love ❤️';
  if (score >= 55) return 'Lover 💕';
  if (score >= 35) return 'Close Friend 🥰';
  if (score >= 15) return 'Friend 😊';

  return 'Stranger 🌱';
}
