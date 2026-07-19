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
    // Attempt 1: Extract just the first complete JSON object/array
    let depth = 0;
    let inString = false;
    let escapeActive = false;
    let endIdx = -1;
    let sanitized = "";
    let lastNonWhitespaceChar = '';

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (char === '\\') {
        escapeActive = !escapeActive;
        sanitized += char;
      } else if (char === '"') {
        if (!escapeActive) inString = !inString;
        sanitized += char;
        escapeActive = false;
        if (!inString) lastNonWhitespaceChar = '"';
      } else if (!inString) {
        if (char === '{' || char === '[') {
          depth++;
          sanitized += char;
          lastNonWhitespaceChar = char;
        } else if (char === '}' || char === ']') {
          // Remove trailing comma if exists
          if (lastNonWhitespaceChar === ',') {
            sanitized = sanitized.replace(/,\s*$/, '');
          }
          depth--;
          sanitized += char;
          lastNonWhitespaceChar = char;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        } else if (!/\s/.test(char)) {
          sanitized += char;
          lastNonWhitespaceChar = char;
        } else {
          sanitized += char;
        }
        escapeActive = false;
      } else {
        // Fix unescaped newlines in strings
        if (char === '\n') {
          sanitized += '\\n';
        } else if (char === '\r') {
          sanitized += '\\r';
        } else if (char === '\t') {
          sanitized += '\\t';
        } else {
          sanitized += char;
        }
        escapeActive = false;
      }
    }

    if (depth === 0 && sanitized.length > 0) {
      try {
        return JSON.parse(sanitized);
      } catch (finalError) {
        throw finalError;
      }
    }
    
    throw e;
  }
}

console.log(robustParseJSON('{ "a": 1, } \n { "b": 2 }'));
console.log(robustParseJSON('{ "a": "hello\nworld", "b": [1, 2,] }'));
