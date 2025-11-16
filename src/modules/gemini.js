import { repairJSON } from "./json-repair.js";

export const SUMMARY_SCHEMA = {
    type: "object",
    properties: {
        summary: { type: "string" },
        keyInsights: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
        },
        sentiment: {
            type: "object",
            properties: {
                overall: {
                    type: "string",
                    enum: ["positive", "negative", "neutral", "mixed"],
                },
                positive: { type: "number" },
                negative: { type: "number" },
                neutral: { type: "number" },
            },
        },
        topInfluencers: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    handle: { type: "string" },
                    name: { type: "string" },
                    reason: { type: "string" },
                },
                required: ["reason"],
            },
        },
        keyThemes: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
        },
    },
    required: ["summary", "keyInsights", "sentiment", "keyThemes", "topInfluencers"],
};

export async function callGeminiAPI(prompt, options = {}) {
    const config =
        typeof options === "boolean"
            ? { structuredOutput: options }
            : options || {};
    const {
        structuredOutput = false,
        schema = SUMMARY_SCHEMA,
        maxOutputTokens,
    } = config;
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

    if (!geminiApiKey) {
        throw new Error(
            "Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file"
        );
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`;

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: prompt,
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: maxOutputTokens || (structuredOutput ? 4096 : 1024),
        },
    };

    if (structuredOutput) {
        requestBody.generationConfig.responseMimeType = "application/json";
        requestBody.generationConfig.responseSchema = schema;
    }

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();

    if (
        !data.candidates ||
        !Array.isArray(data.candidates) ||
        data.candidates.length === 0
    ) {
        throw new Error(
            "No candidates in Gemini API response. Please check your API key and try again."
        );
    }

    if (structuredOutput) {
        const text = data.candidates[0]?.content?.parts?.[0]?.text;
        if (!text) {
            const part = data.candidates[0]?.content?.parts?.[0];
            if (part && typeof part === "object" && !part.text) {
                throw new Error(
                    "Structured response is empty or in unexpected format. Please try again or check your Gemini API key."
                );
            }
            throw new Error(
                "No response text received from Gemini API. Please check your API key and try again."
            );
        }
        try {
            return JSON.parse(text);
        } catch (error) {
            try {
                return JSON.parse(repairJSON(text));
            } catch (repairError) {
                const errorPosition = error.message.match(/position (\d+)/);
                const position = errorPosition ? parseInt(errorPosition[1], 10) : 0;
                const contextStart = Math.max(0, position - 100);
                const contextEnd = Math.min(text.length, position + 100);
                const context = text.substring(contextStart, contextEnd);
                throw new Error(
                    `Failed to parse structured response: ${error.message}. The JSON response appears to be malformed or truncated. Context around error: ...${context}... Please try generating the summary again.`
                );
            }
        }
    }

    return data.candidates[0]?.content?.parts?.[0]?.text || "No response generated";
}

