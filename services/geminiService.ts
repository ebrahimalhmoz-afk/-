
import { GoogleGenAI } from "@google/genai";

// Fix: Initialize GoogleGenAI with a direct reference to process.env.API_KEY as per coding guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getHealthAdvice = async (steps: number, weight: number = 70) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بناءً على مشي ${steps} خطوة اليوم لشخص يزن ${weight} كجم، قدم نصيحة صحية قصيرة ومحفزة باللغة العربية. ركز على حرق السعرات والفوائد الصحية.`,
      config: {
        temperature: 0.7,
        // Fix: Added thinkingConfig with thinkingBudget when maxOutputTokens is specified to prevent blocked responses
        maxOutputTokens: 200,
        thinkingConfig: { thinkingBudget: 100 },
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "استمر في المشي! كل خطوة تقربك من أهدافك الصحية والمالية.";
  }
};

export const analyzeActivity = async (history: any) => {
    // Simulated history analysis
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `حلل هذا السجل للمشي: ${JSON.stringify(history)}. اقترح تحدياً جديداً للمستخدم لزيادة أرباحه وصحته. الإجابة بالعربية.`,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        return response.text;
    } catch (e) {
        return "أنت تقوم بعمل رائع! جرب المشي لمسافة أطول غداً.";
    }
};
