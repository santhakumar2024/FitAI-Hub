"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await model.generateContent('test');
        console.log('SUCCESS:', result.response.text());
    }
    catch (err) {
        console.error('ERROR:', err.message);
    }
}
listModels();
//# sourceMappingURL=test-gemini.js.map