"use strict";
// src/services/ai.service.ts
// AI Plan Generation Service using OpenAI GPT-4o (or Grok xAI)
// Configurable via AI_PROVIDER env variable
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateSingleFoodNutrition = exports.estimateCaloriesFromAI = exports.generateQuickTip = exports.generateAIPlan = void 0;
const openai_1 = __importDefault(require("openai"));
const generative_ai_1 = require("@google/generative-ai");
const db_1 = require("../config/db");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
// ─────────────────────────────────────────
// CLIENT INITIALIZATION
// ─────────────────────────────────────────
const getOpenAIClient = () => {
    if (env_1.config.aiProvider === 'grok') {
        return new openai_1.default({
            apiKey: env_1.config.grokApiKey,
            baseURL: env_1.config.grokBaseUrl,
        });
    }
    return new openai_1.default({ apiKey: env_1.config.openaiApiKey });
};
const getGeminiClient = () => {
    return new generative_ai_1.GoogleGenerativeAI(env_1.config.geminiApiKey || '');
};
const getModel = () => {
    if (env_1.config.aiProvider === 'grok')
        return 'grok-2-1212';
    if (env_1.config.aiProvider === 'gemini')
        return env_1.config.geminiModel;
    return env_1.config.openaiModel; // gpt-4o
};
// ─────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────
const SYSTEM_PROMPT = `You are FitAI — a master fitness architect. Your mission is to provide high-fidelity, Indian-context fitness strategies. Respond ONLY with a valid JSON object. No preamble.

Rules:
1. Medical Priority: Strictly accommodate conditions (e.g., knee pain = no jumping).
2. Indian Nutrition: Use practical Indian dietary staples.
3. Realism: Specific YouTube links for techniques.
4. Duration: Plan for exactly the requested days.
5. Quality: Highly precise, actionable steps.`;
// ─────────────────────────────────────────
// USER PROMPT BUILDER
// ─────────────────────────────────────────
const buildUserPrompt = (input) => {
    const { durationDays, age, gender, height, weight, bmi, activityLevel, medicalConditions, goals, preferences } = input;
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.toLocaleString('en-US', { weekday: 'long' });
    return `Architect a ${durationDays}-day fitness journey:
- User: ${age}y ${gender}, ${height}cm/${weight}kg (BMI: ${bmi})
- Context: ${activityLevel}, Conditions: ${medicalConditions.join(', ') || 'None'}
- Goals: ${goals.join(', ')}, Preferences: ${preferences.join(', ') || 'None'}
- Timeline: Plan starts exactly on ${dateStr} (${dayOfWeek}). 
- Instruction: Optimize Day 1 in the JSON response for the start date and day of the week.

RESPONSE SCHEMA (STRICT):
{
  "dailyPlan": {
    "day1": {
      "diet": {
        "m1_bk": {"name": "str", "cal": num, "prot": num},
        "m2_ln": {"name": "str", "cal": num, "prot": num},
        "m3_dn": {"name": "str", "cal": num, "prot": num},
        "snack": {"name": "str", "cal": num},
        "water": "str",
        "total": {"cal": num, "prot": num}
      },
      "workout": [{ "name": "str", "sets": num, "reps": num, "link": "url", "tip": "str" }],
      "yoga": [{ "pose": "str", "benefits": "str", "duration": "str" }],
      "tip": "str",
      "calBurn": num
    } // ... repeat to day${durationDays}
  },
  "summary": {"tdee": num, "dailyCal": num, "macros": {"p": num, "c": num, "f": num}},
  "notes": "str",
  ${medicalConditions.length > 0 ? '"disclaimer": "str",' : ''}
  "hydration": "str"
}`;
};
// ─────────────────────────────────────────
// GENERATE PLAN
// ─────────────────────────────────────────
const generateAIPlan = async (userId, input) => {
    const model = getModel();
    const startTime = Date.now();
    const provider = env_1.config.aiProvider;
    logger_1.logger.info(`Generating AI plan for user ${userId} using ${provider} (${model})`);
    try {
        let content = null;
        let inputTokens;
        let outputTokens;
        let usedProvider = provider;
        let usedModel = model;
        const tryGenerate = async (currentProvider, currentModel) => {
            if (currentProvider === 'gemini') {
                const genAI = getGeminiClient();
                const geminiModel = genAI.getGenerativeModel({
                    model: currentModel,
                    generationConfig: {
                        responseMimeType: "application/json",
                        maxOutputTokens: 8192,
                        temperature: 0.7
                    }
                });
                const userPrompt = buildUserPrompt(input);
                const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;
                const result = await geminiModel.generateContent({
                    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
                });
                return {
                    content: result.response.text(),
                    inputTokens: undefined,
                    outputTokens: undefined
                };
            }
            else {
                const client = getOpenAIClient();
                const response = await client.chat.completions.create({
                    model: currentModel,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: buildUserPrompt(input) },
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.7,
                    max_tokens: 8192,
                });
                return {
                    content: response.choices[0]?.message?.content,
                    inputTokens: response.usage?.prompt_tokens,
                    outputTokens: response.usage?.completion_tokens
                };
            }
        };
        const result = await tryGenerate(usedProvider, usedModel);
        content = result.content;
        if (!content)
            throw new Error('AI returned empty response');
        // Attempt to parse JSON - Handle partial responses or leading/trailing markdown
        let parsedContent;
        try {
            // Robust extraction: find first '{' and last '}'
            const firstBrace = content.indexOf('{');
            const lastBrace = content.lastIndexOf('}');
            if (firstBrace === -1 || lastBrace === -1)
                throw new Error('No JSON object found');
            const cleanContent = content.substring(firstBrace, lastBrace + 1).trim();
            parsedContent = JSON.parse(cleanContent);
        }
        catch (parseErr) {
            logger_1.logger.error('🔴 [AI PARSE ERROR]:', {
                error: parseErr.message,
                rawLength: content.length,
                isTruncated: content.endsWith('...') || !content.trim().endsWith('}')
            });
            console.log('--- RAW AI CONTENT START ---');
            console.log(content);
            console.log('--- RAW AI CONTENT END ---');
            throw new Error('AI produced invalid data structure. This usually happens with very long plans. Please try a shorter duration (e.g. 5 days) or try again.');
        }
        const latencyMs = Date.now() - startTime;
        await db_1.prisma.aIGenerationLog.create({
            data: {
                userId,
                provider,
                model,
                inputTokens: result.inputTokens,
                outputTokens: result.outputTokens,
                latencyMs,
                status: 'success',
            },
        });
        return parsedContent;
    }
    catch (error) {
        const latencyMs = Date.now() - startTime;
        logger_1.logger.error(`AI plan generation failed (${latencyMs}ms):`, error);
        // Detailed logging
        await db_1.prisma.aIGenerationLog.create({
            data: {
                userId,
                provider,
                model,
                latencyMs,
                status: 'failure',
                error: `${error.name}: ${error.message}`,
            },
        }).catch((e) => console.error('❌ Log failed:', e));
        throw error; // Re-throw the actual error for the controller to handle
    }
};
exports.generateAIPlan = generateAIPlan;
// ─────────────────────────────────────────
// GENERATE QUICK RECOMMENDATION
// ─────────────────────────────────────────
const generateQuickTip = async (userId, context) => {
    const model = getModel();
    try {
        if (env_1.config.aiProvider === 'gemini') {
            const genAI = getGeminiClient();
            const geminiModel = genAI.getGenerativeModel({ model });
            const result = await geminiModel.generateContent(`You are a fitness coach. Provide concise, actionable tips in 2-3 sentences. Be encouraging and specific.\n\nContext: ${context}`);
            return result.response.text();
        }
        else {
            const client = getOpenAIClient();
            const response = await client.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: 'You are a fitness coach. Provide concise, actionable tips in 2-3 sentences. Be encouraging and specific.' },
                    { role: 'user', content: context },
                ],
                temperature: 0.8,
                max_tokens: 200,
            });
            return response.choices[0]?.message?.content ?? 'Keep pushing forward! Consistency is key to achieving your fitness goals.';
        }
    }
    catch (error) {
        logger_1.logger.error('Quick tip generation failed:', error);
        return 'Stay hydrated and consistent with your workouts. Every step counts!';
    }
};
exports.generateQuickTip = generateQuickTip;
// ─────────────────────────────────────────
// ESTIMATE CALORIES (Multi-meal)
// ─────────────────────────────────────────
const estimateCaloriesFromAI = async (meals) => {
    const model = getModel();
    const prompt = `You are a nutrition expert. Estimate the total calories, protein (g), carbs (g), and fat (g) for the following meals. 
  
  Meals:
  ${meals.map((m, i) => `${i + 1}. ${m}`).join('\n')}
  
  Return ONLY a JSON object with this structure:
  {
    "totalCalories": number,
    "totalProtein": number,
    "totalCarbs": number,
    "totalFat": number,
    "breakdown": [
      { "meal": "string", "calories": number, "protein": number, "carbs": number, "fat": number }
    ]
  }`;
    try {
        let content = null;
        if (env_1.config.aiProvider === 'gemini') {
            const genAI = getGeminiClient();
            const geminiModel = genAI.getGenerativeModel({
                model: env_1.config.geminiModel,
                generationConfig: { responseMimeType: "application/json" }
            });
            const result = await geminiModel.generateContent(prompt);
            content = result.response.text();
        }
        else {
            const client = getOpenAIClient();
            const response = await client.chat.completions.create({
                model: env_1.config.openaiModel,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            });
            content = response.choices[0]?.message?.content || null;
        }
        if (!content)
            return { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, breakdown: [] };
        // Robust extraction: find first '{' and last '}'
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        const cleanContent = content.substring(firstBrace, lastBrace + 1).trim();
        return JSON.parse(cleanContent);
    }
    catch (error) {
        logger_1.logger.error('Calories estimation from AI failed:', error);
        throw new Error('Failed to estimate calories from AI');
    }
};
exports.estimateCaloriesFromAI = estimateCaloriesFromAI;
// ─────────────────────────────────────────
// ESTIMATE SINGLE FOOD NUTRITION (Vitamins & Minerals)
// ─────────────────────────────────────────
const estimateSingleFoodNutrition = async (name, grams) => {
    const model = getModel();
    const prompt = `You are a world-class clinical nutritionist. Precise nutrition analysis for:
  Food: ${name}
  Quantity: ${grams}g
  
  Provide a high-fidelity estimation including kcal, protein, vitamins and minerals.
  Return ONLY this JSON structure:
  {
    "name": "${name}",
    "grams": ${grams},
    "calories": number,
    "protein": number,
    "vitamins": ["string"],
    "minerals": ["string"],
    "confidence": "high" | "medium" | "low"
  }`;
    try {
        let content = null;
        // Priority Fallback Logic: Try Gemini if key exists, as it's our most reliable provider for this task
        const useGemini = env_1.config.aiProvider === 'gemini' || (!!env_1.config.geminiApiKey && !env_1.config.openaiApiKey);
        if (useGemini) {
            logger_1.logger.info(`✨ AI Scan: Using Gemini for "${name}"`);
            const genAI = getGeminiClient();
            const geminiModel = genAI.getGenerativeModel({
                model: env_1.config.geminiModel,
                generationConfig: { responseMimeType: "application/json" }
            });
            const result = await geminiModel.generateContent(prompt);
            content = result.response.text();
        }
        else {
            logger_1.logger.info(`✨ AI Scan: Using OpenAI for "${name}"`);
            const client = getOpenAIClient();
            const response = await client.chat.completions.create({
                model: env_1.config.openaiModel,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            });
            content = response.choices[0]?.message?.content || null;
        }
        if (!content)
            throw new Error('AI returned empty response');
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) {
            logger_1.logger.error('❌ [AI NUTRITION ERROR]: No JSON found in response', { content });
            throw new Error('AI produced invalid data format');
        }
        const cleanContent = content.substring(firstBrace, lastBrace + 1).trim();
        return JSON.parse(cleanContent);
    }
    catch (error) {
        logger_1.logger.error('Single food nutrition estimation failed:', error);
        // Log the error message to console for immediate visibility if possible
        console.error(`🔴 [FATAL AI ERROR]: ${error.message}`);
        throw new Error(`Nutrition analysis failed: ${error.message}`);
    }
};
exports.estimateSingleFoodNutrition = estimateSingleFoodNutrition;
//# sourceMappingURL=ai.service.js.map