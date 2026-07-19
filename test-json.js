function robustParseJSON(text) {
  let cleaned = text.trim();
  const match = /```(?:json)?\s*([\s\S]*?)\s*```/gi.exec(cleaned);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else {
    startIdx = firstBrace !== -1 ? firstBrace : firstBracket;
  }
  
  if (startIdx !== -1) {
    cleaned = cleaned.substring(startIdx);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    if (e.message.includes('Unexpected non-whitespace character after JSON')) {
      // The JSON is valid but has trailing characters. 
      // Let's find where the first valid JSON object ends.
      let depth = 0;
      let inString = false;
      let escapeActive = false;
      let endIdx = -1;
      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        if (char === '\\') {
          escapeActive = !escapeActive;
        } else if (char === '"') {
          if (!escapeActive) inString = !inString;
          escapeActive = false;
        } else if (!inString) {
          if (char === '{' || char === '[') depth++;
          else if (char === '}' || char === ']') {
            depth--;
            if (depth === 0) {
              endIdx = i;
              break;
            }
          }
          escapeActive = false;
        } else {
          escapeActive = false;
        }
      }
      if (endIdx !== -1) {
        return JSON.parse(cleaned.substring(0, endIdx + 1));
      }
    }
    
    // If it still fails, just throw
    throw e;
  }
}
console.log(robustParseJSON('{ "a": 1 } \n { "b": 2 }'));
