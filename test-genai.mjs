import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({apiKey: 'foo'});
console.log(typeof ai.models.generateContent);
