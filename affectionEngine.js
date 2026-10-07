export function evaluateAffection(replyText, userText) {
  // Simple affection logic based on text length or basic interaction
  let delta = 1; // Basic increment per message
  
  if (userText.length > 20) {
    delta += 1;
  }

  // Clean text removal if needed
  const cleanText = replyText;

  return {
    cleanText,
    affectionDelta: delta
  };
}
