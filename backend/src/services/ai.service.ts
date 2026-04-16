// src/services/ai.service.ts
// AI Plan Generation Service using OpenAI GPT-4o (or Grok xAI)
// Configurable via AI_PROVIDER env variable

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../config/db';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { GeneratePlanInput } from '../validators/plan.schema';

// ─────────────────────────────────────────
// CLIENT INITIALIZATION
// ─────────────────────────────────────────

const getOpenAIClient = (): OpenAI => {
  if (config.aiProvider === 'grok') {
    return new OpenAI({
      apiKey: config.grokApiKey,
      baseURL: config.grokBaseUrl,
    });
  }
  return new OpenAI({ apiKey: config.openaiApiKey });
};

const getGeminiClient = (): GoogleGenerativeAI => {
  return new GoogleGenerativeAI(config.geminiApiKey || '');
};

const getModel = (): string => {
  if (config.aiProvider === 'grok') return 'grok-2-1212';
  if (config.aiProvider === 'gemini') return config.geminiModel;
  return config.openaiModel; // gpt-4o
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

const buildUserPrompt = (input: GeneratePlanInput): string => {
  const { 
    durationDays, age, gender, height, weight, bmi, 
    activityLevel, medicalConditions, goals, preferences 
  } = input;

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.toLocaleString('en-US', { weekday: 'long' });

  return `Architect a ${durationDays}-day fitness journey using a 7-DAY FOUNDATIONAL PATTERN.
- User: ${age}y ${gender}, ${height}cm/${weight}kg (BMI: ${bmi})
- Context: ${activityLevel}, Conditions: ${medicalConditions.join(', ') || 'None'}
- Goals: ${goals.join(', ')}
- Timeline: Plan starts exactly on ${dateStr} (${dayOfWeek}). 

INSTRUCTIONS (FOR SPEED):
1. Provide exactly 7 days (Day 1-7).
2. Descriptions: BE CONCISE (max 10 words per item). 
3. Logic: This split will repeat for ${durationDays} days.
4. Language: Simplified English/Hindi context.

RESPONSE SCHEMA (STRICT JSON):
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
    } // ... repeat to day7
  },
  "summary": {"tdee": num, "dailyCal": num, "macros": {"p": num, "c": num, "f": num}},
  "notes": "Progression tips for ${durationDays} days.",
  "hydration": "str"
}`;
};

// ─────────────────────────────────────────
// GENERATE PLAN
// ─────────────────────────────────────────

export const generateAIPlan = async (userId: string, input: GeneratePlanInput): Promise<Record<string, unknown>> => {
  const model = getModel();
  const startTime = Date.now();
  const provider = config.aiProvider;

  logger.info(`Generating AI plan for user ${userId} using ${provider} (${model})`);

  try {
    let content: string | null = null;
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;
    let usedProvider = provider;
    let usedModel = model;

    const tryGenerate = async (currentProvider: string, currentModel: string) => {
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
      } else {
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

    if (!content) throw new Error('AI returned empty response');

    // Attempt to parse JSON - Handle partial responses or leading/trailing markdown
    let parsedContent;
    try {
      // Robust extraction: find first '{' and last '}'
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON object found');
      
      const cleanContent = content.substring(firstBrace, lastBrace + 1).trim();
      parsedContent = JSON.parse(cleanContent);
    } catch (parseErr: any) {
      logger.error('🔴 [AI PARSE ERROR]:', { 
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
    
    await (prisma as any).aIGenerationLog.create({
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
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    logger.error(`AI plan generation failed (${latencyMs}ms):`, error);

    // Detailed logging
    await (prisma as any).aIGenerationLog.create({
      data: {
        userId,
        provider,
        model,
        latencyMs,
        status: 'failure',
        error: `${error.name}: ${error.message}`,
      },
    }).catch((e: any) => console.error('❌ Log failed:', e));

    throw error; // Re-throw the actual error for the controller to handle
  }
};

// ─────────────────────────────────────────
// GENERATE QUICK RECOMMENDATION
// ─────────────────────────────────────────

export const generateQuickTip = async (userId: string, context: string): Promise<string> => {
  const model = getModel();

  try {
    if (config.aiProvider === 'gemini') {
      const genAI = getGeminiClient();
      const geminiModel = genAI.getGenerativeModel({ model });
      const result = await geminiModel.generateContent(`You are a fitness coach. Provide concise, actionable tips in 2-3 sentences. Be encouraging and specific.\n\nContext: ${context}`);
      return result.response.text();
    } else {
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
  } catch (error) {
    logger.error('Quick tip generation failed:', error);
    return 'Stay hydrated and consistent with your workouts. Every step counts!';
  }
};
// ─────────────────────────────────────────
// ESTIMATE CALORIES (Multi-meal)
// ─────────────────────────────────────────

export const estimateCaloriesFromAI = async (meals: string[]): Promise<any> => {
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
    let content: string | null = null;
    if (config.aiProvider === 'gemini') {
      const genAI = getGeminiClient();
      const geminiModel = genAI.getGenerativeModel({ 
        model: config.geminiModel,
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await geminiModel.generateContent(prompt);
      content = result.response.text();
    } else {
      const client = getOpenAIClient();
      const response = await client.chat.completions.create({
        model: config.openaiModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });
      content = response.choices[0]?.message?.content || null;
    }

    if (!content) return { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, breakdown: [] };
    
    // Robust extraction: find first '{' and last '}'
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    const cleanContent = content.substring(firstBrace, lastBrace + 1).trim();
    
    return JSON.parse(cleanContent);
  } catch (error) {
    logger.error('Calories estimation from AI failed:', error);
    throw new Error('Failed to estimate calories from AI');
  }
};

// ─────────────────────────────────────────
// ESTIMATE SINGLE FOOD NUTRITION (Vitamins & Minerals)
// ─────────────────────────────────────────

export const estimateSingleFoodNutrition = async (name: string, grams: number): Promise<any> => {
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
    let content: string | null = null;
    
    // Priority Fallback Logic: Try Gemini if key exists, as it's our most reliable provider for this task
    const useGemini = config.aiProvider === 'gemini' || (!!config.geminiApiKey && !config.openaiApiKey);
    
    if (useGemini) {
      logger.info(`✨ AI Scan: Using Gemini for "${name}"`);
      const genAI = getGeminiClient();
      const geminiModel = genAI.getGenerativeModel({ 
        model: config.geminiModel,
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await geminiModel.generateContent(prompt);
      content = result.response.text();
    } else {
      logger.info(`✨ AI Scan: Using OpenAI for "${name}"`);
      const client = getOpenAIClient();
      const response = await client.chat.completions.create({
        model: config.openaiModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });
      content = response.choices[0]?.message?.content || null;
    }

    if (!content) throw new Error('AI returned empty response');
    
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      logger.error('❌ [AI NUTRITION ERROR]: No JSON found in response', { content });
      throw new Error('AI produced invalid data format');
    }

    const cleanContent = content.substring(firstBrace, lastBrace + 1).trim();
    return JSON.parse(cleanContent);
  } catch (error: any) {
    logger.error('Single food nutrition estimation failed:', error);
    // Log the error message to console for immediate visibility if possible
    console.error(`🔴 [FATAL AI ERROR]: ${error.message}`);
    throw new Error(`Nutrition analysis failed: ${error.message}`);
  }
};
